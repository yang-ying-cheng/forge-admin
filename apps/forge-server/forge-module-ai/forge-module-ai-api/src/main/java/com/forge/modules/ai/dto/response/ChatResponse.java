package com.forge.modules.ai.dto.response;

import lombok.Data;

/**
 * AI对话响应
 */
@Data
public class ChatResponse {
    /**
     * 对话ID
     */
    private Long conversationId;

    /**
     * 消息ID
     */
    private Long messageId;

    /**
     * AI回复内容
     */
    private String content;

    /**
     * 模型名称
     */
    private String modelName;

    /**
     * 输入token数
     */
    private Integer inputTokens;

    /**
     * 输出token数
     */
    private Integer outputTokens;

    /**
     * 响应时间（毫秒）
     */
    private Long responseTime;

    /**
     * 是否成功
     */
    private Boolean success;

    /**
     * 错误信息
     */
    private String errorMessage;
}