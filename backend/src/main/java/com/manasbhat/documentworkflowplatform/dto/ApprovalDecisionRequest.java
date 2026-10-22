
package com.manasbhat.documentworkflowplatform.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ApprovalDecisionRequest {

    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    private String comment;
}
