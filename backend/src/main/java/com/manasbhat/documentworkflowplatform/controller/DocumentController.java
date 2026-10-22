package com.manasbhat.documentworkflowplatform.controller;

import com.manasbhat.documentworkflowplatform.dto.DocumentResponse;
import com.manasbhat.documentworkflowplatform.entity.DocumentType;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import com.manasbhat.documentworkflowplatform.service.DocumentService;
import com.manasbhat.documentworkflowplatform.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final FileStorageService fileStorageService;


    @PreAuthorize("isAuthenticated()")
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") DocumentType type,
            @RequestParam(value = "resubmitOf", required = false) String resubmitOf,
            @AuthenticationPrincipal UserPrincipal uploader) {

        if (uploader == null || uploader.getUser() == null
                || uploader.getUser().getId() == null
                || uploader.getUser().getId().isBlank()) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Authenticated user information is missing."
            );
        }

        return ResponseEntity.ok(
                documentService.uploadDocument(file, type, resubmitOf, uploader)
        );
    }


    @PreAuthorize("isAuthenticated()")
    @GetMapping("/my")
    public ResponseEntity<List<DocumentResponse>> getMyDocuments(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(documentService.getMyDocuments(user.getUser().getId()));
    }


    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','REVIEWER')")
    public ResponseEntity<List<DocumentResponse>> getAllDocuments(
            @AuthenticationPrincipal UserPrincipal user
    ) {
        return ResponseEntity.ok(
                documentService.getAllDocuments(user)
        );
    }


    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocumentById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        return ResponseEntity.ok(
                documentService.getDocumentByIdForUser(id, user)
        );
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadDocument(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal user
    ) throws java.io.IOException {

        // Preserve authorization checks
        var doc = documentService.getDocumentEntityByIdForUser(id, user);

        // Resolve the file using its generated storage filename
        Path path = fileStorageService.getSafeFilePath(
                doc.getStoredFileName()
        );

        // Reject missing files, unreadable files, and symbolic links
        if (!Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)
                || !Files.isReadable(path)) {
            return ResponseEntity.notFound().build();
        }

        var resource = new UrlResource(path.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        String originalFileName = doc.getOriginalFileName();

        if (originalFileName == null || originalFileName.isBlank()) {
            originalFileName = "document";
        }

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

        String contentType = doc.getContentType();

        if (contentType != null) {
            try {
                MediaType candidate = MediaType.parseMediaType(contentType);

                if (candidate.isCompatibleWith(MediaType.APPLICATION_PDF)
                        || candidate.isCompatibleWith(MediaType.IMAGE_PNG)
                        || candidate.isCompatibleWith(MediaType.IMAGE_JPEG)
                        || candidate.isCompatibleWith(MediaType.TEXT_PLAIN)
                        || contentType.equals(
                        "application/msword")
                        || contentType.equals(
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
                    mediaType = candidate;
                }
            } catch (IllegalArgumentException ignored) {
                // Keep the safe default content type
            }
        }


        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(originalFileName, StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Security-Policy", "default-src 'none'; sandbox")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("X-Frame-Options", "DENY")
                .contentType(mediaType)
                .body(resource);

    }
}