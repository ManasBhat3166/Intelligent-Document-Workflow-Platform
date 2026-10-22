
package com.manasbhat.documentworkflowplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateDirectConversationRequest {

    private String recipientUserId;
}
