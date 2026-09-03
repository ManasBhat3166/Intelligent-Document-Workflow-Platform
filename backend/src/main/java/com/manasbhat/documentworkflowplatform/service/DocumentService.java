package com.manasbhat.documentworkflowplatform.service;

import com.manasbhat.documentworkflowplatform.dto.DocumentResponse;
import com.manasbhat.documentworkflowplatform.entity.DocumentEntity;
import com.manasbhat.documentworkflowplatform.entity.DocumentType;
import com.manasbhat.documentworkflowplatform.repository.DocumentRepository;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final DocumentEventProducer documentEventProducer;

    public DocumentResponse uploadDocument(MultipartFile file, DocumentType type, UserPrincipal uploader) {
        String storedFileName = fileStorageService.storeFile(file);

        DocumentEntity doc = DocumentEntity.builder()
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .filePath(fileStorageService.getFilePath(storedFileName))
                .fileSizeBytes(file.getSize())
                .contentType(file.getContentType())
                .documentType(type)
                .uploadedByUserId(uploader.getUser().getId())
                .uploadedByEmail(uploader.getUser().getEmail())
                .uploadedAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        documentRepository.save(doc);
        documentEventProducer.publishDocumentUploaded(
                new com.manasbhat.documentworkflowplatform.dto.DocumentUploadedEvent(
                        doc.getId(), doc.getOriginalFileName(), doc.getContentType(), doc.getUploadedByUserId()
                )
        );
        return toResponse(doc);
    }

    public List<DocumentResponse> getMyDocuments(String userId) {
        return documentRepository.findByUploadedByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<DocumentResponse> getAllDocuments() {
        return documentRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public DocumentResponse getDocumentById(String id) {
        DocumentEntity doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
        return toResponse(doc);
    }

    public DocumentEntity getDocumentEntityById(String id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
    }

    private DocumentResponse toResponse(DocumentEntity doc) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .originalFileName(doc.getOriginalFileName())
                .fileSizeBytes(doc.getFileSizeBytes())
                .contentType(doc.getContentType())
                .documentType(doc.getDocumentType())
                .status(doc.getStatus())
                .uploadedByEmail(doc.getUploadedByEmail())
                .uploadedAt(doc.getUploadedAt())
                .build();
    }
}