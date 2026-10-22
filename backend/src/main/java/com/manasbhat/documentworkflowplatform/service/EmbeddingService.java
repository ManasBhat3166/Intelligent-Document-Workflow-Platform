
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

    private final RestClient restClient =
            RestClient.create("http://localhost:11434");

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Float> getEmbedding(String text) {

        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException(
                    "Text cannot be empty when generating embeddings"
            );
        }

        String cleanedText = text.trim();

        // Keep a reasonable input limit for the current implementation.
        if (cleanedText.length() > 6000) {
            cleanedText = cleanedText.substring(0, 6000);
        }

        Map<String, Object> requestBody = Map.of(
                "model", "nomic-embed-text",
                "prompt", cleanedText
        );

        String responseJson = restClient.post()
                .uri("/api/embeddings")
                .body(requestBody)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode embeddingArray = root.path("embedding");

            if (!embeddingArray.isArray() || embeddingArray.isEmpty()) {
                throw new IllegalStateException(
                        "Embedding model returned an empty vector"
                );
            }

            List<Float> vector = new ArrayList<>();

            for (JsonNode node : embeddingArray) {
                float value = (float) node.asDouble();

                if (!Float.isFinite(value)) {
                    throw new IllegalStateException(
                            "Embedding contains an invalid number"
                    );
                }

                vector.add(value);
            }

            if (vector.size() != 768) {
                throw new IllegalStateException(
                        "Expected 768 embedding dimensions but received "
                                + vector.size()
                );
            }

            return vector;

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to parse embedding response: "
                            + e.getMessage(),
                    e
            );
        }
    }
}
