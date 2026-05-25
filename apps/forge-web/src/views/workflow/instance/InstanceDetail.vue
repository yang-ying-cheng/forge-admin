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
      <div class="diagram-section">
        <el-card shadow="never">
          <template #header>流程图</template>
          <BpmnPreview v-if="bpmnXml" :xml="bpmnXml" />
          <el-empty v-else description="暂无流程图" />
        </el-card>
      </div>

      <div class="info-section">
        <el-card shadow="never" class="info-card">
          <template #header>实例信息</template>
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

        <el-card shadow="never" class="timeline-card">
          <template #header>审批记录</template>
          <el-timeline>
            <el-timeline-item
              v-for="comment in comments"
              :key="comment.id"
              :timestamp="formatDateTime(comment.createTime)"
              placement="top"
            >
              <div class="comment-item">
                <div class="comment-header">
                  <span class="user-name">{{ comment.userName }}</span>
                  <el-tag size="small" :type="actionTagType(comment.actionType)">
                    {{ actionLabel(comment.actionType) }}
                  </el-tag>
                </div>
                <div v-if="comment.taskName" class="task-name">{{ comment.taskName }}</div>
                <div v-if="comment.commentText" class="comment-text">{{ comment.commentText }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="!comments.length" description="暂无审批记录" :image-size="60" />
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { processInstanceApi } from '@/api/workflow/process-instance'
import { processDefinitionApi } from '@/api/workflow/process-definition'
import type { ProcessInstance, ApprovalComment } from '@/types/workflow'
import { formatDateTime } from '@/utils/dateFormat'
import BpmnPreview from '@/views/workflow/process/components/BpmnPreview.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const instance = ref<ProcessInstance | null>(null)
const comments = ref<ApprovalComment[]>([])
const bpmnXml = ref('')

const instanceId = route.query.id as string

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
      // 通过流程定义ID获取 BPMN XML
      if (instanceData.value?.processDefinitionId) {
        try {
          bpmnXml.value = await processDefinitionApi.getXml(instanceData.value.processDefinitionId) || ''
        } catch {
          // BPMN XML 获取失败不影响页面展示
        }
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
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  height: calc(100vh - 140px);

  .diagram-section {
    flex: 3;
    min-width: 0;

    :deep(.el-card) {
      height: 100%;

      .el-card__body {
        height: calc(100% - 50px);
        overflow: auto;
      }
    }
  }

  .info-section {
    flex: 2;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .info-card,
    .timeline-card {
      :deep(.el-card__body) {
        max-height: 300px;
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
    margin-bottom: 4px;

    .user-name {
      font-weight: 500;
      font-size: 14px;
    }
  }

  .task-name {
    font-size: 13px;
    color: #909399;
    margin-bottom: 4px;
  }

  .comment-text {
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
  }
}

@media (max-width: 768px) {
  .detail-content {
    flex-direction: column;
    height: auto;

    .diagram-section,
    .info-section {
      flex: none;
    }
  }
}
</style>
