# AI 前端页面实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 AI 模块的三个前端页面：智能对话、文档管理、模型配置

**Architecture:** Vue 3 + TypeScript + Element Plus + SSE 流式响应，遵循 forge-web 现有架构模式

**Tech Stack:** Vue 3.4, TypeScript, Element Plus, Axios, SSE API, vxe-table

**Depends on:** Plan 3（Java API 已实现）

---

## Task 1: API 接口定义

**Files:**
- Create: `apps/forge-web/src/api/ai/chat.ts`
- Create: `apps/forge-web/src/api/ai/document.ts`
- Create: `apps/forge-web/src/api/ai/model.ts`

- [ ] **Step 1: 创建对话 API**

```typescript
// apps/forge-web/src/api/ai/chat.ts
import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

// 会话响应
export interface ConversationResponse {
  id: number
  userId: number
  title: string
  modelProvider: string
  modelName: string
  systemPrompt: string
  status: number
  createTime: string
  updateTime: string
}

// 消息响应
export interface MessageResponse {
  id: number
  conversationId: number
  role: string
  content: string
  tokensUsed: number
  modelProvider: string
  responseTime: number
  createTime: string
}

// 创建会话请求
export interface CreateConversationRequest {
  title?: string
  modelProvider?: string
  modelName?: string
  systemPrompt?: string
}

// 发送消息请求
export interface SendMessageRequest {
  conversationId: number
  content: string
}

// 对话 API
export const chatApi = {
  // 创建会话
  create: (data: CreateConversationRequest) =>
    request.post<ConversationResponse>('/ai/chat/conversations', data),

  // 会话列表
  list: () =>
    request.get<ConversationResponse[]>('/ai/chat/conversations'),

  // 删除会话
  delete: (id: number) =>
    request.delete(`/ai/chat/conversations/${id}`),

  // 消息历史
  messages: (conversationId: number) =>
    request.get<MessageResponse[]>(`/ai/chat/conversations/${conversationId}/messages`),

  // 发送消息（SSE 流式）
  send: (data: SendMessageRequest) =>
    request.post('/ai/chat/send', data)
}
```

- [ ] **Step 2: 创建文档 API**

```typescript
// apps/forge-web/src/api/ai/document.ts
import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

// 文档响应
export interface DocumentResponse {
  id: number
  userId: number
  fileName: string
  filePath: string
  fileType: string
  fileSize: number
  content: string
  summary: string
  status: number
  errorMessage: string
  modelProvider: string
  createTime: string
  updateTime: string
}

// 文档查询参数
export interface DocumentQuery {
  pageNum: number
  pageSize: number
  fileName?: string
  fileType?: string
  status?: number
}

// 文档 API
export const documentApi = {
  // 上传文档
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<DocumentResponse>('/ai/document/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 文档列表
  list: (params: DocumentQuery) =>
    request.get<PageResult<DocumentResponse>>('/ai/document/list', { params }),

  // 文档详情
  get: (id: number) =>
    request.get<DocumentResponse>(`/ai/document/${id}`),

  // 生成摘要
  summary: (id: number) =>
    request.post<DocumentResponse>(`/ai/document/${id}/summary`),

  // 删除文档
  delete: (id: number) =>
    request.delete(`/ai/document/${id}`)
}
```

- [ ] **Step 3: 创建模型 API**

```typescript
// apps/forge-web/src/api/ai/model.ts
import request from '@/utils/request'

// 模型配置响应
export interface ModelConfigResponse {
  id: number
  provider: string
  modelName: string
  apiKey: string
  apiUrl: string
  maxTokens: number
  temperature: number
  isEnabled: number
  isDefault: number
  sortOrder: number
  remark: string
  createTime: string
  updateTime: string
}

// 模型配置请求
export interface ModelConfigRequest {
  apiKey: string
  apiUrl?: string
  maxTokens?: number
  temperature?: number
  isEnabled?: number
  remark?: string
}

// 模型 API
export const modelApi = {
  // 可用模型列表
  list: () =>
    request.get<ModelConfigResponse[]>('/ai/model/list'),

  // 配置模型
  config: (id: number, data: ModelConfigRequest) =>
    request.put<ModelConfigResponse>(`/ai/model/${id}/config`, data),

  // 切换默认模型
  switch: (id: number) =>
    request.post<ModelConfigResponse>(`/ai/model/${id}/switch`)
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/forge-web/src/api/ai/
git commit -m "feat(ai): 添加 AI 模块前端 API 接口定义"
```

