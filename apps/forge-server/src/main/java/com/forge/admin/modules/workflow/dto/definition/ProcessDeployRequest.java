package com.forge.admin.modules.workflow.dto.definition;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 流程部署请求
 *
 * @author forge-admin
 */
@Data
public class ProcessDeployRequest {

    /**
     * 流程名称
     */
    @NotBlank(message = "流程名称不能为空")
    private String name;

    /**
     * 流程Key
     */
    @NotBlank(message = "流程Key不能为空")
    private String key;

    /**
     * 分类ID
     */
    private Long categoryId;

    /**
     * 描述
     */
    private String description;

    /**
     * BPMN XML内容
     */
    @NotBlank(message = "BPMN XML内容不能为空")
    private String bpmnXml;
}
