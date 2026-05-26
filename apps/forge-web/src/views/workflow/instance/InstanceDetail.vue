<template>
  <div class="app-container">
    <div class="detail-header">
      <el-page-header @back="router.back()">
        <template #content>
          <span class="page-title">{{ instance?.processDefinitionName || '流程实例详情' }}</span>
        </template>
      </el-page-header>
    </div>

    <div v-loading="loading" class="detail-content">
      <div class="info-section">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <span>实例信息</span>
              <el-button type="primary" size="small" @click="diagramDialogVisible = true">
                查看流程图
              </el-button>
            </div>
          </template>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="流程名称">
              {{ instance?.processDefinitionName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="发起人">
              {{ instance?.startUserName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="发起时间">
              {{ formatDateTime(instance?.startTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag v-if="!instance?.endTime" type="primary">运行中</el-tag>
              <el-tag v-else-if="instance?.deleteReason" type="danger">已终止</el-tag>
              <el-tag v-else type="success">已结束</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="业务标识">
              {{ instance?.businessKey || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 流程表单 -->
        <el-card v-if="formReady && formRule.length > 0" shadow="never" class="form-card">
          <template #header>申请表单</template>
          <form-create
            ref="formCreateRef"
            v-model="formData"
            :rule="formRule"
            :option="formOption"
          />
        </el-card>

        <el-card shadow="never" class="timeline-card">
          <template #header>审批记录</template>
          <el-table :data="comments" size="small" v-if="comments.length">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="createTime" label="时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column prop="userName" label="审批人" width="100" />
            <el-table-column prop="actionType" label="动作" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="actionTagType(row.actionType)">
                  {{ actionLabel(row.actionType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="taskName" label="任务名称" min-width="120" />
            <el-table-column prop="commentText" label="审批意见" min-width="200" show-overflow-tooltip />
          </el-table>
          <el-empty v-else description="暂无审批记录" :image-size="60" />
        </el-card>
      </div>
    </div>

    <!-- 流程图弹窗 -->
    <el-dialog v-model="diagramDialogVisible" title="流程图" width="800px" top="5vh" @opened="handleDiagramOpened">
      <div ref="diagramContainerRef" style="height: 60vh">
        <BpmnPreview v-if="bpmnXml && diagramDialogVisible" :xml="bpmnXml" :key="diagramKey" />
        <el-empty v-else description="暂无流程图" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { processInstanceApi } from '@/api/workflow/process-instance'
import { processDefinitionApi } from '@/api/workflow/process-definition'
import { formApi } from '@/api/workflow/form'
import type { ProcessInstance, ApprovalComment } from '@/types/workflow'
import { formatDateTime } from '@/utils/dateFormat'
import { decodeFieldsDisabled } from '@/utils/formCreate'
import BpmnPreview from '@/views/workflow/process/components/BpmnPreview.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const instance = ref<ProcessInstance | null>(null)
const comments = ref<ApprovalComment[]>([])
const bpmnXml = ref('')
const diagramDialogVisible = ref(false)
const diagramContainerRef = ref<HTMLElement | null>(null)
const diagramKey = ref(0)

const instanceId = route.query.id as string

// 弹窗打开后触发 resize
const handleDiagramOpened = () => {
  diagramKey.value++
}

// 表单相关
const formCreateRef = ref<any>(null)
const formRule = ref<any[]>([])
const formOption = ref({ submitBtn: false, resetBtn: false, disabled: true } as any)
const formData = ref<Record<string, any>>({})
const formReady = ref(false)

// 审批动作标签映射
const actionLabel = (actionType: string): string => {
  const map: Record<string, string> = {
    approve: '通过',
    reject: '驳回',
    delegate: '委派',
    transfer: '转办',
    return: '退回',
    claim: '认领'
  }
  return map[actionType] || actionType
}

// 审批动作标签类型映射
const actionTagType = (actionType: string): 'success' | 'danger' | 'warning' | 'info' | 'primary' => {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'primary'> = {
    approve: 'success',
    reject: 'danger',
    delegate: 'warning',
    transfer: 'warning',
    return: 'info',
    claim: 'primary'
  }
  return map[actionType] || 'info'
}

// 获取实例详情
const getInstanceDetail = async () => {
  if (!instanceId) return
  loading.value = true
  try {
    const [instanceData, commentsData] = await Promise.allSettled([
      processInstanceApi.getById(instanceId),
      processInstanceApi.getComments(instanceId)
    ])

    if (instanceData.status === 'fulfilled') {
      instance.value = instanceData.value
      // 通过流程定义ID获取 BPMN XML 和表单
      if (instanceData.value?.processDefinitionId) {
        const processDefId = instanceData.value.processDefinitionId
        try {
          bpmnXml.value = await processDefinitionApi.getXml(processDefId) || ''
          // 加载流程定义详情获取表单ID
          const processDef = await processDefinitionApi.getById(processDefId)
          if (processDef.formId) {
            const formDefData = await formApi.getById(processDef.formId)
            if (formDefData.conf && formDefData.fields) {
              formRule.value = decodeFieldsDisabled(formDefData.fields)
              console.log('formRule.value', formRule.value)
              try {
                formOption.value = JSON.parse(formDefData.conf)
              } catch { /* ignore */ }
              formOption.value.submitBtn = false
              formOption.value.resetBtn = false
              formOption.value.disabled = true

              // 获取流程变量
              try {
                const variables = await processInstanceApi.getVariables(instanceId)
                formData.value = variables || {}
              } catch { /* ignore */ }

              formReady.value = true

              // 表单渲染后设置为只读
              nextTick(() => {
                if (formCreateRef.value) {
                  const fApi = formCreateRef.value.fApi || formCreateRef.value
                  if (fApi && fApi.disabled) {
                    fApi.disabled(true)
                  }
                }
              })
            }
          } else {
            formReady.value = true
          }
        } catch {
          formReady.value = true
        }
      } else {
        formReady.value = true
      }
    }

    if (commentsData.status === 'fulfilled') {
      comments.value = commentsData.value || []
    }
  } catch (error) {
    console.error('获取实例详情失败:', error)
    ElMessage.error('获取实例详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getInstanceDetail()
})
</script>

<style scoped lang="scss">
.detail-header {
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;

  .page-title {
    font-size: 16px;
    font-weight: 600;
  }
}

.detail-content {
  padding: 16px 20px;

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 800px;

    .info-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }

    .form-card,
    .timeline-card {
      :deep(.el-card__body) {
        max-height: 400px;
        overflow-y: auto;
      }
    }

    .timeline-card {
      flex: 1;

      :deep(.el-card__body) {
        max-height: none;
        overflow-y: auto;
      }
    }
  }
}

.comment-item {
  .comment-header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .comment-time {
      font-size: 13px;
      color: #909399;
    }

    .comment-separator {
      color: #dcdfe6;
    }

    .user-name {
      font-weight: 500;
      font-size: 14px;
      color: #606266;
    }

    .task-name {
      font-size: 13px;
      color: #909399;
    }
  }

  .comment-text {
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
    margin-top: 8px;
    padding-left: 0;
  }
}

@media (max-width: 768px) {
  .detail-content {
    .info-section {
      max-width: 100%;
    }
  }
}
</style>
