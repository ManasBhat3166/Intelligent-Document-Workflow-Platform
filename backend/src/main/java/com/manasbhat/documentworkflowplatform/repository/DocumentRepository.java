package com.manasbhat.documentworkflowplatform.repository;

import com.manasbhat.documentworkflowplatform.entity.DocumentEntity;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DocumentRepository extends MongoRepository<DocumentEntity, String> {
    List<DocumentEntity> findByUploadedByUserId(String userId);
}