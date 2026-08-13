package com.manasbhat.documentworkflowplatform.dto;

import com.manasbhat.documentworkflowplatform.entity.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String fullName;
    private Role role;
}