---

## Task 2: SSE 流式响应工具

**Files:**
- Create: `apps/forge-web/src/utils/sse.ts`

- [ ] **Step 1: 创建 SSE 客户端工具**

```typescript
// apps/forge-web/src/utils/sse.ts
/**
 * SSE (Server-Sent Events) 流式响应客户端
 */

export interface SSEOptions {
  url: string
  data?: Record<string, any>
  onMessage?: (text: string) => void
  onError?: (error: Error) => void
  onComplete?: () => void
}

export class SSEClient {
  private eventSource: EventSource | null = null
  private aborted = false

  /**
   * 发送 POST 请求并接收 SSE 流式响应
   * Spring Boot SSE 端点通过 POST 请求参数返回流
   */
  connect(options: SSEOptions): void {
    this.aborted = false

    // 构建 URL（POST 参数通过 query string 传递给 SSE 端点）
    const queryString = options.data
      ? Object.entries(options.data)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&')
      : ''

    const url = queryString ? `${options.url}?${queryString}` : options.url

    // 使用 EventSource 接收 SSE 流
    // 注意：EventSource 仅支持 GET，但 Spring 可以通过 query 参数处理
    this.eventSource = new EventSource(url)

    this.eventSource.onmessage = (event) => {
      if (this.aborted) return

      const text = event.data
      if (text === '[DONE]') {
        this.close()
        options.onComplete?.()
        return
      }

      options.onMessage?.(text)
    }

    this.eventSource.onerror = (error) => {
      if (this.aborted) return

      this.close()
      options.onError?.(new Error('SSE connection error'))
    }
  }

  /**
   * 发送 POST 请求并接收 SSE 流（通过 fetch API）
   * 支持 POST body 传参
   */
  async connectPost(options: SSEOptions): Promise<void> {
    this.aborted = false

    try {
      const response = await fetch(options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(options.data || {})
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (!this.aborted) {
        const { done, value } = await reader.read()

        if (done) {
          options.onComplete?.()
          break
        }

        const text = decoder.decode(value, { stream: true })
        
        // 解析 SSE 格式: "data: xxx\n\n"
        const lines = text.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              options.onComplete?.()
              this.aborted = true
              break
            }
            options.onMessage?.(data)
          }
        }
      }
    } catch (error) {
      if (!this.aborted) {
        options.onError?.(error as Error)
      }
    }
  }

  /**
   * 关闭 SSE 连接
   */
  close(): void {
    this.aborted = true
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  /**
   * 是否已中止
   */
  isAborted(): boolean {
    return this.aborted
  }
}

/**
 * 创建 SSE 客户端实例
 */
export function createSSE(options: SSEOptions): SSEClient {
  const client = new SSEClient()
  client.connectPost(options)
  return client
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/forge-web/src/utils/sse.ts
git commit -m "feat(utils): 添加 SSE 流式响应客户端工具"
```

---

## Task 3: 模型配置页面

**Files:**
- Create: `apps/forge-web/src/views/ai/model/index.vue`

- [ ] **Step 1: 创建模型配置页面**

