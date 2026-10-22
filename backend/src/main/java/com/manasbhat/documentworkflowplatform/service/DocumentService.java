package com.manasbhat.documentworkflowplatform.service;

import com.manasbhat.documentworkflowplatform.dto.DocumentResponse;
import com.manasbhat.documentworkflowplatform.entity.ApprovalStatus;
import com.manasbhat.documentworkflowplatform.entity.DocumentEntity;
import com.manasbhat.documentworkflowplatform.entity.DocumentType;
import com.manasbhat.documentworkflowplatform.entity.WorkflowSettings;
import com.manasbhat.documentworkflowplatform.repository.DocumentRepository;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import com.manasbhat.documentworkflowplatform.entity.ApprovalStatus;
import com.manasbhat.documentworkflowplatform.entity.Role;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final DocumentEventProducer documentEventProducer;
    private final WorkflowSettingsService workflowSettingsService;
    private final ApprovalService approvalService;
    private final FileContentValidator fileContentValidator;


    private void validateFileType(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();

        if (originalFilename == null || originalFilename.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "File name is required."
            );
        }

        String filename = originalFilename.trim();

        if (filename.contains("/") || filename.contains("\\")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid file name."
            );
        }

        int dotIndex = filename.lastIndexOf(".");

        if (dotIndex <= 0 || dotIndex == filename.length() - 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "File must have an allowed extension."
            );
        }

        String extension = filename.substring(dotIndex + 1)
                .toLowerCase(Locale.ROOT);

        Set<String> allowedExtensions = Set.of(
                "pdf", "docx", "doc", "txt", "png", "jpg", "jpeg"
        );

        if (!allowedExtensions.contains(extension)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported file type. Allowed formats: PDF, DOCX, DOC, TXT, PNG, JPG, JPEG."
            );
        }

        String contentType = file.getContentType();

        Set<String> allowedContentTypes = switch (extension) {
            case "pdf" -> Set.of("application/pdf");

            case "docx" -> Set.of(
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            );

            case "doc" -> Set.of("application/msword");

            case "txt" -> Set.of("text/plain");

            case "png" -> Set.of("image/png");

            case "jpg", "jpeg" -> Set.of("image/jpeg");

            default -> Set.of();
        };

        if (contentType == null
                || !allowedContentTypes.contains(
                contentType.toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "File content type does not match the allowed format."
            );
        }
    }

    public DocumentResponse uploadDocument(
            MultipartFile file,
            DocumentType type,
            String resubmitOf,
            UserPrincipal uploader
    ) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Uploaded file cannot be empty."
            );
        }

        long maxFileSize = 20L * 1024 * 1024;

        if (file.getSize() > maxFileSize) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "File size must not exceed 20 MB."
            );
        }
        validateFileType(file);

        /*
         * If this is a resubmission, validate the rejected document
         * before creating the new corrected document.
         */
        DocumentEntity originalDocument = null;

        if (resubmitOf != null && !resubmitOf.isBlank()) {

            originalDocument = documentRepository
                    .findById(resubmitOf)
                    .orElseThrow(() ->
                            new RuntimeException("Original document not found")
                    );

            // Make sure the employee owns the rejected document

            // Make sure the employee owns the rejected document
            String uploaderId = uploader.getUser().getId();

            if (uploaderId == null
                    || !uploaderId.equals(originalDocument.getUploadedByUserId())) {

                throw new org.springframework.security.access.AccessDeniedException(
                        "You are not allowed to resubmit this document."
                );
            }


            // Only rejected documents can be resubmitted
            if (originalDocument.getApprovalStatus()
                    != ApprovalStatus.REJECTED) {

                throw new IllegalStateException(
                        "Only rejected documents can be resubmitted"
                );
            }

            // Check maximum resubmission limit
            WorkflowSettings settings =
                    workflowSettingsService.getSettings();

            if (originalDocument.getResubmissionCount()
                    >= settings.getMaxResubmissions()) {

                throw new IllegalStateException(
                        "Maximum resubmission limit reached. You have used all "
                                + settings.getMaxResubmissions()
                                + " allowed resubmissions."
                );
            }
        }

        /*
         * Store the uploaded file.
         */
        fileContentValidator.validate(file);
        String storedFileName = fileStorageService.storeFile(file);

        /*
         * Create a NEW document.
         *
         * We do not modify the rejected document.
         * The new document becomes the corrected/resubmitted version.
         */
        DocumentEntity.DocumentEntityBuilder builder = DocumentEntity.builder()
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .filePath(fileStorageService.getFilePath(storedFileName))
                .fileSizeBytes(file.getSize())
                .contentType(file.getContentType())
                .documentType(type)
                .uploadedByUserId(uploader.getUser().getId())
                .uploadedByEmail(uploader.getUser().getEmail())
                .uploadedAt(Instant.now())
                .updatedAt(Instant.now());

        /*
         * Normal upload:
         * resubmissionOfDocumentId remains null
         * resubmissionCount remains 0
         *
         * Resubmission:
         * link the new document to the rejected document
         * and increment the resubmission count.
         */
        if (originalDocument != null) {

            builder
                    .resubmissionOfDocumentId(originalDocument.getId())
                    .resubmissionCount(
                            originalDocument.getResubmissionCount() + 1
                    );
        }

        DocumentEntity doc = builder.build();

        documentRepository.save(doc);
        approvalService.logSystemAction(
                doc.getId(),
                "UPLOADED",
                originalDocument != null
                        ? "Corrected version uploaded for resubmission."
                        : "Document uploaded successfully."
        );

        if (originalDocument != null) {
            approvalService.logSystemAction(
                    originalDocument.getId(),
                    "RESUBMITTED",
                    "A corrected version was uploaded for review."
            );
        }

        documentEventProducer.publishDocumentUploaded(
                new com.manasbhat.documentworkflowplatform.dto.DocumentUploadedEvent(
                        doc.getId(),
                        doc.getOriginalFileName(),
                        doc.getContentType(),
                        doc.getUploadedByUserId()
                )
        );

        return toResponse(doc);
    }

    public List<DocumentResponse> getMyDocuments(String userId) {
        return documentRepository.findByUploadedByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }


    public List<DocumentResponse> getAllDocuments(UserPrincipal principal) {
        Role role = principal.getUser().getRole();

        List<DocumentEntity> documents;

        if (role == Role.ADMIN) {
            documents = documentRepository.findAll();

        } else if (role == Role.REVIEWER) {
            String reviewerId = principal.getUser().getId();

            documents = documentRepository.findByAssignedReviewerId(reviewerId);

        } else if (role == Role.MANAGER) {
            documents = documentRepository.findByApprovalStatus(
                    ApprovalStatus.PENDING_MANAGER
            );

        } else {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not allowed to view these documents."
            );
        }

        return documents.stream()
                .map(this::toResponse)
                .toList();
    }


    public DocumentEntity getDocumentEntityById(String id) {
        return documentRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Document not found."
                        )
                );
    }


    public DocumentResponse getDocumentByIdForUser(
            String id,
            UserPrincipal principal
    ) {
        DocumentEntity doc = getDocumentEntityById(id);
        checkDocumentAccess(doc, principal);
        return toResponse(doc);
    }

    public DocumentEntity getDocumentEntityByIdForUser(
            String id,
            UserPrincipal principal
    ) {
        DocumentEntity doc = getDocumentEntityById(id);
        checkDocumentAccess(doc, principal);
        return doc;
    }



    private void checkDocumentAccess(
            DocumentEntity doc,
            UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Authentication is required to access this document."
            );
        }

        String userId = principal.getUser().getId();
        Role role = principal.getUser().getRole();

        boolean isOwner =
                userId != null
                        && userId.equals(doc.getUploadedByUserId());

        boolean isAssignedReviewer =
                role == Role.REVIEWER
                        && userId != null
                        && userId.equals(doc.getAssignedReviewerId());

        boolean isManager = role == Role.MANAGER;

        boolean isAdmin = role == Role.ADMIN;

        if (!(isOwner || isAssignedReviewer || isManager || isAdmin)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not allowed to access this document."
            );
        }
    }



    private DocumentResponse toResponse(DocumentEntity doc) {

        boolean resubmitted =
                documentRepository.existsByResubmissionOfDocumentId(doc.getId());

        String resubmittedDocumentId = null;

        if (resubmitted) {
            resubmittedDocumentId =
                    documentRepository.findByResubmissionOfDocumentId(doc.getId())
                            .stream()
                            .findFirst()
                            .map(DocumentEntity::getId)
                            .orElse(null);
        }

        return DocumentResponse.builder()
                .id(doc.getId())
                .originalFileName(doc.getOriginalFileName())
                .fileSizeBytes(doc.getFileSizeBytes())
                .contentType(doc.getContentType())
                .documentType(doc.getDocumentType())
                .status(doc.getStatus())
                .uploadedByEmail(doc.getUploadedByEmail())
                .uploadedAt(doc.getUploadedAt())

                .aiSummary(doc.getAiSummary())
                .aiDocumentTypeGuess(doc.getAiDocumentTypeGuess())
                .aiExtractedEntities(doc.getAiExtractedEntities())

                .approvalStatus(doc.getApprovalStatus())
                .resubmissionCount(doc.getResubmissionCount())
                .resubmissionOfDocumentId(doc.getResubmissionOfDocumentId())

                .resubmitted(resubmitted)
                .resubmittedDocumentId(resubmittedDocumentId)

                .build();
    }

}