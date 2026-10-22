
package com.manasbhat.documentworkflowplatform.security;

import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import com.manasbhat.documentworkflowplatform.security.UserPrincipal;
import com.manasbhat.documentworkflowplatform.service.ConversationService;
import org.springframework.security.core.Authentication;

import java.security.Principal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;
    private final ConversationService conversationService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(
                        message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            String authHeader =
                    accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new AccessDeniedException(
                        "Missing WebSocket authentication token");
            }

            String token = authHeader.substring(7);

            try {
                String email = jwtService.extractUsername(token);

                UserDetails userDetails =
                        userDetailsService.loadUserByUsername(email);

                if (!userDetails.isEnabled()
                        || !jwtService.isTokenValid(token, userDetails)) {
                    throw new AccessDeniedException(
                            "Invalid or disabled user session");
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities());

                accessor.setUser(authentication);

            } catch (JwtException | IllegalArgumentException ex) {
                throw new AccessDeniedException(
                        "Invalid or expired WebSocket token");
            }
        }


        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {

            String destination = accessor.getDestination();

            if (destination == null) {
                throw new AccessDeniedException(
                        "Subscription destination is required");
            }

            Pattern pattern = Pattern.compile(
                    "^/topic/conversations/([^/]+)$");

            Matcher matcher = pattern.matcher(destination);

            if (!matcher.matches()) {
                throw new AccessDeniedException(
                        "Subscription destination is not allowed");
            }

            Principal connectedUser = accessor.getUser();

            if (!(connectedUser instanceof Authentication authentication)
                    || !(authentication.getPrincipal()
                    instanceof UserPrincipal userPrincipal)) {
                throw new AccessDeniedException(
                        "Authentication required");
            }

            String conversationId = matcher.group(1);

            conversationService.authorizeWebSocketConversation(
                    conversationId,
                    userPrincipal);
        }



        if (StompCommand.SEND.equals(accessor.getCommand())) {

            String destination = accessor.getDestination();

            if (destination == null
                    || !destination.matches("/app/chat/[^/]+")) {
                throw new AccessDeniedException(
                        "WebSocket publishing destination is not allowed");
            }

            Principal connectedUser = accessor.getUser();

            if (!(connectedUser instanceof Authentication authentication)
                    || !(authentication.getPrincipal()
                    instanceof UserPrincipal)) {
                throw new AccessDeniedException(
                        "Authentication required");
            }
        }


        return message;
    }
}
