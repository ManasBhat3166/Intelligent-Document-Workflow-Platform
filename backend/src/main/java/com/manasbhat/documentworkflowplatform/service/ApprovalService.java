package com.manasbhat.documentworkflowplatform.service;

import com.manasbhat.documentworkflowplatform.dto.ApprovalActionResponse;
import com.manasbhat.documentworkflowplatform.entity.ApprovalAction;
import com.manasbhat.documentworkflowplatform.entity.ApprovalStatus;
import com.manasbhat.documentworkflowplatform.entity.DocumentEntity;
import com.manasbhat.documentworkflowplatform.entity.DocumentStatus;
import com.manasbhat.documentworkflowplatform.repository.ApprovalActionRepository;
import com.manasbhat.documentworkflowplatform.repository.DocumentRepository;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final DocumentRepository documentRepository;
    private final ApprovalActionRepository approvalActionRepository;

    public void submitForApproval(String documentId) {
        DocumentEntity doc = getDoc(documentId);
        doc.setApprovalStatus(ApprovalStatus.PENDING_REVIEWER);
        documentRepository.save(doc);
        logAction(documentId, "SYSTEM", "system@internal", "SYSTEM", "SUBMITTED", "Auto-submitted after processing");
    }

    public void reviewerApprove(String documentId, UserPrincipal reviewer, String comment) {
        DocumentEntity doc = getDoc(documentId);
        requireStatus(doc, ApprovalStatus.PENDING_REVIEWER);

        doc.setApprovalStatus(ApprovalStatus.PENDING_MANAGER);
        documentRepository.save(doc);
        logAction(documentId, reviewer.getUser().getId(), reviewer.getUser().getEmail(), "REVIEWER", "APPROVED", comment);
    }

    public void reviewerReject(String documentId, UserPrincipal reviewer, String comment) {
        DocumentEntity doc = getDoc(documentId);
        requireStatus(doc, ApprovalStatus.PENDING_REVIEWER);

        doc.setApprovalStatus(ApprovalStatus.REJECTED);
        documentRepository.save(doc);
        logAction(documentId, reviewer.getUser().getId(), reviewer.getUser().getEmail(), "REVIEWER", "REJECTED", comment);
    }

    public void managerApprove(String documentId, UserPrincipal manager, String comment) {
        DocumentEntity doc = getDoc(documentId);
        requireStatus(doc, ApprovalStatus.PENDING_MANAGER);

        doc.setApprovalStatus(ApprovalStatus.APPROVED);
        documentRepository.save(doc);
        logAction(documentId, manager.getUser().getId(), manager.getUser().getEmail(), "MANAGER", "APPROVED", comment);
    }

    public void managerReject(String documentId, UserPrincipal manager, String comment) {
        DocumentEntity doc = getDoc(documentId);
        requireStatus(doc, ApprovalStatus.PENDING_MANAGER);

        doc.setApprovalStatus(ApprovalStatus.REJECTED);
        documentRepository.save(doc);
        logAction(documentId, manager.getUser().getId(), manager.getUser().getEmail(), "MANAGER", "REJECTED", comment);
    }

    public List<ApprovalActionResponse> getHistory(String documentId) {
        return approvalActionRepository.findByDocumentIdOrderByActionAtAsc(documentId).stream()
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

    public List<DocumentEntity> getPendingForReviewer() {
        return documentRepository.findAll().stream()
                .filter(d -> d.getApprovalStatus() == ApprovalStatus.PENDING_REVIEWER)
                .toList();
    }

    public List<DocumentEntity> getPendingForManager() {
        return documentRepository.findAll().stream()
                .filter(d -> d.getApprovalStatus() == ApprovalStatus.PENDING_MANAGER)
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

    private void logAction(String documentId, String userId, String email, String role, String action, String comment) {
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
}