package com.forge.modules.ai.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.forge.modules.ai.dto.request.ChatRequest;
import com.forge.modules.ai.dto.request.DocumentSummaryRequest;
import com.forge.modules.ai.dto.response.ChatResponse;
import com.forge.modules.ai.dto.response.DocumentResponse;
import com.forge.modules.ai.dto.response.ModelListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Python AI服务客户端实现
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PythonAiClientImpl implements PythonAiClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.python-service.url:http://localhost:8000}")
    private String serviceUrl;

    @Value("${ai.python-service.timeout:30000}")
    private int timeout;

    @Override
    public ChatResponse chat(ChatRequest request) {
        String url = serviceUrl + "/api/v1/chat";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<ChatRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<ChatResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, ChatResponse.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("调用Python AI服务chat接口失败: {}", e.getMessage());
            ChatResponse errorResponse = new ChatResponse();
            errorResponse.setSuccess(false);
            errorResponse.setErrorMessage(e.getMessage());
            return errorResponse;
        }
    }

    @Override
    public String chatStream(ChatRequest request) {
        String url = serviceUrl + "/api/v1/chat/stream";
        try {
            request.setStream(true);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<ChatRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, String.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("调用Python AI服务chat/stream接口失败: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public DocumentResponse summarize(DocumentSummaryRequest request) {
        String url = serviceUrl + "/api/v1/document/summarize";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<DocumentSummaryRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<DocumentResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, DocumentResponse.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("调用Python AI服务summarize接口失败: {}", e.getMessage());
            DocumentResponse errorResponse = new DocumentResponse();
            errorResponse.setStatus(2);
            errorResponse.setErrorMessage(e.getMessage());
            return errorResponse;
        }
    }

    @Override
    public DocumentResponse parseDocument(Long documentId, String filePath) {
        String url = serviceUrl + "/api/v1/document/parse";
        try {
            Map<String, Object> params = Map.of(
                    "documentId", documentId,
                    "filePath", filePath
            );
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(params, headers);

            ResponseEntity<DocumentResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, DocumentResponse.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("调用Python AI服务parse接口失败: {}", e.getMessage());
            DocumentResponse errorResponse = new DocumentResponse();
            errorResponse.setStatus(2);
            errorResponse.setErrorMessage(e.getMessage());
            return errorResponse;
        }
    }

    @Override
    public ModelListResponse getAvailableModels() {
        String url = serviceUrl + "/api/v1/models";
        try {
            ResponseEntity<ModelListResponse> response = restTemplate.getForEntity(
                    url, ModelListResponse.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("调用Python AI服务models接口失败: {}", e.getMessage());
            return new ModelListResponse();
        }
    }

    @Override
    public Map<String, Object> healthCheck() {
        String url = serviceUrl + "/health";
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return objectMapper.readValue(response.getBody(), new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.error("调用Python AI服务health接口失败: {}", e.getMessage());
            return Map.of("status", "error", "message", e.getMessage());
        }
    }
}