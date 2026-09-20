package com.manasbhat.documentworkflowplatform.service;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class OcrService {

    @Value("${app.ocr.tessdata-path}")
    private String tessDataPath;

    public String extractText(String filePath) {
        Tesseract tesseract = new Tesseract();
        tesseract.setDatapath(tessDataPath);
        tesseract.setLanguage("eng");

        try {
            File file = new File(filePath);
            return tesseract.doOCR(file);
        } catch (TesseractException e) {
            throw new RuntimeException("OCR extraction failed: " + e.getMessage(), e);
        }
    }
}