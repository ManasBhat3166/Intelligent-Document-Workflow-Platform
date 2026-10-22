package com.manasbhat.documentworkflowplatform.service;

import com.manasbhat.documentworkflowplatform.dto.ApprovalActionResponse;
import com.manasbhat.documentworkflowplatform.entity.ApprovalAction;
import com.manasbhat.documentworkflowplatform.entity.ApprovalStatus;
import com.manasbhat.documentworkflowplatform.entity.DocumentEntity;
import com.manasbhat.documentworkflowplatform.entity.DocumentStatus;
import com.manasbhat.documentworkflowplatform.repository.ApprovalActionRepository;
import com.manasbhat.documentworkflowplatform.repository.DocumentRepository;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import com.manasbhat.documentworkflowplatform.entity.WorkflowSettings;
import com.manasbhat.documentworkflowplatform.dto.ApprovalAuditLogResponse;
import com.manasbhat.documentworkflowplatform.dto.ApprovalDocumentResponse;
import com.manasbhat.documentworkflowplatform.entity.Role;
import com.manasbhat.documentworkflowplatform.entity.User;
import com.manasbhat.documentworkflowplatform.repository.UserRepository;
import java.util.Comparator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final DocumentRepository documentRepository;
    private final ApprovalActionRepository approvalActionRepository;
    private final NotificationService notificationService;
    private final WorkflowSettingsService workflowSettingsService;
    private final UserRepository userRepository;


    public List<ApprovalDocumentResponse> getOverdueReviewerDocuments() {
        Instant cutoff = Instant.now().minus(
                java.time.Duration.ofHours(24)
        );

        return documentRepository
                .findByApprovalStatusAndAssignedReviewerAtBeforeOrderByAssignedReviewerAtAsc(
                        ApprovalStatus.PENDING_REVIEWER,
                        cutoff
                )
                .stream()
                .map(this::toApprovalDocumentResponse)
                .toList();
    }




    public List<java.util.Map<String, Object>> getReviewerWorkloads() {

        List<User> reviewers =
                userRepository.findByRoleAndEnabledTrue(Role.REVIEWER);

        List<ApprovalStatus> pendingStatuses = List.of(
                ApprovalStatus.PENDING_REVIEWER
        );

        return reviewers.stream()
                .map(reviewer -> {
                    long pending =
                            documentRepository
                                    .countByAssignedReviewerIdAndApprovalStatusIn(
                                            reviewer.getId(),
                                            pendingStatuses
                                    );

                    return java.util.Map.<String, Object>of(
                            "reviewerId", reviewer.getId(),
                            "reviewerName", reviewer.getFullName(),
                            "reviewerEmail", reviewer.getEmail(),
                            "pendingDocuments", pending
                    );
                })
                .toList();
    }


    public List<ApprovalDocumentResponse> getAllPendingReviewerDocuments() {
        return documentRepository
                .findByApprovalStatusOrderByUploadedAtAsc(
                        ApprovalStatus.PENDING_REVIEWER
                )
                .stream()
                .map(this::toApprovalDocumentResponse)
                .toList();
    }



    public void reassignReviewer(
            String documentId,
            String newReviewerId,
            UserPrincipal manager
    ) {
        requireRole(manager, Role.MANAGER);

        DocumentEntity doc = getDoc(documentId);

        requireStatus(doc, ApprovalStatus.PENDING_REVIEWER);

        User reviewer = userRepository.findById(newReviewerId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Reviewer not found")
                );

        if (reviewer.getRole() != Role.REVIEWER || !reviewer.isEnabled()) {
            throw new IllegalArgumentException(
                    "The selected user is not an active Reviewer"
            );
        }

        String previousReviewer = doc.getAssignedReviewerEmail();

        doc.setAssignedReviewerId(reviewer.getId());
        doc.setAssignedReviewerEmail(reviewer.getEmail());
        doc.setAssignedReviewerAt(Instant.now());
        doc.setUpdatedAt(Instant.now());

        documentRepository.save(doc);

        notificationService.createNotification(
                reviewer.getId(),
                doc.getId(),
                "Document Assigned to You",
                doc.getOriginalFileName()
                        + " has been reassigned to you for review.",
                "DOCUMENT_REASSIGNED"
        );

        logAction(
                documentId,
                manager.getUser().getId(),
                manager.getUser().getEmail(),
                "MANAGER",
                "REASSIGNED",
                "Reviewer changed from " + previousReviewer
                        + " to " + reviewer.getEmail()
        );
    }

    private User assignReviewer() {
        List<User> reviewers =
                userRepository.findByRoleAndEnabledTrue(Role.REVIEWER);

        if (reviewers.isEmpty()) {
            throw new IllegalStateException(
                    "No active Reviewer is available to review documents."
            );
        }

        List<ApprovalStatus> pendingStatuses = List.of(
                ApprovalStatus.PENDING_REVIEWER
        );

        return reviewers.stream()
                .min(Comparator.comparingLong(reviewer ->
                        documentRepository
                                .countByAssignedReviewerIdAndApprovalStatusIn(
                                        reviewer.getId(),
                                        pendingStatuses
                                )
                ))
                .orElseThrow();
    }


    private void requireRole(UserPrincipal user, Role expectedRole) {
        if (user.getUser().getRole() != expectedRole) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not authorized to perform this action."
            );
        }
    }



    public void submitForApproval(
            String documentId,
            UserPrincipal principal) {

        DocumentEntity doc = getDoc(documentId);

        String userId = principal.getUser().getId();

        // Only the document owner can submit it.
        if (!userId.equals(doc.getUploadedByUserId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not allowed to submit this document for approval."
            );
        }

        requireStatus(doc, ApprovalStatus.NOT_SUBMITTED);

        User reviewer = assignReviewer();

        doc.setAssignedReviewerId(reviewer.getId());
        doc.setAssignedReviewerEmail(reviewer.getEmail());
        doc.setAssignedReviewerAt(Instant.now());
        doc.setApprovalStatus(ApprovalStatus.PENDING_REVIEWER);
        doc.setUpdatedAt(Instant.now());

        documentRepository.save(doc);

        notificationService.createNotification(
                reviewer.getId(),
                doc.getId(),
                "New Document Assigned",
                doc.getOriginalFileName() + " has been assigned to you for review.",
                "DOCUMENT_ASSIGNED_TO_REVIEWER"
        );

        logAction(
                documentId,
                userId,
                principal.getUser().getEmail(),
                principal.getUser().getRole().name(),
                "SUBMITTED",
                "Assigned to Reviewer: " + reviewer.getEmail()
        );
    }


    public void submitForApprovalFromEvent(String documentId) {
        DocumentEntity doc = getDoc(documentId);

        // Only process documents that are still awaiting submission.
        requireStatus(doc, ApprovalStatus.NOT_SUBMITTED);

        User reviewer = assignReviewer();

        doc.setAssignedReviewerId(reviewer.getId());
        doc.setAssignedReviewerEmail(reviewer.getEmail());
        doc.setAssignedReviewerAt(Instant.now());
        doc.setApprovalStatus(ApprovalStatus.PENDING_REVIEWER);
        doc.setUpdatedAt(Instant.now());

        documentRepository.save(doc);

        notificationService.createNotification(
                reviewer.getId(),
                doc.getId(),
                "New Document Assigned",
                doc.getOriginalFileName() + " has been assigned to you for review.",
                "DOCUMENT_ASSIGNED_TO_REVIEWER"
        );

        logAction(
                documentId,
                doc.getUploadedByUserId(),
                doc.getUploadedByEmail(),
                "SYSTEM",
                "SUBMITTED",
                "Automatically assigned to Reviewer: " + reviewer.getEmail()
        );
    }


    public void reviewerApprove(String documentId, UserPrincipal reviewer, String comment) {
        DocumentEntity doc = getDoc(documentId);
        requireRole(reviewer, Role.REVIEWER);
        requireAssignedReviewer(doc, reviewer);
        requireStatus(doc, ApprovalStatus.PENDING_REVIEWER);

        doc.setApprovalStatus(ApprovalStatus.PENDING_MANAGER);
        documentRepository.save(doc);
        logAction(documentId, reviewer.getUser().getId(), reviewer.getUser().getEmail(), "REVIEWER", "APPROVED", comment);

        notificationService.createNotification(
                doc.getUploadedByUserId(),
                doc.getId(),
                "Document moved to Manager Review",
                doc.getOriginalFileName() + " has been approved by the reviewer and is now awaiting manager approval.",
                "DOCUMENT_REVIEWER_APPROVED"
        );

        List<User> managers =
                userRepository.findByRoleAndEnabledTrue(Role.MANAGER);

        for (User managerUser : managers) {
            notificationService.createNotification(
                    managerUser.getId(),
                    doc.getId(),
                    "Document Awaiting Manager Review",
                    doc.getOriginalFileName()
                            + " has passed reviewer approval and awaits your review.",
                    "DOCUMENT_PENDING_MANAGER"
            );
        }
    }

    public void reviewerReject(String documentId, UserPrincipal reviewer, String comment) {
        requireRejectionComment(comment);
        requireRole(reviewer, Role.REVIEWER);
        DocumentEntity doc = getDoc(documentId);
        requireAssignedReviewer(doc, reviewer);
        requireStatus(doc, ApprovalStatus.PENDING_REVIEWER);

        doc.setApprovalStatus(ApprovalStatus.REJECTED);
        documentRepository.save(doc);
        logAction(documentId, reviewer.getUser().getId(), reviewer.getUser().getEmail(), "REVIEWER", "REJECTED", comment);

        notificationService.createNotification(
                doc.getUploadedByUserId(),
                doc.getId(),
                "Document Rejected",
                doc.getOriginalFileName() + " was rejected by the reviewer.",
                "DOCUMENT_REJECTED"
        );
    }

    public void managerApprove(String documentId, UserPrincipal manager, String comment) {
        DocumentEntity doc = getDoc(documentId);
        requireRole(manager, Role.MANAGER);
        requireStatus(doc, ApprovalStatus.PENDING_MANAGER);

        doc.setApprovalStatus(ApprovalStatus.APPROVED);
        documentRepository.save(doc);
        logAction(documentId, manager.getUser().getId(), manager.getUser().getEmail(), "MANAGER", "APPROVED", comment);

        notificationService.createNotification(
                doc.getUploadedByUserId(),
                doc.getId(),
                "Document Approved",
                doc.getOriginalFileName() + " has been approved.",
                "DOCUMENT_APPROVED"
        );
    }

    public void managerReject(String documentId, UserPrincipal manager, String comment) {
        requireRejectionComment(comment);
        requireRole(manager, Role.MANAGER);
        DocumentEntity doc = getDoc(documentId);
        requireStatus(doc, ApprovalStatus.PENDING_MANAGER);

        doc.setApprovalStatus(ApprovalStatus.REJECTED);
        documentRepository.save(doc);
        logAction(documentId, manager.getUser().getId(), manager.getUser().getEmail(), "MANAGER", "REJECTED", comment);

        notificationService.createNotification(
                doc.getUploadedByUserId(),
                doc.getId(),
                "Document Rejected",
                doc.getOriginalFileName() + " was rejected by the manager.",
                "DOCUMENT_REJECTED"
        );
    }

    public void logSystemAction(
            String documentId,
            String action,
            String comment
    ) {
        logAction(
                documentId,
                "SYSTEM",
                "system@internal",
                "SYSTEM",
                action,
                comment
        );
    }


    public List<ApprovalAuditLogResponse> getAllAuditLogs() {
        return approvalActionRepository.findAllByOrderByActionAtDesc()
                .stream()
                .map(action -> ApprovalAuditLogResponse.builder()
                        .id(action.getId())
                        .documentId(action.getDocumentId())
                        .actionByUserId(action.getActionByUserId())
                        .actionByEmail(action.getActionByEmail())
                        .actionByRole(action.getActionByRole())
                        .action(action.getAction())
                        .comment(action.getComment())
                        .actionAt(action.getActionAt())
                        .build())
                .toList();
    }


    public List<ApprovalActionResponse> getHistory(
            String documentId,
            UserPrincipal user
    ) {
        DocumentEntity doc = getDoc(documentId);
        requireDocumentAccess(doc, user);

        return approvalActionRepository
                .findByDocumentIdOrderByActionAtAsc(documentId)
                .stream()
                .map(a -> ApprovalActionResponse.builder()
                        .id(a.getId())
                        .documentId(a.getDocumentId())
                        .actionByEmail(a.getActionByEmail())
                        .actionByRole(a.getActionByRole())
                        .action(a.getAction())
                        .comment(a.getComment())
                        .actionAt(a.getActionAt())
                        .build())
                .toList();
    }

    public ApprovalActionResponse getLatestRejection(
            String documentId,
            UserPrincipal user
    ) {
        DocumentEntity doc = getDoc(documentId);
        requireDocumentAccess(doc, user);

        return approvalActionRepository
                .findByDocumentIdOrderByActionAtAsc(documentId)
                .stream()
                .filter(action -> "REJECTED".equals(action.getAction()))
                .reduce((first, second) -> second)
                .map(action -> ApprovalActionResponse.builder()
                        .id(action.getId())
                        .documentId(action.getDocumentId())
                        .actionByEmail(action.getActionByEmail())
                        .actionByRole(action.getActionByRole())
                        .action(action.getAction())
                        .comment(action.getComment())
                        .actionAt(action.getActionAt())
                        .build())
                .orElse(null);
    }


    public List<ApprovalDocumentResponse> getPendingForReviewer(String reviewerId) {
        return documentRepository
                .findByApprovalStatusAndAssignedReviewerIdOrderByUploadedAtAsc(
                        ApprovalStatus.PENDING_REVIEWER,
                        reviewerId
                )
                .stream()
                .map(this::toApprovalDocumentResponse)
                .toList();
    }



    public List<ApprovalDocumentResponse> getPendingForManager() {
        return documentRepository
                .findByApprovalStatusOrderByUploadedAtAsc(
                        ApprovalStatus.PENDING_MANAGER
                )
                .stream()
                .map(this::toApprovalDocumentResponse)
                .toList();
    }


    private DocumentEntity getDoc(String id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
    }

    private void requireStatus(DocumentEntity doc, ApprovalStatus expected) {
        if (doc.getApprovalStatus() != expected) {
            throw new IllegalStateException("Document is not in " + expected + " status, current: " + doc.getApprovalStatus());
        }
    }

    private void logAction(
            String documentId,
            String userId,
            String email,
            String role,
            String action,
            String comment
    ) {
        ApprovalAction log = ApprovalAction.builder()
                .documentId(documentId)
                .actionByUserId(userId)
                .actionByEmail(email)
                .actionByRole(role)
                .action(action)
                .comment(comment)
                .actionAt(Instant.now())
                .build();

        approvalActionRepository.save(log);
    }

    private void requireRejectionComment(String comment) {
        if (comment == null || comment.isBlank()
                || comment.trim().length() < 5) {
            throw new IllegalArgumentException(
                    "Please provide a rejection reason of at least 5 characters."
            );
        }
    }

    private void requireAssignedReviewer(
            DocumentEntity doc,
            UserPrincipal reviewer
    ) {
        if (doc.getAssignedReviewerId() == null
                || !doc.getAssignedReviewerId()
                .equals(reviewer.getUser().getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "This document is not assigned to you."
            );
        }
    }

    private void requireDocumentAccess(
            DocumentEntity doc,
            UserPrincipal user
    ) {
        String userId = user.getUser().getId();
        Role role = user.getUser().getRole();

        boolean isOwner =
                userId.equals(doc.getUploadedByUserId());

        boolean isAssignedReviewer =
                userId.equals(doc.getAssignedReviewerId());

        boolean allowed =
                isOwner
                        || isAssignedReviewer
                        || role == Role.MANAGER
                        || role == Role.ADMIN;

        if (!allowed) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not allowed to access this document's approval history."
            );
        }
    }


    private ApprovalDocumentResponse toApprovalDocumentResponse(
            DocumentEntity doc
    ) {
        return ApprovalDocumentResponse.builder()
                .id(doc.getId())
                .originalFileName(doc.getOriginalFileName())
                .fileSizeBytes(doc.getFileSizeBytes())
                .contentType(doc.getContentType())
                .documentType(doc.getDocumentType())
                .status(doc.getStatus())
                .uploadedByEmail(doc.getUploadedByEmail())
                .uploadedAt(doc.getUploadedAt())
                .assignedReviewerEmail(doc.getAssignedReviewerEmail())
                .assignedReviewerAt(doc.getAssignedReviewerAt())
                .approvalStatus(doc.getApprovalStatus())
                .build();
    }

}