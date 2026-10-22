package com.manasbhat.documentworkflowplatform.dto;

import com.manasbhat.documentworkflowplatform.entity.Role;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String fullName;
    private Role role;
    private Boolean enabled;
}