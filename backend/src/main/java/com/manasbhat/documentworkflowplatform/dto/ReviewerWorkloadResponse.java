
package com.manasbhat.documentworkflowplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerWorkloadResponse {

    private String reviewerId;
    private String reviewerEmail;
    private long pendingDocuments;
    private long completedReviews;
}
