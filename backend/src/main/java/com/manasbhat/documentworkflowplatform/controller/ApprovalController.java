package com.manasbhat.documentworkflowplatform.controller;

import com.manasbhat.documentworkflowplatform.dto.ApprovalActionResponse;
import com.manasbhat.documentworkflowplatform.dto.ApprovalDecisionRequest;
import com.manasbhat.documentworkflowplatform.entity.DocumentEntity;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import com.manasbhat.documentworkflowplatform.service.ApprovalService;
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

    @PostMapping("/{documentId}/submit")
    public ResponseEntity<Void> submit(@PathVariable String documentId) {
        approvalService.submitForApproval(documentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{documentId}/reviewer/approve")
    @PreAuthorize("hasAnyRole('REVIEWER','ADMIN')")
    public ResponseEntity<Void> reviewerApprove(@PathVariable String documentId,
                                                @RequestBody ApprovalDecisionRequest request,
                                                @AuthenticationPrincipal UserPrincipal user) {
        approvalService.reviewerApprove(documentId, user, request.getComment());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{documentId}/reviewer/reject")
    @PreAuthorize("hasAnyRole('REVIEWER','ADMIN')")
    public ResponseEntity<Void> reviewerReject(@PathVariable String documentId,
                                               @RequestBody ApprovalDecisionRequest request,
                                               @AuthenticationPrincipal UserPrincipal user) {
        approvalService.reviewerReject(documentId, user, request.getComment());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{documentId}/manager/approve")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<Void> managerApprove(@PathVariable String documentId,
                                               @RequestBody ApprovalDecisionRequest request,
                                               @AuthenticationPrincipal UserPrincipal user) {
        approvalService.managerApprove(documentId, user, request.getComment());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{documentId}/manager/reject")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<Void> managerReject(@PathVariable String documentId,
                                              @RequestBody ApprovalDecisionRequest request,
                                              @AuthenticationPrincipal UserPrincipal user) {
        approvalService.managerReject(documentId, user, request.getComment());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{documentId}/history")
    public ResponseEntity<List<ApprovalActionResponse>> getHistory(@PathVariable String documentId) {
        return ResponseEntity.ok(approvalService.getHistory(documentId));
    }

    @GetMapping("/pending/reviewer")
    @PreAuthorize("hasAnyRole('REVIEWER','ADMIN')")
    public ResponseEntity<List<DocumentEntity>> getPendingForReviewer() {
        return ResponseEntity.ok(approvalService.getPendingForReviewer());
    }

    @GetMapping("/pending/manager")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<List<DocumentEntity>> getPendingForManager() {
        return ResponseEntity.ok(approvalService.getPendingForManager());
    }
}