package com.forge.modules.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

/**
 * AI对话请求
 */
@Data
public class ChatRequest {
    /**
     * 对话ID（可选，不传则创建新对话）
     */
    private Long conversationId;

    /**
     * 模型名称
     */
    @NotBlank(message = "模型名称不能为空")
    private String modelName;

    /**
     * 用户消息内容
     */
    @NotBlank(message = "消息内容不能为空")
    private String content;

    /**
     * 是否流式响应
     */
    private Boolean stream = false;

    /**
     * 温度参数（0-2）
     */
    private Double temperature;

    /**
     * 最大输出token数
     */
    private Integer maxTokens;

    /**
     * 关联的文档ID列表（可选）
     */
    private List<Long> documentIds;
}