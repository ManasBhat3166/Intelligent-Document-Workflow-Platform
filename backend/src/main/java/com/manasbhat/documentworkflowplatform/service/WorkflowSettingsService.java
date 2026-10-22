package com.manasbhat.documentworkflowplatform.service;

import com.manasbhat.documentworkflowplatform.entity.WorkflowSettings;
import com.manasbhat.documentworkflowplatform.repository.WorkflowSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class WorkflowSettingsService {

    private static final String SETTINGS_ID = "global";

    private final WorkflowSettingsRepository workflowSettingsRepository;

    public WorkflowSettings getSettings() {

        return workflowSettingsRepository
                .findById(SETTINGS_ID)
                .orElseGet(() -> {

                    WorkflowSettings settings =
                            WorkflowSettings.builder()
                                    .id(SETTINGS_ID)
                                    .maxResubmissions(3)
                                    .updatedAt(Instant.now())
                                    .build();

                    return workflowSettingsRepository.save(settings);
                });
    }

    public WorkflowSettings updateMaxResubmissions(
            int maxResubmissions,
            String updatedBy
    ) {

        if (maxResubmissions < 0) {
            throw new IllegalArgumentException(
                    "Maximum resubmissions cannot be negative"
            );
        }

        WorkflowSettings settings = getSettings();

        settings.setMaxResubmissions(maxResubmissions);
        settings.setUpdatedBy(updatedBy);
        settings.setUpdatedAt(Instant.now());

        return workflowSettingsRepository.save(settings);
    }
}