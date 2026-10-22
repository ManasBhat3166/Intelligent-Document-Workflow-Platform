
package com.manasbhat.documentworkflowplatform.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ApprovalAuditLogResponse {

    private String id;
    private String documentId;
    private String actionByUserId;
    private String actionByEmail;
    private String actionByRole;
    private String action;
    private String comment;
    private Instant actionAt;
}
