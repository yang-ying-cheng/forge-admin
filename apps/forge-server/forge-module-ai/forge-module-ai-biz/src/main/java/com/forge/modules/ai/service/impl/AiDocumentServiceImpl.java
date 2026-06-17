package com.forge.modules.ai.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.forge.framework.security.utils.SecurityHelper;
import com.forge.modules.ai.client.PythonAiClient;
import com.forge.modules.ai.dto.request.DocumentQueryRequest;
import com.forge.modules.ai.dto.request.DocumentSummaryRequest;
import com.forge.modules.system.dto.attachment.AttachmentResponse;
import com.forge.modules.ai.dto.response.DocumentResponse;
import com.forge.modules.ai.entity.AiDocument;
import com.forge.modules.ai.entity.AiModelConfig;
import com.forge.modules.ai.mapper.AiDocumentMapper;
import com.forge.modules.ai.service.AiDocumentService;
import com.forge.modules.ai.service.AiModelService;
import com.forge.modules.system.entity.SysAttachment;
import com.forge.modules.system.service.SysAttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

/**
 * AI文档服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiDocumentServiceImpl implements AiDocumentService {

    private final PythonAiClient pythonAiClient;
    private final AiDocumentMapper documentMapper;
    private final SysAttachmentService attachmentService;
    private final AiModelService modelService;

    @Override
    public IPage<DocumentResponse> pageDocument(DocumentQueryRequest request) {
        Page<AiDocument> page = new Page<>(request.getPageNum(), request.getPageSize());
        LambdaQueryWrapper<AiDocument> wrapper = new LambdaQueryWrapper<>();

        if (request.getFileName() != null && !request.getFileName().isEmpty()) {
            wrapper.like(AiDocument::getFileName, request.getFileName());
        }

        if (request.getStatus() != null) {
            wrapper.eq(AiDocument::getStatus, request.getStatus());
        }

        Long queryUserId = request.getUserId();
        if (queryUserId == null && !SecurityHelper.isAdmin()) {
            queryUserId = SecurityHelper.getCurrentUserId();
        }
        if (queryUserId != null) {
            wrapper.eq(AiDocument::getUserId, queryUserId);
        }

        wrapper.orderByDesc(AiDocument::getCreateTime);

        Page<AiDocument> result = documentMapper.selectPage(page, wrapper);
        return result.convert(doc -> {
            SysAttachment attachment = doc.getAttachmentId() != null
                ? attachmentService.getById(doc.getAttachmentId()) : null;
            return toDocumentResponse(doc, attachment);
        });
    }

    @Override
    @Transactional
    public DocumentResponse parseDocument(Long documentId, String filePath) {
        AiDocument document = null;
        if (documentId != null) {
            document = documentMapper.selectById(documentId);
            if (document != null) {
                document.setStatus(0);
                documentMapper.updateById(document);
            }
        }

        DocumentResponse response = pythonAiClient.parseDocument(documentId, filePath);

        if (document != null && response != null) {
            document.setStatus(response.getStatus() == 1 ? 1 : 2);
            document.setContent(response.getContent());
            document.setSummary(response.getSummary());
            document.setModelName(response.getModelName());
            documentMapper.updateById(document);
        }

        SysAttachment attachment = document != null && document.getAttachmentId() != null
            ? attachmentService.getById(document.getAttachmentId()) : null;
        return document != null ? toDocumentResponse(document, attachment) : response;
    }

    @Override
    @Transactional
    public DocumentResponse parseDocumentFile(Long documentId, MultipartFile file) {
        AiDocument document = null;

        if (documentId == null) {
            AttachmentResponse attachment = attachmentService.upload(file, "ai_document", null);

            document = new AiDocument();
            document.setUserId(SecurityHelper.getCurrentUserId());
            document.setAttachmentId(attachment.getId());
            document.setFileName(attachment.getOriginalName());
            document.setStatus(0);
            documentMapper.insert(document);
            documentId = document.getId();

            DocumentResponse response = pythonAiClient.parseDocument(documentId, attachment.getFilePath());

            document.setStatus(response.getStatus() != null && response.getStatus() == 1 ? 1 : 2);
            document.setContent(response.getContent());
            if (response.getErrorMessage() != null) {
                document.setErrorMessage(response.getErrorMessage());
            }
            documentMapper.updateById(document);
        } else {
            document = documentMapper.selectById(documentId);
            if (document != null) {
                document.setStatus(0);
                documentMapper.updateById(document);
            }
        }

        SysAttachment attachment = document != null && document.getAttachmentId() != null
            ? attachmentService.getById(document.getAttachmentId()) : null;
        return document != null ? toDocumentResponse(document, attachment) : null;
    }

    @Override
    @Transactional
    public DocumentResponse generateSummary(Long documentId) {
        AiDocument document = documentMapper.selectById(documentId);
        if (document == null) {
            throw new RuntimeException("文档不存在");
        }
        if (document.getContent() == null || document.getContent().isEmpty()) {
            throw new RuntimeException("文档内容为空，无法生成摘要");
        }

        AiModelConfig defaultModel = modelService.getDefaultModel();
        if (defaultModel == null) {
            throw new RuntimeException("请先配置默认AI模型");
        }

        DocumentSummaryRequest request = new DocumentSummaryRequest();
        request.setDocumentId(documentId);
        request.setText(document.getContent());  // 传递文档内容
        request.setProvider(defaultModel.getProvider());  // 直接使用 provider 字段
        request.setModelName(defaultModel.getModelCode());
        request.setStyle("brief");
        request.setMaxLength(500);

        DocumentResponse response = pythonAiClient.summarize(request);

        if (response != null && response.getStatus() != null && response.getStatus() == 1) {
            document.setSummary(response.getSummary());
            document.setModelName(defaultModel.getModelCode());
            documentMapper.updateById(document);
        }

        SysAttachment attachment = document.getAttachmentId() != null
            ? attachmentService.getById(document.getAttachmentId()) : null;
        return toDocumentResponse(document, attachment);
    }

    @Override
    @Transactional
    public DocumentResponse summarize(DocumentSummaryRequest request) {
        DocumentResponse response = pythonAiClient.summarize(request);

        if (response != null && response.getStatus() != null && response.getStatus() == 1) {
            AiDocument document = documentMapper.selectById(request.getDocumentId());
            if (document != null) {
                document.setSummary(response.getSummary());
                document.setModelName(request.getModelName());
                documentMapper.updateById(document);
            }
        }

        return response;
    }

    @Override
    public List<DocumentResponse> getDocumentList() {
        LambdaQueryWrapper<AiDocument> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(AiDocument::getCreateTime);
        List<AiDocument> documents = documentMapper.selectList(wrapper);
        return documents.stream()
            .map(doc -> {
                SysAttachment attachment = doc.getAttachmentId() != null
                    ? attachmentService.getById(doc.getAttachmentId()) : null;
                return toDocumentResponse(doc, attachment);
            })
            .collect(Collectors.toList());
    }

    @Override
    public DocumentResponse getDocument(Long documentId) {
        AiDocument document = documentMapper.selectById(documentId);
        if (document == null) return null;

        SysAttachment attachment = null;
        if (document.getAttachmentId() != null) {
            attachment = attachmentService.getById(document.getAttachmentId());
        }
        return toDocumentResponse(document, attachment);
    }

    @Override
    @Transactional
    public void deleteDocument(Long documentId) {
        AiDocument document = documentMapper.selectById(documentId);
        if (document != null) {
            if (document.getAttachmentId() != null) {
                attachmentService.deleteAttachments(List.of(document.getAttachmentId()));
            }
            documentMapper.deleteById(documentId);
        }
    }

    private DocumentResponse toDocumentResponse(AiDocument document, SysAttachment attachment) {
        DocumentResponse response = new DocumentResponse();
        response.setId(document.getId());
        response.setFileName(document.getFileName());
        if (attachment != null) {
            response.setFileType(attachment.getFileExtension());
            response.setFileSize(attachment.getFileSize());
            response.setFileUrl(attachment.getFileUrl());
        }
        response.setContent(document.getContent());
        response.setSummary(document.getSummary());
        response.setModelName(document.getModelName());
        response.setStatus(document.getStatus());
        response.setErrorMessage(document.getErrorMessage());
        response.setCreateTime(document.getCreateTime());
        response.setUpdateTime(document.getUpdateTime());
        return response;
    }
}