package com.manasbhat.documentworkflowplatform.service;

import com.manasbhat.documentworkflowplatform.dto.DocumentUploadedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DocumentEventProducer {

    private static final String TOPIC = "document-uploaded";

    private final KafkaTemplate<String, DocumentUploadedEvent> kafkaTemplate;

    public void publishDocumentUploaded(DocumentUploadedEvent event) {
        kafkaTemplate.send(TOPIC, event.getDocumentId(), event);
        System.out.println("📤 Published event for document: " + event.getDocumentId());
    }
}