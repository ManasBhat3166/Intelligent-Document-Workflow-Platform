package com.manasbhat.documentworkflowplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
public class ApprovalActionResponse {
    private String id;
    private String documentId;
    private String actionByEmail;
    private String actionByRole;
    private String action;
    private String comment;
    private Instant actionAt;
}