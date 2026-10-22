
package com.manasbhat.documentworkflowplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "conversations")
public class Conversation {

    @Id
    private String id;

    private ConversationType type;

    @Builder.Default
    private List<String> participantUserIds = new ArrayList<>();

    // Set only for document-specific discussions
    private String documentId;

    private String createdByUserId;

    private Instant createdAt;

    private Instant updatedAt;

    private String lastMessage;

    private Instant lastMessageAt;
}
