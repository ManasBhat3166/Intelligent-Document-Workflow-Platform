package com.manasbhat.documentworkflowplatform.service;

import com.manasbhat.documentworkflowplatform.dto.AnalyticsSummaryResponse;
import com.manasbhat.documentworkflowplatform.dto.DailyUploadCount;
import com.manasbhat.documentworkflowplatform.entity.ApprovalStatus;
import com.manasbhat.documentworkflowplatform.entity.DocumentEntity;
import com.manasbhat.documentworkflowplatform.entity.DocumentStatus;
import com.manasbhat.documentworkflowplatform.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final DocumentRepository documentRepository;

    public AnalyticsSummaryResponse getSummary() {
        List<DocumentEntity> allDocs = documentRepository.findAll();

        long total = allDocs.size();
        long processed = count(allDocs, d -> d.getStatus() == DocumentStatus.PROCESSED);
        long failed = count(allDocs, d -> d.getStatus() == DocumentStatus.FAILED);
        long pendingApproval = count(allDocs, d ->
                d.getApprovalStatus() == ApprovalStatus.PENDING_REVIEWER
                        || d.getApprovalStatus() == ApprovalStatus.PENDING_MANAGER);
        long approved = count(allDocs, d -> d.getApprovalStatus() == ApprovalStatus.APPROVED);
        long rejected = count(allDocs, d -> d.getApprovalStatus() == ApprovalStatus.REJECTED);

        Map<String, Long> byType = allDocs.stream()
                .filter(d -> d.getDocumentType() != null)
                .collect(Collectors.groupingBy(d -> d.getDocumentType().name(), Collectors.counting()));

        Map<String, Long> byStatus = allDocs.stream()
                .filter(d -> d.getStatus() != null)
                .collect(Collectors.groupingBy(d -> d.getStatus().name(), Collectors.counting()));

        List<DailyUploadCount> last7Days = computeLast7DaysUploads(allDocs);

        return AnalyticsSummaryResponse.builder()
                .totalDocuments(total)
                .processedDocuments(processed)
                .failedDocuments(failed)
                .pendingApprovalDocuments(pendingApproval)
                .approvedDocuments(approved)
                .rejectedDocuments(rejected)
                .documentsByType(byType)
                .documentsByStatus(byStatus)
                .uploadsLast7Days(last7Days)
                .build();
    }

    private long count(List<DocumentEntity> docs, java.util.function.Predicate<DocumentEntity> p) {
        return docs.stream().filter(p).count();
    }

    private List<DailyUploadCount> computeLast7DaysUploads(List<DocumentEntity> allDocs) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        ZoneId zone = ZoneId.systemDefault();

        Map<String, Long> countsByDate = allDocs.stream()
                .filter(d -> d.getUploadedAt() != null)
                .collect(Collectors.groupingBy(
                        d -> LocalDate.ofInstant(d.getUploadedAt(), zone).format(fmt),
                        Collectors.counting()
                ));

        List<DailyUploadCount> result = new ArrayList<>();
        LocalDate today = LocalDate.now(zone);
        for (int i = 6; i >= 0; i--) {
            String dateStr = today.minusDays(i).format(fmt);
            result.add(new DailyUploadCount(dateStr, countsByDate.getOrDefault(dateStr, 0L)));
        }
        return result;
    }
}