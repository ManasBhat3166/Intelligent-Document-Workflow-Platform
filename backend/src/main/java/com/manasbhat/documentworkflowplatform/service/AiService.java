package com.manasbhat.documentworkflowplatform.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.manasbhat.documentworkflowplatform.dto.AiAnalysisResult;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class AiService {

    private final RestClient restClient = RestClient.create("http://localhost:11434");
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String MODEL = "llama3.2:1b";

    public AiAnalysisResult analyzeDocument(String extractedText) {
        String truncatedText = extractedText.length() > 2000
                ? extractedText.substring(0, 2000)
                : extractedText;

        String prompt = """
                Analyze the following document text and respond in this exact format, nothing else:
                SUMMARY: <2-3 sentence summary>
                TYPE: <one of CONTRACT, INVOICE, RESUME, REPORT, OTHER>
                ENTITIES: <comma-separated key names, dates, amounts found>

                Document text:
                %s
                """.formatted(truncatedText);

        Map<String, Object> requestBody = Map.of(
                "model", MODEL,
                "prompt", prompt,
                "stream", false
        );

        String responseJson = restClient.post()
                .uri("/api/generate")
                .body(requestBody)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(responseJson);
            String content = root.path("response").asText();
            return parseResponse(content);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Ollama response: " + e.getMessage(), e);
        }
    }

    private AiAnalysisResult parseResponse(String response) {
        String summary = extractSection(response, "SUMMARY:", "TYPE:");
        String type = extractSection(response, "TYPE:", "ENTITIES:");
        String entities = response.contains("ENTITIES:")
                ? response.substring(response.indexOf("ENTITIES:") + 9).trim()
                : "";

        if (summary.isBlank()) summary = response.trim();
        if (type.isBlank()) type = "OTHER";

        return new AiAnalysisResult(summary.trim(), type.trim(), entities);
    }

    private String extractSection(String text, String startMarker, String endMarker) {
        int start = text.indexOf(startMarker);
        int end = text.indexOf(endMarker);
        if (start == -1) return "";
        start += startMarker.length();
        return end == -1 ? text.substring(start) : text.substring(start, end);
    }
}