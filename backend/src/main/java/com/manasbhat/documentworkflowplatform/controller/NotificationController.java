package com.manasbhat.documentworkflowplatform.controller;

import com.manasbhat.documentworkflowplatform.dto.NotificationResponse;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import com.manasbhat.documentworkflowplatform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserPrincipal user
    ) {
        return ResponseEntity.ok(
                notificationService.getNotifications(
                        user.getUser().getId()
                )
        );
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal user
    ) {
        return ResponseEntity.ok(
                notificationService.getUnreadCount(
                        user.getUser().getId()
                )
        );
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        notificationService.markAsRead(
                id,
                user.getUser().getId()
        );

        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal user
    ) {
        notificationService.markAllAsRead(
                user.getUser().getId()
        );

        return ResponseEntity.ok().build();
    }
}