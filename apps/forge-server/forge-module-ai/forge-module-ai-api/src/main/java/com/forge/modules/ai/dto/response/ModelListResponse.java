package com.forge.modules.ai.dto.response;

import lombok.Data;
import java.util.List;

/**
 * 模型列表响应
 */
@Data
public class ModelListResponse {
    private List<ModelConfigResponse> models;

    /**
     * 模型配置响应（内部类）
     */
    @Data
    public static class ModelConfigResponse {
        private Long id;
        private String modelName;
        private String displayName;
        private String provider;
        private String description;
        private Integer contextLength;
        private Double maxTemperature;
        private Boolean supportsVision;
        private Boolean supportsFunctionCall;
        private Double pricingInput;
        private Double pricingOutput;
        private Integer status;  // 0-禁用 1-启用
    }
}