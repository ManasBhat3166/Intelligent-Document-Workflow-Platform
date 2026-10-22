package com.manasbhat.documentworkflowplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateDocumentDiscussionRequest {

    @NotBlank(message = "Document ID is required")
    @Size(max = 100, message = "Document ID is too long")
    private String documentId;
}