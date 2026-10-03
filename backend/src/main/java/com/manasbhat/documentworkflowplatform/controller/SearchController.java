package com.manasbhat.documentworkflowplatform.controller;

import com.manasbhat.documentworkflowplatform.dto.SearchRequest;
import com.manasbhat.documentworkflowplatform.service.EmbeddingService;
import com.manasbhat.documentworkflowplatform.service.VectorSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final EmbeddingService embeddingService;
    private final VectorSearchService vectorSearchService;

    @PostMapping("/semantic")
    public ResponseEntity<List<Map<String, Object>>> semanticSearch(@RequestBody SearchRequest request) {
        var queryVector = embeddingService.getEmbedding(request.getQuery());
        var results = vectorSearchService.search(queryVector, request.getLimit());
        return ResponseEntity.ok(results);
    }
}