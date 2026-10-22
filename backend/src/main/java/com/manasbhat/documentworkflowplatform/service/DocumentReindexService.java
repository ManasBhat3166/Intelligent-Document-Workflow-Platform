
package com.manasbhat.documentworkflowplatform.service;

import com.manasbhat.documentworkflowplatform.entity.DocumentEntity;
import com.manasbhat.documentworkflowplatform.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentReindexService {

    private final DocumentRepository documentRepository;
    private final EmbeddingService embeddingService;
    private final VectorSearchService vectorSearchService;

    public int reindexAllDocuments() {
        List<DocumentEntity> documents = documentRepository.findAll();
        int indexed = 0;

        for (DocumentEntity doc : documents) {
            String text = doc.getExtractedText();
            String ownerId = doc.getUploadedByUserId();

            if (text == null || text.isBlank()) {
                System.out.println(
                        "Skipping document with no extracted text: " + doc.getId()
                );
                continue;
            }

            if (ownerId == null || ownerId.isBlank()) {
                System.out.println(
                        "Skipping document with no owner: " + doc.getId()
                );
                continue;
            }

            try {
                var embedding = embeddingService.getEmbedding(text);

                vectorSearchService.upsertDocument(
                        doc.getId(),
                        ownerId,
                        embedding,
                        doc.getOriginalFileName(),
                        doc.getAiSummary()
                );

                indexed++;

                System.out.println(
                        "Reindexed: " + doc.getOriginalFileName()
                );
            } catch (Exception e) {
                System.err.println(
                        "Failed to reindex document " + doc.getId()
                                + ": " + e.getMessage()
                );
            }
        }

        System.out.println(
                "Reindex complete. Successfully indexed: " + indexed
        );

        return indexed;
    }
}
