package com.forge.modules.ai.dto.request;

import lombok.Data;

/**
 * 文档查询请求
 */
@Data
public class DocumentQueryRequest {

    private Long pageNum = 1L;
    private Long pageSize = 10L;
    private String fileName;
    private String fileType;
    private Integer status;
    private Long userId;

    /** 数据权限SQL片段（由切面自动填充） */
    private String dataScope;
}