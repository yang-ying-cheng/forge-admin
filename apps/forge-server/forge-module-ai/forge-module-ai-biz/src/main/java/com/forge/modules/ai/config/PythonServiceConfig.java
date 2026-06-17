package com.forge.modules.ai.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Python服务配置类
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class PythonServiceConfig {

    private final AiModuleConfig aiModuleConfig;

    /**
     * 创建Python服务WebClient
     */
    @Bean("pythonServiceWebClient")
    public WebClient pythonServiceWebClient() {
        AiModuleConfig.PythonService pythonService = aiModuleConfig.getPythonService();

        log.info("初始化Python服务WebClient, baseUrl: {}", pythonService.getBaseUrl());

        return WebClient.builder()
                .baseUrl(pythonService.getBaseUrl())
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
    }

    /**
     * 创建RestTemplate用于调用Python服务
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}