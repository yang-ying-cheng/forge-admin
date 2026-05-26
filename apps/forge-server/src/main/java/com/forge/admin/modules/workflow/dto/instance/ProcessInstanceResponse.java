package com.forge.admin.modules.workflow.dto.instance;

import lombok.Data;

import java.util.Date;

/**
 * 流程实例响应
 *
 * @author forge-admin
 */
@Data
public class ProcessInstanceResponse {

    /**
     * 流程实例ID
     */
    private String id;

    /**
     * 流程定义ID
     */
    private String processDefinitionId;

    /**
     * 流程定义名称
     */
    private String processDefinitionName;

    /**
     * 流程定义Key
     */
    private String processDefinitionKey;

    /**
     * 业务Key
     */
    private String businessKey;

    /**
     * 开始时间
     */
    private Date startTime;

    /**
     * 结束时间
     */
    private Date endTime;

    /**
     * 耗时（毫秒）
     */
    private Long durationInMillis;

    /**
     * 发起人ID
     */
    private String startUserId;

    /**
     * 发起人名称
     */
    private String startUserName;

    /**
     * 当前节点名称
     */
    private String currentActivityName;

    /**
     * 挂起状态（1激活 2挂起）
     */
    private Integer suspensionState;

    /**
     * 删除原因
     */
    private String deleteReason;
}
