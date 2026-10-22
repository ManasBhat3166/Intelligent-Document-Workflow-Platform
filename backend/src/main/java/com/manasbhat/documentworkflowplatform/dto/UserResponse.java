package com.manasbhat.documentworkflowplatform.dto;

import com.manasbhat.documentworkflowplatform.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String email;
    private String fullName;
    private Role role;
    private boolean enabled;
    private Instant createdAt;
}