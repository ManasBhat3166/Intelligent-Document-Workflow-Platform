
package com.manasbhat.documentworkflowplatform.repository;

import com.manasbhat.documentworkflowplatform.entity.DocumentEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import com.manasbhat.documentworkflowplatform.entity.ApprovalStatus;
import java.time.Instant;
import java.util.List;

public interface DocumentRepository
        extends MongoRepository<DocumentEntity, String> {

    List<DocumentEntity> findByUploadedByUserId(String userId);

    boolean existsByResubmissionOfDocumentId(String documentId);

    List<DocumentEntity> findByResubmissionOfDocumentId(String documentId);

    @Query("{ 'uploadedByUserId': ?0, '$or': [" +
            "{ 'originalFileName': { '$regex': ?1, '$options': 'i' } }, " +
            "{ 'extractedText': { '$regex': ?1, '$options': 'i' } }, " +
            "{ 'aiSummary': { '$regex': ?1, '$options': 'i' } }" +
            "] }")
    List<DocumentEntity> searchByKeywords(
            String userId,
            String keywordRegex
    );

    @Query("{ '$or': [" +
            "{ 'originalFileName': { '$regex': ?0, '$options': 'i' } }, " +
            "{ 'extractedText': { '$regex': ?0, '$options': 'i' } }, " +
            "{ 'aiSummary': { '$regex': ?0, '$options': 'i' } }" +
            "] }")
    List<DocumentEntity> searchAllByKeywords(String keywordRegex);

    @Query("{ 'assignedReviewerId': ?0, '$or': [" +
            "{ 'originalFileName': { '$regex': ?1, '$options': 'i' } }, " +
            "{ 'extractedText': { '$regex': ?1, '$options': 'i' } }, " +
            "{ 'aiSummary': { '$regex': ?1, '$options': 'i' } }" +
            "] }")
    List<DocumentEntity> searchByReviewerAndKeywords(
            String reviewerId,
            String keywordRegex
    );

    @Query("{ 'approvalStatus': 'PENDING_MANAGER', '$or': [" +
            "{ 'originalFileName': { '$regex': ?0, '$options': 'i' } }, " +
            "{ 'extractedText': { '$regex': ?0, '$options': 'i' } }, " +
            "{ 'aiSummary': { '$regex': ?0, '$options': 'i' } }" +
            "] }")
    List<DocumentEntity> searchManagerDocumentsByKeywords(String keywordRegex);

    List<DocumentEntity> findByApprovalStatus(
            ApprovalStatus approvalStatus
    );

    List<DocumentEntity> findByAssignedReviewerId(String assignedReviewerId);

    List<DocumentEntity> findByApprovalStatusOrderByUploadedAtAsc(
            ApprovalStatus approvalStatus
    );

    List<DocumentEntity> findByApprovalStatusAndAssignedReviewerIdOrderByUploadedAtAsc(
            ApprovalStatus approvalStatus,
            String assignedReviewerId
    );

    long countByAssignedReviewerIdAndApprovalStatusIn(
            String assignedReviewerId,
            List<ApprovalStatus> statuses
    );

    List<DocumentEntity> findByApprovalStatusAndUploadedAtBeforeOrderByUploadedAtAsc(
            ApprovalStatus approvalStatus,
            java.time.Instant cutoff
    );

    List<DocumentEntity> findByApprovalStatusAndAssignedReviewerAtBeforeOrderByAssignedReviewerAtAsc(
            ApprovalStatus approvalStatus,
            Instant cutoff
    );

    List<DocumentEntity> findByAssignedReviewerIdAndOriginalFileNameRegexIgnoreCaseOrAssignedReviewerIdAndExtractedTextRegexIgnoreCaseOrAssignedReviewerIdAndAiSummaryRegexIgnoreCase(
            String reviewerId1, String fileName,
            String reviewerId2, String extractedText,
            String reviewerId3, String summary
    );

}
