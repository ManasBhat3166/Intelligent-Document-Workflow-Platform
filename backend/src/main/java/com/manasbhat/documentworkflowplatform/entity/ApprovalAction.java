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
@Document(collection = "approval_actions")
public class ApprovalAction {

    @Id
    private String id;

    private String documentId;

    private String actionByUserId;

    private String actionByEmail;

    private String actionByRole;

    private String action; // SUBMITTED, APPROVED, REJECTED

    private String comment;

    private Instant actionAt;
}