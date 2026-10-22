
package com.manasbhat.documentworkflowplatform.controller;

import com.manasbhat.documentworkflowplatform.dto.SearchRequest;
import com.manasbhat.documentworkflowplatform.entity.DocumentEntity;
import com.manasbhat.documentworkflowplatform.repository.DocumentRepository;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import com.manasbhat.documentworkflowplatform.service.EmbeddingService;
import com.manasbhat.documentworkflowplatform.service.VectorSearchService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.manasbhat.documentworkflowplatform.entity.Role;
import com.manasbhat.documentworkflowplatform.entity.ApprovalStatus;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final EmbeddingService embeddingService;
    private final VectorSearchService vectorSearchService;
    private final DocumentRepository documentRepository;


    @PostMapping("/semantic")
    public ResponseEntity<List<Map<String, Object>>> semanticSearch(
            @RequestBody SearchRequest request,
            @AuthenticationPrincipal UserPrincipal user) {

        if (user == null || user.getUser() == null
                || request.getQuery() == null
                || request.getQuery().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String query = request.getQuery().trim();
        String userId = user.getUser().getId();
        Role role = user.getUser().getRole();

        int limit = request.getLimit() > 0
                ? Math.min(request.getLimit(), 20)
                : 5;

        // 1. Determine which documents this role is allowed to access.
        List<DocumentEntity> allowedDocuments;

        switch (role) {
            case ADMIN:
                allowedDocuments = documentRepository.findAll();
                break;

            case REVIEWER:
                allowedDocuments =
                        documentRepository.findByAssignedReviewerId(userId);
                break;

            case MANAGER:
                allowedDocuments = documentRepository.findByApprovalStatus(
                        ApprovalStatus.PENDING_MANAGER);
                break;

            case EMPLOYEE:
                allowedDocuments =
                        documentRepository.findByUploadedByUserId(userId);
                break;

            default:
                throw new org.springframework.security.access.AccessDeniedException(
                        "You are not allowed to search these documents.");
        }

        Map<String, DocumentEntity> allowedById = new HashMap<>();

        for (DocumentEntity doc : allowedDocuments) {
            if (doc.getId() != null) {
                allowedById.put(doc.getId(), doc);
            }
        }

        // 2. Search keywords using the role-specific repository methods.
        String keywordRegex = buildKeywordRegex(query);
        List<DocumentEntity> keywordDocuments;

        switch (role) {
            case ADMIN:
                keywordDocuments =
                        documentRepository.searchAllByKeywords(keywordRegex);
                break;

            case REVIEWER:
                keywordDocuments =
                        documentRepository.searchByReviewerAndKeywords(
                                userId, keywordRegex);
                break;

            case MANAGER:
                keywordDocuments =
                        documentRepository.searchManagerDocumentsByKeywords(
                                keywordRegex);
                break;

            case EMPLOYEE:
                keywordDocuments =
                        documentRepository.searchByKeywords(
                                userId, keywordRegex);
                break;

            default:
                throw new org.springframework.security.access.AccessDeniedException(
                        "You are not allowed to search these documents.");
        }

        Map<String, Map<String, Object>> merged = new LinkedHashMap<>();

        // 3. Add only keyword matches that the user is authorized to access.
        for (DocumentEntity doc : keywordDocuments) {
            if (doc.getId() == null || !allowedById.containsKey(doc.getId())) {
                continue;
            }

            Map<String, Object> result = new HashMap<>();
            result.put("documentId", doc.getId());
            result.put("fileName", doc.getOriginalFileName());
            result.put("summary",
                    doc.getAiSummary() == null ? "" : doc.getAiSummary());
            result.put("score", 0.70);
            result.put("matchType", "keyword");

            merged.put(doc.getId(), result);
        }

        // 4. Search Qdrant. Employees retain their owner filter.
        // Privileged-role results are intersected with allowed document IDs.
        List<Map<String, Object>> semanticResults =
                vectorSearchService.search(
                        embeddingService.getEmbedding(query),
                        role == Role.EMPLOYEE ? limit : 100,
                        role == Role.EMPLOYEE ? userId : null
                );

        for (Map<String, Object> semantic : semanticResults) {
            Object idObject = semantic.get("documentId");

            if (idObject == null) {
                continue;
            }

            String documentId = idObject.toString();

            if (!allowedById.containsKey(documentId)
                    || merged.containsKey(documentId)) {
                continue;
            }

            semantic.put("matchType", "semantic");
            merged.put(documentId, semantic);
        }

        return ResponseEntity.ok(
                merged.values().stream()
                        .limit(limit)
                        .toList()
        );
    }


    private String buildKeywordRegex(String query) {
        String[] terms = query.toLowerCase()
                .split("[^\\p{L}\\p{N}]+");

        List<String> escapedTerms = new ArrayList<>();

        for (String term : terms) {
            if (term.length() >= 2) {
                escapedTerms.add(Pattern.quote(term));
            }
        }

        if (escapedTerms.isEmpty()) {
            return Pattern.quote(query);
        }

        return String.join("|", escapedTerms);
    }
}