```vue
<!-- apps/forge-web/src/views/ai/model/index.vue -->
<template>
  <div class="app-container">
    <el-card shadow="never">
      <vxe-toolbar ref="toolbarRef" custom>
        <template #buttons>
          <el-button type="primary" @click="handleRefresh">刷新状态</el-button>
        </template>
      </vxe-toolbar>
      <vxe-table
        ref="tableRef"
        id="aiModelTable"
        :data="tableData"
        :height="tableHeight"
        :row-config="{ isCurrent: true, isHover: true }"
        show-overflow="tooltip"
      >
        <vxe-column type="seq" title="序号" width="60" :seq-method="seqMethod" />
        <vxe-column field="provider" title="提供商" width="100">
          <template #default="{ row }">
            <el-tag :type="getProviderTagType(row.provider)">{{ getProviderLabel(row.provider) }}</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="modelName" title="模型名称" min-width="150" />
        <vxe-column field="isEnabled" title="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'danger'">
              {{ row.isEnabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </vxe-column>
        <vxe-column field="isDefault" title="默认" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault" type="warning">默认</el-tag>
            <span v-else>-</span>
          </template>
        </vxe-column>
        <vxe-column field="maxTokens" title="最大Token" width="100" />
        <vxe-column field="temperature" title="温度" width="80" />
        <vxe-column field="remark" title="备注" min-width="150" />
        <vxe-column title="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleConfig(row)">配置</el-button>
            <el-button
              v-if="!row.isDefault"
              type="success"
              link
              size="small"
              @click="handleSwitch(row)"
            >
              设为默认
            </el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </el-card>

    <!-- 配置弹窗 -->
    <el-dialog v-model="configDialogVisible" title="模型配置" width="500px">
      <el-form :model="configForm" label-width="100px">
        <el-form-item label="API Key">
          <el-input
            v-model="configForm.apiKey"
            type="password"
            placeholder="请输入 API Key"
            show-password
          />
        </el-form-item>
        <el-form-item label="API 地址">
          <el-input v-model="configForm.apiUrl" placeholder="可选，使用默认地址" />
        </el-form-item>
        <el-form-item label="最大Token">
          <el-input-number v-model="configForm.maxTokens" :min="100" :max="100000" />
        </el-form-item>
        <el-form-item label="温度参数">
          <el-slider v-model="configForm.temperature" :min="0" :max="2" :step="0.1" show-input />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="configForm.isEnabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="configForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTableHeight } from '@/composables/useTableHeight'
import { useTableSeq } from '@/composables/useTableSeq'
import { modelApi, type ModelConfigResponse, type ModelConfigRequest } from '@/api/ai/model'

const { tableHeight } = useTableHeight()
const { seqMethod } = useTableSeq({
  currentPage: computed(() => 1),
  pageSize: computed(() => tableData.value.length)
})

const tableRef = ref()
const toolbarRef = ref()
const tableData = ref<ModelConfigResponse[]>([])
const configDialogVisible = ref(false)
const currentModelId = ref<number>(0)

const configForm = reactive<ModelConfigRequest>({
  apiKey: '',
  apiUrl: '',
  maxTokens: 4096,
  temperature: 0.7,
  isEnabled: 1,
  remark: ''
})

// 提供商映射
const providerMap: Record<string, { label: string; type: string }> = {
  QWEN: { label: '通义千问', type: 'primary' },
  ERNIE: { label: '文心一言', type: 'success' },
  DEEPSEEK: { label: 'DeepSeek', type: 'warning' },
  GLM: { label: '智谱GLM', type: 'info' }
}

function getProviderLabel(provider: string): string {
  return providerMap[provider]?.label || provider
}

function getProviderTagType(provider: string): string {
  return providerMap[provider]?.type || 'info'
}

// 获取模型列表
async function getList() {
  try {
    const res = await modelApi.list()
    tableData.value = res.data || []
  } catch (error) {
    ElMessage.error('获取模型列表失败')
  }
}

// 刷新状态
function handleRefresh() {
  getList()
}

// 打开配置弹窗
function handleConfig(row: ModelConfigResponse) {
  currentModelId.value = row.id
  configForm.apiKey = row.apiKey || ''
  configForm.apiUrl = row.apiUrl || ''
  configForm.maxTokens = row.maxTokens || 4096
  configForm.temperature = row.temperature || 0.7
  configForm.isEnabled = row.isEnabled
  configForm.remark = row.remark || ''
  configDialogVisible.value = true
}

// 保存配置
async function handleSaveConfig() {
  try {
    await modelApi.config(currentModelId.value, {
      ...configForm,
      isEnabled: configForm.isEnabled ? 1 : 0
    })
    ElMessage.success('配置保存成功')
    configDialogVisible.value = false
    getList()
  } catch (error) {
    ElMessage.error('配置保存失败')
  }
}

// 切换默认模型
async function handleSwitch(row: ModelConfigResponse) {
  try {
    await ElMessageBox.confirm(`确定将 ${row.modelName} 设为默认模型？`, '提示', {
      type: 'warning'
    })
    await modelApi.switch(row.id)
    ElMessage.success('切换成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('切换失败')
    }
  }
}

onMounted(() => {
  getList()
  tableRef.value?.connect(toolbarRef.value!)
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 0;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/forge-web/src/views/ai/model/index.vue
git commit -m "feat(ai): 添加模型配置页面"
```

---

## Task 4: 智能对话页面

**Files:**
- Create: `apps/forge-web/src/views/ai/chat/index.vue`

