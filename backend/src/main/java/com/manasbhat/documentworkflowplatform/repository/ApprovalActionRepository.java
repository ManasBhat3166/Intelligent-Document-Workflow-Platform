package com.manasbhat.documentworkflowplatform.repository;

import com.manasbhat.documentworkflowplatform.entity.ApprovalAction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ApprovalActionRepository extends MongoRepository<ApprovalAction, String> {
    List<ApprovalAction> findByDocumentIdOrderByActionAtAsc(String documentId);
}