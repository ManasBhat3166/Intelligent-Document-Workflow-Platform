package com.manasbhat.documentworkflowplatform;

import com.manasbhat.documentworkflowplatform.entity.Role;
import com.manasbhat.documentworkflowplatform.entity.User;
import com.manasbhat.documentworkflowplatform.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    public DataSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@test.com")) {
            User testUser = User.builder()
                    .email("admin@test.com")
                    .password("temporary-plaintext-placeholder")
                    .fullName("Test Admin")
                    .role(Role.ADMIN)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            userRepository.save(testUser);
            System.out.println("✅ Seeded test user: " + testUser.getEmail());
        } else {
            System.out.println("ℹ️ Test user already exists, skipping seed.");
        }
    }
}