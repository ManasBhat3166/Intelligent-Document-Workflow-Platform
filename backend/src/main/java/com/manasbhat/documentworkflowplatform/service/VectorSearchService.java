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

    public void upsertDocument(String documentId, String uploadedByUserId, List<Float> vector, String fileName, String summary) {
        Map<String, Object> point = Map.of(
                "id", Math.abs(documentId.hashCode()),
                "vector", vector,
                "payload", Map.of(
                        "documentId", documentId,
                        "uploadedByUserId", uploadedByUserId,
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

    public List<Map<String, Object>> search(List<Float> queryVector, int limit, String uploadedByUserId) {

        Map<String, Object> requestBody = new java.util.HashMap<>();
        requestBody.put("vector", queryVector);
        requestBody.put("limit", limit);
        requestBody.put("with_payload", true);

        // Apply the owner filter only when a user ID is supplied.
        // The controller must enforce document visibility for privileged roles.
        if (uploadedByUserId != null && !uploadedByUserId.isBlank()) {
            requestBody.put("filter", Map.of(
                    "must", List.of(
                            Map.of(
                                    "key", "uploadedByUserId",
                                    "match", Map.of("value", uploadedByUserId)
                            )
                    )
            ));
        }

        String responseJson = restClient.post()
                .uri("/collections/" + COLLECTION + "/points/search")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);


        List<Map<String, Object>> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode hits = root.path("result");

            for (JsonNode hit : hits) {
                double score = hit.path("score").asDouble(0.0);

                Map<String, Object> entry = new java.util.HashMap<>();
                entry.put("score", score);
                entry.put("documentId",
                        hit.path("payload").path("documentId").asText());
                entry.put("fileName",
                        hit.path("payload").path("fileName").asText());
                entry.put("summary",
                        hit.path("payload").path("summary").asText());

                results.add(entry);
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse search results: " + e.getMessage(), e);
        }
        return results;
    }


    public void reindexDocument(
            String documentId,
            String uploadedByUserId,
            List<Float> vector,
            String fileName,
            String summary) {

        if (uploadedByUserId == null || uploadedByUserId.isBlank()) {
            throw new IllegalArgumentException(
                    "Cannot index document without an owner: " + documentId
            );
        }

        upsertDocument(
                documentId,
                uploadedByUserId,
                vector,
                fileName,
                summary
        );
    }

}