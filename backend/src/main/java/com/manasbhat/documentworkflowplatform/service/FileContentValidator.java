
package com.manasbhat.documentworkflowplatform.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;


import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.util.Locale;
import java.util.zip.ZipInputStream;

@Component
public class FileContentValidator {

    public void validate(MultipartFile file) {
        String filename = file.getOriginalFilename();

        if (filename == null || filename.lastIndexOf('.') <= 0) {
            reject("Invalid filename.");
        }

        String extension = filename
                .substring(filename.lastIndexOf('.') + 1)
                .toLowerCase(Locale.ROOT);

        try {
            byte[] header = file.getInputStream().readNBytes(8);

            switch (extension) {
                case "pdf" -> {
                    if (!startsWith(header, "%PDF-".getBytes())) {
                        reject("File contents are not a valid PDF signature.");
                    }
                }

                case "png" -> {
                    byte[] signature = {
                            (byte) 0x89, 0x50, 0x4E, 0x47,
                            0x0D, 0x0A, 0x1A, 0x0A
                    };

                    if (!startsWith(header, signature)) {
                        reject("File contents are not a valid PNG signature.");
                    }
                }

                case "jpg", "jpeg" -> {
                    if (header.length < 3
                            || (header[0] & 0xFF) != 0xFF
                            || (header[1] & 0xFF) != 0xD8
                            || (header[2] & 0xFF) != 0xFF) {
                        reject("File contents are not a valid JPEG signature.");
                    }
                }

                case "doc" -> {
                    byte[] signature = {
                            (byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0,
                            (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1
                    };

                    if (!startsWith(header, signature)) {
                        reject("File contents are not a valid DOC signature.");
                    }
                }

                case "docx" -> {
                    if (header.length < 4
                            || header[0] != 'P'
                            || header[1] != 'K'
                            || header[2] != 3
                            || header[3] != 4) {
                        reject("File contents are not a valid DOCX ZIP signature.");
                    }

                    boolean hasDocumentXml = false;
                    int entryCount = 0;
                    long totalUncompressedBytes = 0;

                    try (ZipInputStream zip = new ZipInputStream(file.getInputStream())) {
                        java.util.zip.ZipEntry entry;

                        while ((entry = zip.getNextEntry()) != null) {
                            entryCount++;

                            if (entryCount > 1000) {
                                reject("DOCX contains too many archive entries.");
                            }

                            if ("word/document.xml".equals(entry.getName())) {
                                hasDocumentXml = true;
                            }

                            byte[] buffer = new byte[8192];
                            int bytesRead;

                            while ((bytesRead = zip.read(buffer)) != -1) {
                                totalUncompressedBytes += bytesRead;

                                if (totalUncompressedBytes > 50L * 1024 * 1024) {
                                    reject("DOCX uncompressed content exceeds the allowed limit.");
                                }
                            }

                            zip.closeEntry();
                        }
                    }

                    if (!hasDocumentXml) {
                        reject("DOCX must contain word/document.xml.");
                    }
                }

                case "txt" -> {
                    byte[] content = file.getBytes();

                    // Allow UTF-8 text, optionally with a UTF-8 BOM.
                    int start = content.length >= 3
                            && (content[0] & 0xFF) == 0xEF
                            && (content[1] & 0xFF) == 0xBB
                            && (content[2] & 0xFF) == 0xBF
                            ? 3 : 0;

                    String text = new String(
                            content,
                            start,
                            content.length - start,
                            StandardCharsets.UTF_8
                    );

                    // Reject invalid UTF-8 sequences and binary control characters.
                    byte[] decoded = text.getBytes(StandardCharsets.UTF_8);

                    if (!java.util.Arrays.equals(
                            java.util.Arrays.copyOfRange(content, start, content.length),
                            decoded)) {
                        reject("TXT file must contain valid UTF-8 text.");
                    }

                    for (int i = 0; i < text.length(); i++) {
                        char ch = text.charAt(i);

                        if (ch == '\uFFFD'
                                || (Character.isISOControl(ch)
                                && ch != '\n'
                                && ch != '\r'
                                && ch != '\t'
                                && ch != '\f')) {
                            reject("TXT file contains invalid text or binary data.");
                        }
                    }
                }

                default -> reject("Unsupported file extension.");
            }
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unable to inspect uploaded file."
            );
        }
    }

    private boolean startsWith(byte[] actual, byte[] expected) {
        if (actual.length < expected.length) {
            return false;
        }

        for (int i = 0; i < expected.length; i++) {
            if (actual[i] != expected[i]) {
                return false;
            }
        }

        return true;
    }

    private void reject(String message) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
