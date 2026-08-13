package com.manasbhat.documentworkflowplatform.controller;

import com.manasbhat.documentworkflowplatform.dto.AuthResponse;
import com.manasbhat.documentworkflowplatform.dto.LoginRequest;
import com.manasbhat.documentworkflowplatform.dto.RegisterRequest;
import com.manasbhat.documentworkflowplatform.entity.User;
import com.manasbhat.documentworkflowplatform.repository.UserRepository;
import com.manasbhat.documentworkflowplatform.security.JwtService;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(request.getRole())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        userRepository.save(user);

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);

        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getRole().name()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);

        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getRole().name()));
    }
}