package com.manasbhat.documentworkflowplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "documents")
public class DocumentEntity {

    @Id
    private String id;

    private String originalFileName;

    private String storedFileName;

    private String filePath;

    private long fileSizeBytes;

    private String contentType;

    private DocumentType documentType;

    @Builder.Default
    private DocumentStatus status = DocumentStatus.UPLOADED;

    private String uploadedByUserId;

    private String uploadedByEmail;

    private Instant uploadedAt;

    private Instant updatedAt;

    private String extractedText;
}