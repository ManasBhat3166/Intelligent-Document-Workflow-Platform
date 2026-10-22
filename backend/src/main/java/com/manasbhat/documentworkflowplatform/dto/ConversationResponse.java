
package com.manasbhat.documentworkflowplatform.dto;

import com.manasbhat.documentworkflowplatform.entity.ConversationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class ConversationResponse {

    private String id;
    private ConversationType type;
    private String documentId;
    private List<String> participantUserIds;
    private List<UserResponse> participants;
    private String createdByUserId;
    private String lastMessage;
    private Instant lastMessageAt;
    private Instant updatedAt;
}
