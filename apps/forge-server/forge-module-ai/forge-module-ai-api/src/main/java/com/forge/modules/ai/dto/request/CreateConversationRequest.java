package com.forge.modules.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建对话请求
 */
@Data
public class CreateConversationRequest {
    /**
     * 对话标题
     */
    @NotBlank(message = "对话标题不能为空")
    private String title;

    /**
     * 模型名称
     */
    @NotBlank(message = "模型名称不能为空")
    private String modelName;

    /**
     * 对话类型（chat/summary/qa）
     */
    private String type = "chat";

    /**
     * 关联的文档ID（可选）
     */
    private Long documentId;
}