- [ ] **Step 1: 创建智能对话页面**

```vue
<!-- apps/forge-web/src/views/ai/chat/index.vue -->
<template>
  <div class="chat-container">
    <!-- 左侧会话列表 -->
    <div class="conversation-list">
      <div class="header">
        <el-select v-model="currentProvider" placeholder="选择模型" size="small" @change="handleProviderChange">
          <el-option label="DeepSeek" value="DEEPSEEK" />
          <el-option label="通义千问" value="QWEN" />
          <el-option label="文心一言" value="ERNIE" />
          <el-option label="智谱GLM" value="GLM" />
        </el-select>
        <el-button type="primary" size="small" @click="handleNewConversation">
          <el-icon><Plus /></el-icon>
          新会话
        </el-button>
      </div>
      <div class="list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          :class="['item', { active: currentConversation?.id === conv.id }]"
          @click="handleSelectConversation(conv)"
        >
          <div class="title">{{ conv.title || '新对话' }}</div>
          <div class="meta">
            <span>{{ getProviderLabel(conv.modelProvider) }}</span>
            <span>{{ formatTime(conv.createTime) }}</span>
          </div>
          <el-button type="danger" link size="small" class="delete-btn" @click.stop="handleDeleteConversation(conv)">
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-area">
      <div v-if="!currentConversation" class="empty">
        <el-empty description="请选择或创建一个会话" />
      </div>
      <template v-else>
        <!-- 消息列表 -->
        <div ref="messageListRef" class="message-list">
          <div v-for="msg in messages" :key="msg.id" :class="['message', msg.role]">
            <div class="avatar">
              <el-avatar v-if="msg.role === 'user'" :size="32">我</el-avatar>
              <el-avatar v-else :size="32" class="ai-avatar">AI</el-avatar>
            </div>
            <div class="content">
              <div class="text">{{ msg.content }}</div>
              <div v-if="msg.role === 'assistant'" class="meta">
                <span>{{ getProviderLabel(msg.modelProvider) }}</span>
                <span>{{ msg.tokensUsed }} tokens</span>
                <span>{{ msg.responseTime }}ms</span>
              </div>
            </div>
          </div>
          <!-- 流式响应占位 -->
          <div v-if="streamingContent" class="message assistant streaming">
            <div class="avatar">
              <el-avatar :size="32" class="ai-avatar">AI</el-avatar>
            </div>
            <div class="content">
              <div class="text">{{ streamingContent }}</div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入消息..."
            :disabled="isStreaming"
            @keydown.enter.ctrl="handleSend"
          />
          <div class="actions">
            <el-button
              v-if="isStreaming"
              type="danger"
              @click="handleStopStream"
            >
              停止
            </el-button>
            <el-button
              v-else
              type="primary"
              :disabled="!inputMessage.trim()"
              @click="handleSend"
            >
              发送
            </el-button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { chatApi, type ConversationResponse, type MessageResponse } from '@/api/ai/chat'
import { createSSE } from '@/utils/sse'

const currentProvider = ref('DEEPSEEK')
const conversations = ref<ConversationResponse[]>([])
const currentConversation = ref<ConversationResponse | null>(null)
const messages = ref<MessageResponse[]>([])
const inputMessage = ref('')
const isStreaming = ref(false)
const streamingContent = ref('')
const messageListRef = ref<HTMLElement | null>(null)
let sseClient: ReturnType<typeof createSSE> | null = null

// 提供商映射
const providerMap: Record<string, string> = {
  QWEN: '通义千问',
  ERNIE: '文心一言',
  DEEPSEEK: 'DeepSeek',
  GLM: '智谱GLM'
}

function getProviderLabel(provider: string): string {
  return providerMap[provider] || provider
}

// 格式化时间
function formatTime(time: string): string {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleDateString()
}

// 获取会话列表
async function getConversations() {
  try {
    const res = await chatApi.list()
    conversations.value = res.data || []
  } catch (error) {
    ElMessage.error('获取会话列表失败')
  }
}

// 创建新会话
async function handleNewConversation() {
  try {
    const res = await chatApi.create({
      modelProvider: currentProvider.value,
      modelName: getDefaultModelName(currentProvider.value)
    })
    const newConv = res.data
    conversations.value.unshift(newConv!)
    handleSelectConversation(newConv!)
  } catch (error) {
    ElMessage.error('创建会话失败')
  }
}

// 获取默认模型名称
function getDefaultModelName(provider: string): string {
  const modelNames: Record<string, string> = {
    DEEPSEEK: 'deepseek-chat',
    QWEN: 'qwen-turbo',
    ERNIE: 'ernie-bot-4',
    GLM: 'glm-4'
  }
  return modelNames[provider] || ''
}

// 选择会话
async function handleSelectConversation(conv: ConversationResponse) {
  currentConversation.value = conv
  currentProvider.value = conv.modelProvider
  try {
    const res = await chatApi.messages(conv.id)
    messages.value = res.data || []
    scrollToBottom()
  } catch (error) {
    ElMessage.error('获取消息历史失败')
  }
}

// 删除会话
async function handleDeleteConversation(conv: ConversationResponse) {
  try {
    await ElMessageBox.confirm('确定删除该会话？', '提示', { type: 'warning' })
    await chatApi.delete(conv.id)
    conversations.value = conversations.value.filter(c => c.id !== conv.id)
    if (currentConversation.value?.id === conv.id) {
      currentConversation.value = null
      messages.value = []
    }
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 模型切换
function handleProviderChange() {
  // 切换模型时更新当前会话的模型（如果需要）
}

// 发送消息
async function handleSend() {
  if (!inputMessage.value.trim() || !currentConversation.value) return

  const content = inputMessage.value.trim()
  inputMessage.value = ''
  isStreaming.value = true
  streamingContent.value = ''

  // 先添加用户消息到列表
  const userMsg: MessageResponse = {
    id: 0,
    conversationId: currentConversation.value.id,
    role: 'user',
    content: content,
    tokensUsed: 0,
    modelProvider: currentProvider.value,
    responseTime: 0,
    createTime: new Date().toISOString()
  }
  messages.value.push(userMsg)
  scrollToBottom()

  // 建立 SSE 连接
  sseClient = createSSE({
    url: '/api/ai/chat/send',
    data: {
      conversationId: currentConversation.value.id,
      content: content
    },
    onMessage: (text) => {
      streamingContent.value += text
      scrollToBottom()
    },
    onError: (error) => {
      ElMessage.error('发送失败: ' + error.message)
      isStreaming.value = false
      streamingContent.value = ''
    },
    onComplete: () => {
      isStreaming.value = false
      // 刷新消息列表获取完整记录
      if (currentConversation.value) {
        chatApi.messages(currentConversation.value.id).then(res => {
          messages.value = res.data || []
          streamingContent.value = ''
          scrollToBottom()
        })
      }
    }
  })
}

// 停止流式响应
function handleStopStream() {
  if (sseClient) {
    sseClient.close()
    isStreaming.value = false
    streamingContent.value = ''
  }
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

onMounted(() => {
  getConversations()
})
</script>

<style scoped lang="scss">
.chat-container {
  display: flex;
  height: calc(100vh - 100px);
  background: #f5f7fa;

  .conversation-list {
    width: 280px;
    background: #fff;
    border-right: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;

    .header {
      padding: 16px;
      display: flex;
      gap: 8px;
      border-bottom: 1px solid #e4e7ed;

      .el-select {
        flex: 1;
      }
    }

    .list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;

      .item {
        padding: 12px;
        margin-bottom: 8px;
        background: #f5f7fa;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;

        &:hover {
          background: #e6e8eb;
        }

        &.active {
          background: #ecf5ff;
          border: 1px solid #409eff;
        }

        .title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta {
          font-size: 12px;
          color: #909399;
          display: flex;
          gap: 8px;
        }

        .delete-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0;
        }

        &:hover .delete-btn {
          opacity: 1;
        }
      }
    }
  }

  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fff;

    .empty {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .message-list {
      flex: 1;
      overflow-y: auto;
      padding: 20px;

      .message {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;

        &.user {
          .content .text {
            background: #ecf5ff;
          }
        }

        &.assistant {
          .content .text {
            background: #f5f7fa;
          }
        }

        &.streaming .content .text {
          background: #fdf6ec;
          border: 1px dashed #e6a23c;
        }

        .avatar {
          .ai-avatar {
            background: #409eff;
          }
        }

        .content {
          flex: 1;

          .text {
            padding: 12px 16px;
            border-radius: 8px;
            line-height: 1.6;
            max-width: 80%;
          }

          .meta {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
            display: flex;
            gap: 8px;
          }
        }
      }
    }

    .input-area {
      padding: 16px;
      border-top: 1px solid #e4e7ed;
      display: flex;
      gap: 12px;

      .el-input {
        flex: 1;
      }

      .actions {
        display: flex;
        align-items: flex-end;
      }
    }
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/forge-web/src/views/ai/chat/index.vue
git commit -m "feat(ai): 添加智能对话页面，支持 SSE 流式响应"
```

