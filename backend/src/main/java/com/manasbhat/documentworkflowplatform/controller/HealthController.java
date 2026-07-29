package com.manasbhat.documentworkflowplatform.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, Object> checkHealth() {
        return Map.of(
                "status", "UP",
                "service", "Intelligent Document Workflow Platform",
                "timestamp", Instant.now().toString()
        );
    }
}