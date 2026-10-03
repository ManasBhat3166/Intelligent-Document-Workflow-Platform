package com.manasbhat.documentworkflowplatform.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class VectorSearchService {

    private final RestClient restClient = RestClient.create("http://localhost:6333");
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String COLLECTION = "documents";

    @PostConstruct
    public void init() {
        try {
            restClient.put()
                    .uri("/collections/" + COLLECTION)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("vectors", Map.of("size", 768, "distance", "Cosine")))
                    .retrieve()
                    .body(String.class);
            System.out.println("Qdrant collection ready: " + COLLECTION);
        } catch (Exception e) {
            System.out.println("Qdrant init note: " + e.getMessage());
        }
    }

    public void upsertDocument(String documentId, List<Float> vector, String fileName, String summary) {
        Map<String, Object> point = Map.of(
                "id", Math.abs(documentId.hashCode()),
                "vector", vector,
                "payload", Map.of(
                        "documentId", documentId,
                        "fileName", fileName == null ? "" : fileName,
                        "summary", summary == null ? "" : summary
                )
        );

        restClient.put()
                .uri("/collections/" + COLLECTION + "/points")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("points", List.of(point)))
                .retrieve()
                .body(String.class);
    }

    public List<Map<String, Object>> search(List<Float> queryVector, int limit) {
        String responseJson = restClient.post()
                .uri("/collections/" + COLLECTION + "/points/search")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "vector", queryVector,
                        "limit", limit,
                        "with_payload", true
                ))
                .retrieve()
                .body(String.class);

        List<Map<String, Object>> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode hits = root.path("result");
            for (JsonNode hit : hits) {
                Map<String, Object> entry = new java.util.HashMap<>();
                entry.put("score", hit.path("score").asDouble());
                entry.put("documentId", hit.path("payload").path("documentId").asText());
                entry.put("fileName", hit.path("payload").path("fileName").asText());
                entry.put("summary", hit.path("payload").path("summary").asText());
                results.add(entry);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse search results: " + e.getMessage(), e);
        }
        return results;
    }
}