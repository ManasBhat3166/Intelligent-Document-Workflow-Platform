
package com.manasbhat.documentworkflowplatform.repository;

import com.manasbhat.documentworkflowplatform.entity.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ConversationRepository
        extends MongoRepository<Conversation, String> {

    List<Conversation> findByParticipantUserIdsContainingOrderByUpdatedAtDesc(
            String userId
    );

    List<Conversation> findByTypeAndParticipantUserIdsContaining(
            com.manasbhat.documentworkflowplatform.entity.ConversationType type,
            String userId
    );

    List<Conversation> findByDocumentIdOrderByCreatedAtAsc(
            String documentId
    );
}
