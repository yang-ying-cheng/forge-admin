package com.forge.modules.ai.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 文档响应
 */
@Data
public class DocumentResponse {
    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String fileUrl;
    private String content;      // 新增：文档内容
    private String summary;
    private String modelName;
    private Integer status;  // 0-处理中 1-已完成 2-失败
    private String errorMessage;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}