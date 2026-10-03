package com.manasbhat.documentworkflowplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
public class AnalyticsSummaryResponse {
    private long totalDocuments;
    private long processedDocuments;
    private long failedDocuments;
    private long pendingApprovalDocuments;
    private long approvedDocuments;
    private long rejectedDocuments;
    private Map<String, Long> documentsByType;
    private Map<String, Long> documentsByStatus;
    private List<DailyUploadCount> uploadsLast7Days;
}