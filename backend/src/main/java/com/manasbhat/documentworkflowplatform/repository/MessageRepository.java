
package com.manasbhat.documentworkflowplatform.repository;

import com.manasbhat.documentworkflowplatform.entity.Message;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MessageRepository
        extends MongoRepository<Message, String> {

    List<Message> findByConversationIdOrderBySentAtAsc(
            String conversationId
    );

    List<Message> findTop50ByConversationIdOrderBySentAtDesc(
            String conversationId
    );

    long countByConversationId(String conversationId);
}
