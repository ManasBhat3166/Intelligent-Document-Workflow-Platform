package com.manasbhat.documentworkflowplatform.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class EmbeddingService {

    private final RestClient restClient = RestClient.create("http://localhost:11434");
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Float> getEmbedding(String text) {
        String truncated = text.length() > 2000 ? text.substring(0, 2000) : text;

        Map<String, Object> requestBody = Map.of(
                "model", "nomic-embed-text",
                "prompt", truncated
        );

        String responseJson = restClient.post()
                .uri("/api/embeddings")
                .body(requestBody)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode embeddingArray = root.path("embedding");
            List<Float> vector = new ArrayList<>();
            embeddingArray.forEach(node -> vector.add((float) node.asDouble()));
            return vector;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse embedding response: " + e.getMessage(), e);
        }
    }
}