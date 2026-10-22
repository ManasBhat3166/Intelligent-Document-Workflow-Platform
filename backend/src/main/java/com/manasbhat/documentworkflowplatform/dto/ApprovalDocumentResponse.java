
package com.manasbhat.documentworkflowplatform.dto;

import com.manasbhat.documentworkflowplatform.entity.ApprovalStatus;
import com.manasbhat.documentworkflowplatform.entity.DocumentStatus;
import com.manasbhat.documentworkflowplatform.entity.DocumentType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ApprovalDocumentResponse {

    private String id;
    private String originalFileName;
    private long fileSizeBytes;
    private String contentType;
    private DocumentType documentType;
    private DocumentStatus status;

    private String uploadedByEmail;
    private Instant uploadedAt;

    private String assignedReviewerEmail;
    private Instant assignedReviewerAt;

    private ApprovalStatus approvalStatus;
}
