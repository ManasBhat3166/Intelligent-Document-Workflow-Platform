
package com.manasbhat.documentworkflowplatform.service;

import com.manasbhat.documentworkflowplatform.dto.CreateDirectConversationRequest;
import com.manasbhat.documentworkflowplatform.dto.CreateDocumentDiscussionRequest;
import com.manasbhat.documentworkflowplatform.dto.SendMessageRequest;
import com.manasbhat.documentworkflowplatform.entity.Conversation;
import com.manasbhat.documentworkflowplatform.entity.ConversationType;
import com.manasbhat.documentworkflowplatform.entity.DocumentEntity;
import com.manasbhat.documentworkflowplatform.entity.Message;
import com.manasbhat.documentworkflowplatform.entity.User;
import com.manasbhat.documentworkflowplatform.repository.ConversationRepository;
import com.manasbhat.documentworkflowplatform.repository.DocumentRepository;
import com.manasbhat.documentworkflowplatform.repository.MessageRepository;
import com.manasbhat.documentworkflowplatform.repository.UserRepository;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import com.manasbhat.documentworkflowplatform.dto.ConversationResponse;
import com.manasbhat.documentworkflowplatform.dto.UserResponse;
import com.manasbhat.documentworkflowplatform.entity.Role;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public Conversation createDirectConversation(
            CreateDirectConversationRequest request,
            UserPrincipal principal) {

        User currentUser = principal.getUser();

        if (request == null
                || request.getRecipientUserId() == null
                || request.getRecipientUserId().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Recipient user ID is required"
            );
        }

        String currentUserId = currentUser.getId();
        String recipientId = request.getRecipientUserId().trim();

        if (currentUserId.equals(recipientId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot start a conversation with yourself"
            );
        }

        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Recipient user not found"
                ));

        if (!recipient.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Recipient account is disabled"
            );
        }

        List<Conversation> existingConversations =
                conversationRepository
                        .findByTypeAndParticipantUserIdsContaining(
                                ConversationType.DIRECT,
                                currentUserId
                        );

        for (Conversation conversation : existingConversations) {
            List<String> participants =
                    conversation.getParticipantUserIds();

            if (participants != null
                    && participants.size() == 2
                    && participants.contains(recipientId)) {
                return conversation;
            }
        }

        Instant now = Instant.now();

        Conversation conversation = Conversation.builder()
                .type(ConversationType.DIRECT)
                .participantUserIds(
                        new ArrayList<>(
                                List.of(currentUserId, recipientId)
                        )
                )
                .createdByUserId(currentUserId)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return conversationRepository.save(conversation);
    }

    public Message sendMessage(
            String conversationId,
            SendMessageRequest request,
            UserPrincipal principal) {

        if (request == null
                || request.getContent() == null
                || request.getContent().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Message content is required"
            );
        }

        String content = request.getContent().trim();

        if (content.length() > 5000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Message cannot exceed 5000 characters"
            );
        }

        User sender = principal.getUser();

        Conversation conversation = getAuthorizedConversation(
                conversationId,
                sender.getId()
        );

        Instant now = Instant.now();

        Message message = Message.builder()
                .conversationId(conversation.getId())
                .senderUserId(sender.getId())
                .senderEmail(sender.getEmail())
                .content(content)
                .sentAt(now)
                .edited(false)
                .build();

        Message savedMessage = messageRepository.save(message);

        conversation.setLastMessage(content);
        conversation.setLastMessageAt(now);
        conversation.setUpdatedAt(now);

        conversationRepository.save(conversation);

        return savedMessage;
    }

    public List<Message> getMessages(
            String conversationId,
            UserPrincipal principal) {

        User currentUser = principal.getUser();

        getAuthorizedConversation(
                conversationId,
                currentUser.getId()
        );

        return messageRepository
                .findByConversationIdOrderBySentAtAsc(conversationId);
    }


    private Conversation getAuthorizedConversation(
            String conversationId,
            String userId) {

        if (conversationId == null || conversationId.isBlank()
                || userId == null || userId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Conversation ID and user ID are required"
            );
        }

        Conversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Conversation not found"
                ));

        List<String> participants = conversation.getParticipantUserIds();

        if (participants == null || !participants.contains(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not a participant in this conversation"
            );
        }

        // Recheck document permissions every time a document
        // discussion is accessed or a message is sent.
        if (conversation.getType() == ConversationType.DOCUMENT) {

            String documentId = conversation.getDocumentId();

            if (documentId == null || documentId.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "This document discussion is invalid"
                );
            }

            DocumentEntity document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Document not found"
                    ));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED,
                            "User account not found"
                    ));

            boolean isOwner = userId.equals(document.getUploadedByUserId());
            boolean isAdmin = user.getRole() == Role.ADMIN;
            boolean isManager = user.getRole() == Role.MANAGER;
            boolean isAssignedReviewer = user.getRole() == Role.REVIEWER
                    && userId.equals(document.getAssignedReviewerId());

            if (!isOwner && !isAdmin && !isManager && !isAssignedReviewer) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You are not allowed to access this document discussion"
                );
            }
        }

        return conversation;
    }


    public void authorizeWebSocketConversation(
            String conversationId,
            UserPrincipal principal) {

        if (principal == null || principal.getUser() == null) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Authentication required");
        }

        getAuthorizedConversation(
                conversationId,
                principal.getUser().getId());
    }



    public List<Conversation> getMyConversations(UserPrincipal principal) {

        String userId = principal.getUser().getId();

        return conversationRepository
                .findByParticipantUserIdsContainingOrderByUpdatedAtDesc(userId);
    }

    public List<ConversationResponse> getMyConversationResponses(
            UserPrincipal principal) {

        String userId = principal.getUser().getId();

        List<Conversation> conversations = conversationRepository
                .findByParticipantUserIdsContainingOrderByUpdatedAtDesc(userId);

        return conversations.stream()
                .map(conversation -> {
                    List<UserResponse> participants =
                            conversation.getParticipantUserIds()
                                    .stream()
                                    .map(participantId ->
                                            userRepository.findById(participantId)
                                                    .map(user -> UserResponse.builder()
                                                            .id(user.getId())
                                                            .email(user.getEmail())
                                                            .fullName(user.getFullName())
                                                            .role(user.getRole())
                                                            .enabled(user.isEnabled())
                                                            .createdAt(user.getCreatedAt())
                                                            .build())
                                                    .orElse(null))
                                    .filter(java.util.Objects::nonNull)
                                    .toList();

                    return ConversationResponse.builder()
                            .id(conversation.getId())
                            .type(conversation.getType())
                            .documentId(conversation.getDocumentId())
                            .participantUserIds(
                                    conversation.getParticipantUserIds())
                            .participants(participants)
                            .createdByUserId(conversation.getCreatedByUserId())
                            .lastMessage(conversation.getLastMessage())
                            .lastMessageAt(conversation.getLastMessageAt())
                            .updatedAt(conversation.getUpdatedAt())
                            .build();
                })
                .toList();
    }

    public Conversation createDocumentDiscussion(
            CreateDocumentDiscussionRequest request,
            UserPrincipal principal) {

        if (principal == null || principal.getUser() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required"
            );
        }

        if (request == null
                || request.getDocumentId() == null
                || request.getDocumentId().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Document ID is required"
            );
        }

        String documentId = request.getDocumentId().trim();
        User currentUser = principal.getUser();
        String userId = currentUser.getId();

        DocumentEntity document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Document not found"
                ));

        boolean isOwner =
                userId.equals(document.getUploadedByUserId());

        boolean isAdmin =
                currentUser.getRole() == Role.ADMIN;

        boolean isManager =
                currentUser.getRole() == Role.MANAGER;

        boolean isAssignedReviewer =
                currentUser.getRole() == Role.REVIEWER
                        && userId.equals(document.getAssignedReviewerId());

        if (!isOwner && !isAdmin && !isManager && !isAssignedReviewer) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to access this document"
            );
        }

        List<Conversation> existingDiscussions =
                conversationRepository.findByDocumentIdOrderByCreatedAtAsc(
                        documentId
                );

        for (Conversation existing : existingDiscussions) {
            if (existing.getType() == ConversationType.DOCUMENT) {

                List<String> participants = existing.getParticipantUserIds();

                if (participants == null) {
                    participants = new ArrayList<>();
                    existing.setParticipantUserIds(participants);
                }

                // Include the document owner and the authorized user.
                String ownerId = document.getUploadedByUserId();

                if (ownerId != null && !participants.contains(ownerId)) {
                    participants.add(ownerId);
                }

                if (!participants.contains(userId)) {
                    participants.add(userId);
                }

                existing.setParticipantUserIds(participants);
                existing.setUpdatedAt(Instant.now());

                return conversationRepository.save(existing);
            }
        }

        List<String> participants = new ArrayList<>();
        String ownerId = document.getUploadedByUserId();

        if (ownerId != null) {
            participants.add(ownerId);
        }

        if (!participants.contains(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not an existing participant in this discussion"
            );
        }

        Instant now = Instant.now();

        Conversation conversation = Conversation.builder()
                .type(ConversationType.DOCUMENT)
                .documentId(documentId)
                .participantUserIds(participants)
                .createdByUserId(userId)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return conversationRepository.save(conversation);
    }


}