---

## Task 5: 文档管理页面

**Files:**
- Create: `apps/forge-web/src/views/ai/document/index.vue`

- [ ] **Step 1: 创建文档管理页面**

```vue
<!-- apps/forge-web/src/views/ai/document/index.vue -->
<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="文件名">
          <el-input v-model="queryParams.fileName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="文件类型">
          <el-select v-model="queryParams.fileType" placeholder="请选择" clearable>
            <el-option label="PDF" value="pdf" />
            <el-option label="Word" value="docx" />
            <el-option label="TXT" value="txt" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable>
            <el-option label="待处理" :value="0" />
            <el-option label="处理中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="失败" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="never" class="table-card">
      <vxe-toolbar ref="toolbarRef" custom>
        <template #buttons>
          <el-upload
            ref="uploadRef"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="handleUpload"
            accept=".pdf,.doc,.docx,.txt"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              上传文档
            </el-button>
          </el-upload>
        </template>
      </vxe-toolbar>
      <vxe-table
        ref="tableRef"
        id="aiDocumentTable"
        :data="tableData"
        :height="tableHeight"
        :row-config="{ isCurrent: true, isHover: true }"
        show-overflow="tooltip"
        v-loading="loading"
      >
        <vxe-column type="seq" title="序号" width="60" :seq-method="seqMethod" />
        <vxe-column field="fileName" title="文件名" min-width="200" />
        <vxe-column field="fileType" title="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="getFileTypeTagType(row.fileType)">{{ row.fileType.toUpperCase() }}</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="fileSize" title="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </vxe-column>
        <vxe-column field="status" title="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="modelProvider" title="摘要模型" width="100">
          <template #default="{ row }">
            <span v-if="row.modelProvider">{{ getProviderLabel(row.modelProvider) }}</span>
            <span v-else>-</span>
          </template>
        </vxe-column>
        <vxe-column field="createTime" title="上传时间" width="160" />
        <vxe-column title="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 2 && !row.summary"
              type="success"
              link
              size="small"
              @click="handleSummary(row)"
            >
              生成摘要
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
      />
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="文档详情" width="800px">
      <el-tabs v-model="detailActiveTab">
        <el-tab-pane label="原文内容" name="content">
          <div class="content-box">
            <pre>{{ currentDocument?.content || '暂无内容' }}</pre>
          </div>
        </el-tab-pane>
        <el-tab-pane label="AI摘要" name="summary">
          <div class="summary-box">
            <p v-if="currentDocument?.summary">{{ currentDocument.summary }}</p>
            <el-empty v-else description="暂无摘要" />
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button
          v-if="currentDocument?.status === 2 && !currentDocument?.summary"
          type="primary"
          @click="handleSummary(currentDocument!)"
        >
          生成摘要
        </el-button>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { useTableHeight } from '@/composables/useTableHeight'
import { useTableSeq } from '@/composables/useTableSeq'
import { documentApi, type DocumentResponse, type DocumentQuery } from '@/api/ai/document'

const { tableHeight } = useTableHeight()
const { seqMethod } = useTableSeq({
  currentPage: computed(() => queryParams.pageNum),
  pageSize: computed(() => queryParams.pageSize)
})

const tableRef = ref()
const toolbarRef = ref()
const uploadRef = ref()
const loading = ref(false)
const tableData = ref<DocumentResponse[]>([])
const total = ref(0)
const detailDialogVisible = ref(false)
const detailActiveTab = ref('content')
const currentDocument = ref<DocumentResponse | null>(null)

const queryParams = reactive<DocumentQuery>({
  pageNum: 1,
  pageSize: 10,
  fileName: '',
  fileType: '',
  status: undefined
})

// 提供商映射
const providerMap: Record<string, string> = {
  QWEN: '通义千问',
  ERNIE: '文心一言',
  DEEPSEEK: 'DeepSeek',
  GLM: '智谱GLM'
}

function getProviderLabel(provider: string): string {
  return providerMap[provider] || provider
}

// 文件类型标签
function getFileTypeTagType(type: string): string {
  const map: Record<string, string> = {
    pdf: 'danger',
    docx: 'primary',
    txt: 'info'
  }
  return map[type] || 'info'
}

// 状态标签
function getStatusTagType(status: number): string {
  const map: Record<number, string> = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return map[status] || 'info'
}

function getStatusLabel(status: number): string {
  const map: Record<number, string> = {
    0: '待处理',
    1: '处理中',
    2: '已完成',
    3: '失败'
  }
  return map[status] || '未知'
}

// 格式化文件大小
function formatFileSize(size: number): string {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / 1024 / 1024).toFixed(1) + ' MB'
}

// 获取列表
async function getList() {
  loading.value = true
  try {
    const res = await documentApi.list(queryParams)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch (error) {
    ElMessage.error('获取文档列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

// 重置
function handleReset() {
  queryParams.fileName = ''
  queryParams.fileType = ''
  queryParams.status = undefined
  queryParams.pageNum = 1
  getList()
}

// 上传前校验
function beforeUpload(file: File) {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('仅支持 PDF、Word、TXT 格式')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

// 自定义上传
async function handleUpload(options: any) {
  try {
    await documentApi.upload(options.file)
    ElMessage.success('上传成功')
    getList()
  } catch (error) {
    ElMessage.error('上传失败')
  }
}

// 查看详情
async function handleDetail(row: DocumentResponse) {
  try {
    const res = await documentApi.get(row.id)
    currentDocument.value = res.data
    detailActiveTab.value = 'content'
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 生成摘要
async function handleSummary(row: DocumentResponse) {
  try {
    await ElMessageBox.confirm('确定生成 AI 摘要？', '提示', { type: 'info' })
    ElMessage.info('正在生成摘要...')
    const res = await documentApi.summary(row.id)
    currentDocument.value = res.data
    detailActiveTab.value = 'summary'
    getList()
    ElMessage.success('摘要生成成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('摘要生成失败')
    }
  }
}

// 删除文档
async function handleDelete(row: DocumentResponse) {
  try {
    await ElMessageBox.confirm('确定删除该文档？', '提示', { type: 'warning' })
    await documentApi.delete(row.id)
    ElMessage.success('删除成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  getList()
  tableRef.value?.connect(toolbarRef.value!)
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 0;

  .search-card {
    margin-bottom: 15px;
  }

  .table-card {
    .el-pagination {
      margin-top: 15px;
      justify-content: flex-end;
    }
  }
}

.content-box,
.summary-box {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;

  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: inherit;
    margin: 0;
  }

  p {
    line-height: 1.8;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/forge-web/src/views/ai/document/index.vue
git commit -m "feat(ai): 添加文档管理页面"
```

