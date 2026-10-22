
package com.manasbhat.documentworkflowplatform.controller;

import com.manasbhat.documentworkflowplatform.dto.ApprovalActionResponse;
import com.manasbhat.documentworkflowplatform.dto.ApprovalDecisionRequest;
import com.manasbhat.documentworkflowplatform.dto.ApprovalDocumentResponse;
import com.manasbhat.documentworkflowplatform.dto.ReassignReviewerRequest;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import com.manasbhat.documentworkflowplatform.service.ApprovalService;
import com.manasbhat.documentworkflowplatform.dto.ApprovalAuditLogResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @GetMapping("/manager/pending-reviewer")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<ApprovalDocumentResponse>> getPendingReviewerDocuments() {
        return ResponseEntity.ok(
                approvalService.getAllPendingReviewerDocuments()
        );
    }

    @PatchMapping("/{documentId}/reassign-reviewer")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> reassignReviewer(
            @PathVariable String documentId,
            @Valid @RequestBody ReassignReviewerRequest request,
            @AuthenticationPrincipal UserPrincipal manager
    ) {
        approvalService.reassignReviewer(
                documentId,
                request.getReviewerId(),
                manager
        );

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/manager/reviewer-workloads")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<java.util.Map<String, Object>>> getReviewerWorkloads() {
        return ResponseEntity.ok(
                approvalService.getReviewerWorkloads()
        );
    }

    @PostMapping("/{documentId}/submit")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<?> submitForApproval(
            @PathVariable String documentId,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        approvalService.submitForApproval(documentId, user);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{documentId}/reviewer/approve")
    @PreAuthorize("hasRole('REVIEWER')")
    public ResponseEntity<Void> reviewerApprove(
            @PathVariable String documentId,
            @Valid @RequestBody ApprovalDecisionRequest request,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        approvalService.reviewerApprove(
                documentId,
                user,
                request.getComment()
        );

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{documentId}/reviewer/reject")
    @PreAuthorize("hasRole('REVIEWER')")
    public ResponseEntity<Void> reviewerReject(
            @PathVariable String documentId,
            @Valid @RequestBody ApprovalDecisionRequest request,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        approvalService.reviewerReject(
                documentId,
                user,
                request.getComment()
        );

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{documentId}/manager/approve")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> managerApprove(
            @PathVariable String documentId,
            @Valid @RequestBody ApprovalDecisionRequest request,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        approvalService.managerApprove(
                documentId,
                user,
                request.getComment()
        );

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{documentId}/manager/reject")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> managerReject(
            @PathVariable String documentId,
            @Valid @RequestBody ApprovalDecisionRequest request,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        approvalService.managerReject(
                documentId,
                user,
                request.getComment()
        );

        return ResponseEntity.ok().build();
    }

    @GetMapping("/{documentId}/history")
    public ResponseEntity<List<ApprovalActionResponse>> getHistory(
            @PathVariable String documentId,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        return ResponseEntity.ok(
                approvalService.getHistory(documentId, user)
        );
    }

    @GetMapping("/pending/reviewer")
    @PreAuthorize("hasRole('REVIEWER')")
    public ResponseEntity<List<ApprovalDocumentResponse>> getPendingForReviewer(
            @AuthenticationPrincipal UserPrincipal user
    ) {
        return ResponseEntity.ok(
                approvalService.getPendingForReviewer(
                        user.getUser().getId()
                )
        );
    }

    @GetMapping("/pending/manager")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<ApprovalDocumentResponse>> getPendingForManager() {
        return ResponseEntity.ok(
                approvalService.getPendingForManager()
        );
    }

    @GetMapping("/{documentId}/latest-rejection")
    public ResponseEntity<ApprovalActionResponse> getLatestRejection(
            @PathVariable String documentId,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        return ResponseEntity.ok(
                approvalService.getLatestRejection(documentId, user)
        );
    }

    @GetMapping("/manager/overdue-reviewer")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<ApprovalDocumentResponse>> getOverdueReviewerDocuments() {
        return ResponseEntity.ok(
                approvalService.getOverdueReviewerDocuments()
        );
    }


    @GetMapping("/admin/audit-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ApprovalAuditLogResponse>> getAllAuditLogs() {
        return ResponseEntity.ok(
                approvalService.getAllAuditLogs()
        );
    }

}
