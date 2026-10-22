package com.manasbhat.documentworkflowplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadedEvent {
    private String documentId;
    private String originalFileName;
    private String contentType;
    private String uploadedByUserId;
}