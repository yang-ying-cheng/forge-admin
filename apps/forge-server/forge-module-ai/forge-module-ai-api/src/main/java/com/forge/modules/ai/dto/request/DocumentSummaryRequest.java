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
     * 文档ID
     */
    @NotNull(message = "文档ID不能为空")
    private Long documentId;

    /**
     * 模型名称
     */
    @NotBlank(message = "模型名称不能为空")
    private String modelName;

    /**
     * 摘要类型（brief/detailed/key_points）
     */
    private String summaryType = "brief";

    /**
     * 最大输出token数
     */
    private Integer maxTokens = 500;
}