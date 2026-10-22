package com.manasbhat.documentworkflowplatform.controller;

import com.manasbhat.documentworkflowplatform.entity.WorkflowSettings;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import com.manasbhat.documentworkflowplatform.service.WorkflowSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/workflow-settings")
@RequiredArgsConstructor
public class WorkflowSettingsController {

    private final WorkflowSettingsService workflowSettingsService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<WorkflowSettings> getSettings() {

        return ResponseEntity.ok(
                workflowSettingsService.getSettings()
        );
    }

    @PutMapping("/resubmission-limit")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<WorkflowSettings> updateResubmissionLimit(
            @RequestParam int maxResubmissions,
            @AuthenticationPrincipal UserPrincipal user
    ) {

        return ResponseEntity.ok(
                workflowSettingsService.updateMaxResubmissions(
                        maxResubmissions,
                        user.getUser().getId()
                )
        );
    }
}