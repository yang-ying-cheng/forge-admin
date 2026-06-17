package com.forge.modules.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 文档摘要请求
 */
@Data
public class DocumentSummaryRequest {
    /**
     * 文档ID（可选，用于回写摘要）
     */
    private Long documentId;

    /**
     * 文档内容（必填，用于生成摘要）
     */
    @NotBlank(message = "文档内容不能为空")
    private String text;

    /**
     * 提供商（如 qwen、deepseek、glm）
     */
    private String provider;

    /**
     * 模型名称
     */
    private String modelName;

    /**
     * 摘要类型（brief/detailed/bullet）
     */
    private String style = "brief";

    /**
     * 最大输出长度
     */
    private Integer maxLength = 500;
}