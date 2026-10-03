package com.manasbhat.documentworkflowplatform.dto;

import lombok.Data;

@Data
public class SearchRequest {
    private String query;
    private int limit = 5;
}