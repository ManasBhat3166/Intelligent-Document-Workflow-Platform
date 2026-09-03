package com.manasbhat.documentworkflowplatform.dto;

import com.manasbhat.documentworkflowplatform.entity.DocumentStatus;
import com.manasbhat.documentworkflowplatform.entity.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
public class DocumentResponse {
    private String id;
    private String originalFileName;
    private long fileSizeBytes;
    private String contentType;
    private DocumentType documentType;
    private DocumentStatus status;
    private String uploadedByEmail;
    private Instant uploadedAt;
}