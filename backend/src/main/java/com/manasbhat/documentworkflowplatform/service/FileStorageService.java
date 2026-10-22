package com.manasbhat.documentworkflowplatform.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    public String storeFile(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir)
                    .toAbsolutePath()
                    .normalize();

            Files.createDirectories(uploadPath);

            String originalFileName = file.getOriginalFilename();

            if (originalFileName == null || originalFileName.isBlank()
                    || originalFileName.contains("/")
                    || originalFileName.contains("\\")) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid file name."
                );
            }

            String extension = "";
            int dotIndex = originalFileName.lastIndexOf('.');

            if (dotIndex > 0) {
                extension = originalFileName.substring(dotIndex)
                        .toLowerCase(Locale.ROOT);
            }

            String storedFileName = UUID.randomUUID() + extension;

            Path targetPath = uploadPath.resolve(storedFileName).normalize();

            if (!targetPath.startsWith(uploadPath)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid storage path."
                );
            }

            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath);
            }

            return storedFileName;

        } catch (IOException e) {
            throw new RuntimeException("Failed to store file.", e);
        }
    }

    public Path getSafeFilePath(String storedFileName) {
        if (storedFileName == null || storedFileName.isBlank()
                || !Paths.get(storedFileName).getFileName()
                .toString().equals(storedFileName)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid stored filename."
            );
        }

        Path uploadPath = Paths.get(uploadDir)
                .toAbsolutePath()
                .normalize();

        Path targetPath = uploadPath.resolve(storedFileName).normalize();

        if (!targetPath.startsWith(uploadPath)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid storage path."
            );
        }

        return targetPath;
    }

    public String getFilePath(String storedFileName) {
        return Paths.get(uploadDir).resolve(storedFileName).toString();
    }
}
