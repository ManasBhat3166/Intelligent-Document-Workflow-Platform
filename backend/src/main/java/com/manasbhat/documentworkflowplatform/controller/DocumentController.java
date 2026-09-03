package com.manasbhat.documentworkflowplatform.controller;

import com.manasbhat.documentworkflowplatform.dto.DocumentResponse;
import com.manasbhat.documentworkflowplatform.entity.DocumentType;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import com.manasbhat.documentworkflowplatform.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") DocumentType type,
            @AuthenticationPrincipal UserPrincipal uploader) {

        return ResponseEntity.ok(documentService.uploadDocument(file, type, uploader));
    }

    @GetMapping("/my")
    public ResponseEntity<List<DocumentResponse>> getMyDocuments(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(documentService.getMyDocuments(user.getUser().getId()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','REVIEWER')")
    public ResponseEntity<List<DocumentResponse>> getAllDocuments() {
        return ResponseEntity.ok(documentService.getAllDocuments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocumentById(@PathVariable String id) {
        return ResponseEntity.ok(documentService.getDocumentById(id));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadDocument(@PathVariable String id) throws java.io.IOException {
        var doc = documentService.getDocumentEntityById(id);
        var path = java.nio.file.Paths.get(doc.getFilePath());
        var resource = new org.springframework.core.io.UrlResource(path.toUri());

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + doc.getOriginalFileName() + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType(doc.getContentType()))
                .body(resource);
    }
}