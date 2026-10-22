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
@Document(collection = "workflow_settings")
public class WorkflowSettings {

    @Id
    private String id;

    @Builder.Default
    private int maxResubmissions = 3;

    private String updatedBy;

    private Instant updatedAt;
}