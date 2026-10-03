package com.manasbhat.documentworkflowplatform.service;

import com.manasbhat.documentworkflowplatform.dto.AiAnalysisResult;
import com.manasbhat.documentworkflowplatform.dto.DocumentUploadedEvent;
import com.manasbhat.documentworkflowplatform.entity.DocumentEntity;
import com.manasbhat.documentworkflowplatform.entity.DocumentStatus;
import com.manasbhat.documentworkflowplatform.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class DocumentEventConsumer {

    private final DocumentRepository documentRepository;
    private final OcrService ocrService;
    private final AiService aiService;

    @KafkaListener(topics = "document-uploaded", groupId = "document-workflow-group")
    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void consumeDocumentUploaded(DocumentUploadedEvent event,
                                        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {

        System.out.println("Received event from topic [" + topic + "] for document: " + event.getDocumentId());

        DocumentEntity doc = documentRepository.findById(event.getDocumentId())
                .orElseThrow(() -> new RuntimeException("Document not found: " + event.getDocumentId()));

        doc.setStatus(DocumentStatus.PROCESSING);
        doc.setUpdatedAt(Instant.now());
        documentRepository.save(doc);

        try {
            String text = ocrService.extractText(doc.getFilePath());
            doc.setExtractedText(text);

            if (text != null && !text.isBlank()) {
                AiAnalysisResult aiResult = aiService.analyzeDocument(text);
                doc.setAiSummary(aiResult.getSummary());
                doc.setAiDocumentTypeGuess(aiResult.getDocumentTypeGuess());
                doc.setAiExtractedEntities(aiResult.getExtractedEntities());
            }

            doc.setStatus(DocumentStatus.PROCESSED);
            doc.setUpdatedAt(Instant.now());
            documentRepository.save(doc);
            System.out.println("Document " + event.getDocumentId() + " OCR + AI analysis complete, marked PROCESSED");
        } catch (Exception e) {
            doc.setStatus(DocumentStatus.FAILED);
            doc.setUpdatedAt(Instant.now());
            documentRepository.save(doc);
            System.out.println("Processing failed for " + event.getDocumentId() + ": " + e.getMessage());
            throw e;
        }
    }
}