<template>
  <div class="designer-page">
    <!-- 顶部工具栏 -->
    <div class="designer-top-bar">
      <div class="top-bar-left">
        <el-button size="small" @click="handleGoBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <span class="page-title">模型设计</span>
      </div>
      <div class="top-bar-right">
        <el-button size="small" @click="handleUndo" :disabled="!canUndo">
          <el-icon><RefreshLeft /></el-icon>撤销
        </el-button>
        <el-button size="small" @click="handleRedo" :disabled="!canRedo">
          <el-icon><RefreshRight /></el-icon>重做
        </el-button>
        <el-button size="small" @click="handleClear">
          <el-icon><Delete /></el-icon>清空
        </el-button>
        <el-button-group>
          <el-button size="small" @click="handleZoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button size="small" @click="handleResetZoom">适应</el-button>
          <el-button size="small" @click="handleZoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
        </el-button-group>
        <el-button type="success" size="small" @click="handleSave">
          <el-icon><Check /></el-icon>保存
        </el-button>
        <el-button type="primary" size="small" @click="handleDeploy">
          <el-icon><Upload /></el-icon>部署
        </el-button>
      </div>
    </div>

    <!-- 设计器主体 -->
    <div class="designer-body">
      <!-- 左侧面板 -->
      <BpmnPalette :lf="lfInstance" />

      <!-- 中间画布 -->
      <div class="designer-canvas">
        <BpmnDesigner ref="designerRef" @ready="handleDesignerReady" />
      </div>

      <!-- 右侧属性面板 -->
      <BpmnPropertiesPanel :lf="lfInstance" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { modelApi } from '@/api/workflow/model'
import type { WfModel } from '@/api/workflow/model'
import BpmnDesigner from '@/views/workflow/process/components/BpmnDesigner.vue'
import BpmnPalette from '@/views/workflow/process/components/BpmnPalette.vue'
import BpmnPropertiesPanel from '@/views/workflow/process/components/BpmnPropertiesPanel.vue'

const router = useRouter()
const route = useRoute()

const designerRef = ref<InstanceType<typeof BpmnDesigner> | null>(null)
const lfInstance = ref<any>(null)

const canUndo = ref(false)
const canRedo = ref(false)

// 模型数据缓存
const modelData = ref<WfModel | null>(null)

/** 设计器就绪回调 */
const handleDesignerReady = () => {
  if (!designerRef.value) return

  const designer = designerRef.value
  lfInstance.value = designer.lf || null

  // 如果有模型 ID，加载已有数据
  if (route.query.id) {
    loadModel(route.query.id as string)
  }
}

/** 加载模型数据 */
const loadModel = async (id: string) => {
  try {
    const data = await modelApi.getById(id)
    modelData.value = data
    if (data.bpmnXml && designerRef.value) {
      designerRef.value.render(data.bpmnXml)
    }
  } catch (e) {
    ElMessage.error('加载模型失败')
  }
}

/** 撤销 */
const handleUndo = () => {
  designerRef.value?.undo()
}

/** 重做 */
const handleRedo = () => {
  designerRef.value?.redo()
}

/** 清空 */
const handleClear = async () => {
  try {
    await ElMessageBox.confirm('确定清空画布？清空后不可恢复', '警告', { type: 'warning' })
    designerRef.value?.clear()
  } catch (e) {
    // 用户取消
  }
}

/** 放大 */
const handleZoomIn = () => {
  designerRef.value?.zoom(1.1)
}

/** 缩小 */
const handleZoomOut = () => {
  designerRef.value?.zoom(0.9)
}

/** 适应画布 */
const handleResetZoom = () => {
  designerRef.value?.resetZoom()
}

/** 返回列表页 */
const handleGoBack = () => {
  router.push('/workflow/model')
}

/** 保存模型 */
const handleSave = async () => {
  if (!designerRef.value) return

  const xmlData = designerRef.value.getXmlData()
  if (!xmlData) {
    ElMessage.warning('请先设计流程图')
    return
  }

  const id = route.query.id as string
  if (!id) {
    ElMessage.warning('缺少模型 ID')
    return
  }

  try {
    await ElMessageBox.confirm('确定保存模型？', '保存确认', { type: 'info' })

    let bpmnXml = typeof xmlData === 'string' ? xmlData : JSON.stringify(xmlData)

    await modelApi.update({
      id,
      name: modelData.value?.name || '',
      key: modelData.value?.key || '',
      category: modelData.value?.category,
      description: modelData.value?.description,
      bpmnXml,
    })
    ElMessage.success('保存成功')
  } catch (e) {
    // 用户取消或其他错误
  }
}

/** 部署模型 */
const handleDeploy = async () => {
  const id = route.query.id as string
  if (!id) {
    ElMessage.warning('缺少模型 ID')
    return
  }

  try {
    await ElMessageBox.confirm('确定部署该模型？', '部署确认', { type: 'info' })
    await modelApi.deploy(id)
    ElMessage.success('部署成功')
  } catch (e) {
    // 用户取消或其他错误
  }
}
</script>

<style scoped lang="scss">
.designer-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  background: var(--el-bg-color);
  border-radius: 4px;
  overflow: hidden;
}

.designer-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  flex-shrink: 0;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.designer-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.designer-canvas {
  flex: 1;
  overflow: hidden;
}
</style>
