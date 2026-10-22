
package com.manasbhat.documentworkflowplatform.controller;

import com.manasbhat.documentworkflowplatform.dto.CreateDirectConversationRequest;
import com.manasbhat.documentworkflowplatform.dto.CreateDocumentDiscussionRequest;
import com.manasbhat.documentworkflowplatform.dto.SendMessageRequest;
import com.manasbhat.documentworkflowplatform.entity.Conversation;
import com.manasbhat.documentworkflowplatform.entity.Message;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import com.manasbhat.documentworkflowplatform.service.ConversationService;
import com.manasbhat.documentworkflowplatform.dto.ConversationResponse;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/communications")
@RequiredArgsConstructor
public class CommunicationController {

    private final ConversationService conversationService;

    @PostMapping("/direct")
    public ResponseEntity<Conversation> createDirectConversation(
            @RequestBody CreateDirectConversationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversationService.createDirectConversation(
                        request, principal));
    }

    @PostMapping("/document")
    public ResponseEntity<Conversation> createDocumentDiscussion(
            @Valid @RequestBody CreateDocumentDiscussionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversationService.createDocumentDiscussion(
                        request, principal));
    }


    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getMyConversations(
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(
                conversationService.getMyConversationResponses(principal));
    }


    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable String conversationId,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(
                conversationService.getMessages(
                        conversationId, principal));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Message> sendMessage(
            @PathVariable String conversationId,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversationService.sendMessage(
                        conversationId, request, principal));
    }
}
