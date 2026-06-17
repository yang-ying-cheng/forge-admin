package com.forge.modules.ai.controller.admin;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.forge.common.response.PageResult;
import com.forge.common.response.Result;
import com.forge.framework.web.annotation.OperationLog;
import com.forge.modules.ai.dto.request.DocumentQueryRequest;
import com.forge.modules.ai.dto.response.DocumentResponse;
import com.forge.modules.ai.service.AiDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * AI文档控制器
 */
@Slf4j
@Tag(name = "AI文档管理")
@RestController
@RequestMapping("/ai/document")
@RequiredArgsConstructor
public class AiDocumentController {

    private final AiDocumentService aiDocumentService;

    @Operation(summary = "上传文档")
    @PostMapping("/upload")
    @PreAuthorize("hasAuthority('ai:document:upload')")
    @OperationLog(title = "AI文档管理", businessType = OperationLog.BusinessType.INSERT)
    public Result<DocumentResponse> uploadDocument(@RequestParam("file") MultipartFile file) {
        // 上传并解析文档（通过文件上传方式）
        DocumentResponse response = aiDocumentService.parseDocumentFile(null, file);
        return Result.success(response);
    }

    @Operation(summary = "分页查询文档列表")
    @GetMapping("/list")
    @PreAuthorize("hasAuthority('ai:document:query')")
    public Result<PageResult<DocumentResponse>> getDocumentList(DocumentQueryRequest request) {
        IPage<DocumentResponse> page = aiDocumentService.pageDocument(request);
        return Result.success(PageResult.of(page.getRecords(), page.getTotal(), page.getCurrent(), page.getSize()));
    }

    @Operation(summary = "获取文档详情")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ai:document:query')")
    public Result<DocumentResponse> getDocument(@PathVariable Long id) {
        DocumentResponse response = aiDocumentService.getDocument(id);
        return Result.success(response);
    }

    @Operation(summary = "生成文档摘要")
    @GetMapping("/{id}/summary")
    @PreAuthorize("hasAuthority('ai:document:analyze')")
    @OperationLog(title = "AI文档管理", businessType = OperationLog.BusinessType.OTHER)
    public Result<DocumentResponse> summarizeDocument(@PathVariable Long id) {
        DocumentResponse response = aiDocumentService.generateSummary(id);
        return Result.success(response);
    }

    @Operation(summary = "删除文档")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ai:document:delete')")
    @OperationLog(title = "AI文档管理", businessType = OperationLog.BusinessType.DELETE)
    public Result<Void> deleteDocument(@PathVariable Long id) {
        aiDocumentService.deleteDocument(id);
        return Result.success();
    }
}