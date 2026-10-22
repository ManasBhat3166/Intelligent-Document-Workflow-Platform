package com.manasbhat.documentworkflowplatform.repository;

import com.manasbhat.documentworkflowplatform.entity.WorkflowSettings;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface WorkflowSettingsRepository
        extends MongoRepository<WorkflowSettings, String> {
}