---

## Task 6: 路由注册

**Files:**
- None（动态路由由后端菜单驱动）

- [ ] **Step 1: 验证菜单数据已在数据库**

确保数据库中 AI 模块菜单已通过迁移脚本插入（Plan 1 中已包含）：

```sql
-- 菜单 ID 300-310 已在 V2026061701__ai_module_tables.sql 中定义
-- 前端会自动根据后端菜单树生成路由
```

- [ ] **Step 2: 验证组件自动发现**

确认 `apps/forge-web/src/views/ai/` 目录下有以下组件：
- `chat/index.vue`
- `document/index.vue`
- `model/index.vue`

前端路由通过 `import.meta.glob('/src/views/**/*.vue')` 自动发现，无需手动注册。

- [ ] **Step 3: Commit（仅文档说明）**

```bash
git add -A
git commit -m "feat(ai): 完成 AI 模块前端页面实现"
```

---

## 执行完成后验证

1. **启动后端服务**
```bash
cd apps/forge-server
mvn spring-boot:run -pl forge-server
```

2. **启动前端服务**
```bash
cd apps/forge-web
pnpm dev
```

3. **访问页面**
- 智能对话: http://localhost:3003/ai/chat
- 文档管理: http://localhost:3003/ai/document
- 模型配置: http://localhost:3003/ai/model

4. **测试 SSE 流式响应**
- 创建新会话
- 发送消息
- 观察 AI 回答是否流式显示

5. **测试文档功能**
- 上传 PDF/Word 文档
- 查看解析后的文本内容
- 生成 AI 摘要