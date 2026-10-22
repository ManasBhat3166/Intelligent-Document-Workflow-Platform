package com.manasbhat.documentworkflowplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String recipientUserId;

    private String documentId;

    private String title;

    private String message;

    private String type;

    @Builder.Default
    private boolean read = false;

    private Instant createdAt;
}