
package com.manasbhat.documentworkflowplatform.config;

import com.manasbhat.documentworkflowplatform.service.DocumentReindexService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("reindex")
@RequiredArgsConstructor
public class DocumentReindexRunner implements CommandLineRunner {

    private final DocumentReindexService documentReindexService;

    @Override
    public void run(String... args) {
        documentReindexService.reindexAllDocuments();
    }
}
