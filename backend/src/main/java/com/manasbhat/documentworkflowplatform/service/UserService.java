package com.manasbhat.documentworkflowplatform.service;

import com.manasbhat.documentworkflowplatform.dto.UpdateUserRequest;
import com.manasbhat.documentworkflowplatform.dto.UserResponse;
import com.manasbhat.documentworkflowplatform.entity.User;
import com.manasbhat.documentworkflowplatform.repository.UserRepository;
import com.manasbhat.documentworkflowplatform.dto.ColleagueResponse;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.manasbhat.documentworkflowplatform.entity.Role;
import org.springframework.security.access.AccessDeniedException;
import com.manasbhat.documentworkflowplatform.dto.ChangePasswordRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        return toResponse(user);
    }

    public UserResponse updateUser(
            String id,
            UpdateUserRequest request
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found: " + id)
                );

        boolean removingAdmin =
                user.getRole() == Role.ADMIN
                        && user.isEnabled()
                        && (
                        (request.getRole() != null
                                && request.getRole() != Role.ADMIN)
                                || Boolean.FALSE.equals(request.getEnabled())
                );

        if (removingAdmin) {
            preventRemovingLastActiveAdmin(user);
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }

        user.setUpdatedAt(Instant.now());

        userRepository.save(user);

        return toResponse(user);
    }

    public void deleteUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found: " + id)
                );

        preventRemovingLastActiveAdmin(user);

        user.setEnabled(false);
        user.setUpdatedAt(Instant.now());

        userRepository.save(user);
    }

    public UserResponse getMyProfile(UserPrincipal principal) {
        String userId = principal.getUser().getId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return toResponse(user);
    }

    public UserResponse updateMyProfile(
            UserPrincipal principal,
            UpdateUserRequest request
    ) {
        String userId = principal.getUser().getId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new IllegalArgumentException("Full name cannot be empty");
        }

        user.setFullName(request.getFullName().trim());
        user.setUpdatedAt(Instant.now());

        userRepository.save(user);

        return toResponse(user);
    }


    public void changeMyPassword(
            UserPrincipal principal,
            ChangePasswordRequest request
    ) {
        String userId = principal.getUser().getId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (passwordEncoder.matches(
                request.getNewPassword(),
                user.getPassword())) {
            throw new IllegalArgumentException(
                    "New password must differ from the current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(Instant.now());

        userRepository.save(user);
    }


    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private void preventRemovingLastActiveAdmin(User user) {
        if (user.getRole() == Role.ADMIN
                && user.isEnabled()
                && userRepository.countByRoleAndEnabledTrue(Role.ADMIN) <= 1) {
            throw new IllegalStateException(
                    "Cannot remove or disable the last active Admin account."
            );
        }
    }

    public List<ColleagueResponse> searchColleagues(
            String search,
            UserPrincipal principal) {

        if (search == null || search.isBlank()) {
            return List.of();
        }

        String currentUserId = principal.getUser().getId();

        return userRepository.searchEnabledUsers(search.trim())
                .stream()
                .filter(user -> !user.getId().equals(currentUserId))
                .limit(20)
                .map(user -> ColleagueResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .toList();
    }
}