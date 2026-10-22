package com.manasbhat.documentworkflowplatform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReassignReviewerRequest {

    @NotBlank(message = "Reviewer ID is required")
    private String reviewerId;
}