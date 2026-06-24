package com.forge.modules.workflow.framework.candidate;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 候选人策略枚举
 *
 * @author forge-admin
 */
@Getter
@AllArgsConstructor
public enum CandidateStrategyEnum {

    ROLE(10, "指定角色"),
    DEPT_MEMBER(20, "部门成员"),
    DEPT_LEADER(21, "部门负责人"),
    POST(22, "指定岗位"),
    USER(30, "指定用户"),
    APPROVE_USER_SELECT(34, "审批人自选"),
    START_USER_SELECT(35, "发起人自选"),
    START_USER(36, "发起人自己"),
    START_USER_DEPT_LEADER(37, "发起人部门负责人"),
    DEPT_LEADER_MULTI(38, "连续多级部门负责人"),
    EXPRESSION(60, "表达式");

    private final int code;
    private final String description;

    public static CandidateStrategyEnum getByCode(int code) {
        for (CandidateStrategyEnum strategy : values()) {
            if (strategy.getCode() == code) {
                return strategy;
            }
        }
        return null;
    }

    public static boolean isValidCode(int code) {
        return getByCode(code) != null;
    }

    /**
     * 从 NodeSetType 转换为候选人策略
     *
     * NodeSetType 与候选人策略映射关系：
     * - specifyMembers(1) -> USER(30) 指定成员
     * - supervisor(2) -> START_USER_DEPT_LEADER(37) 部门负责人
     * - role(3) -> ROLE(10) 角色
     * - initiatorSelected(4) -> START_USER_SELECT(35) 发起人自选
     * - initiatorThemselves(5) -> START_USER(36) 发起人自己
     * - 审批人自选(6) -> APPROVE_USER_SELECT(34)
     * - 连续多级部门负责人(7) -> DEPT_LEADER_MULTI(38)
     * - 表达式(8) -> EXPRESSION(60)
     *
     * @param setType NodeSetType 值
     * @return 候选人策略枚举，无匹配返回 null
     */
    public static CandidateStrategyEnum fromSetType(Integer setType) {
        if (setType == null) {
            return null;
        }
        switch (setType) {
            case 1: return USER; // 指定成员
            case 2: return START_USER_DEPT_LEADER; // 部门负责人
            case 3: return ROLE; // 角色
            case 4: return START_USER_SELECT; // 发起人自选
            case 5: return START_USER; // 发起人自己
            case 6: return APPROVE_USER_SELECT; // 审批人自选
            case 7: return DEPT_LEADER_MULTI; // 连续多级部门负责人
            case 8: return EXPRESSION; // 表达式
            default: return null;
        }
    }
}
