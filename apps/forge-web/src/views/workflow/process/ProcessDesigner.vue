<template>
  <div class="designer-page">
    <!-- 顶部工具栏 -->
    <div class="designer-top-bar">
      <div class="top-bar-left">
        <el-button size="small" @click="handleGoBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <span class="page-title">{{ isEdit ? '编辑流程' : '新增流程' }}</span>
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
        <el-button type="primary" size="small" @click="handleOpenDeployDialog">
          <el-icon><Check /></el-icon>保存并部署
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

    <!-- 部署对话框 -->
    <el-dialog v-model="deployDialogVisible" title="部署流程" width="500px">
      <el-form ref="deployFormRef" :model="deployForm" :rules="deployRules" label-width="100px">
        <el-form-item label="流程名称" prop="name">
          <el-input v-model="deployForm.name" placeholder="请输入流程名称" />
        </el-form-item>
        <el-form-item label="流程标识" prop="key">
          <el-input v-model="deployForm.key" placeholder="请输入流程标识（英文）" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="deployForm.categoryId" placeholder="请选择分类" clearable style="width: 100%">
            <el-option
              v-for="item in categoryList"
              :key="item.id"
              :label="item.categoryName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="deployForm.description" type="textarea" :rows="3" placeholder="请输入流程描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deployDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="deployLoading" @click="handleDeploy">确定部署</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { processDefinitionApi } from '@/api/workflow/process-definition'
import { categoryApi } from '@/api/workflow/category'
import BpmnDesigner from './components/BpmnDesigner.vue'
import BpmnPalette from './components/BpmnPalette.vue'
import BpmnPropertiesPanel from './components/BpmnPropertiesPanel.vue'

const router = useRouter()
const route = useRoute()

const designerRef = ref<InstanceType<typeof BpmnDesigner> | null>(null)
const lfInstance = ref<any>(null)

const canUndo = ref(false)
const canRedo = ref(false)

// 编辑模式
const isEdit = computed(() => !!route.query.id)

// 分类列表
const categoryList = ref<{ id: number; categoryName: string }[]>([])

// 部署对话框
const deployDialogVisible = ref(false)
const deployLoading = ref(false)
const deployFormRef = ref<FormInstance>()
const processDetail = ref<any>(null) // 编辑模式下缓存的流程定义详情
const deployForm = reactive({
  name: '',
  key: '',
  categoryId: undefined as number | undefined,
  description: ''
})
const deployRules: FormRules = {
  name: [{ required: true, message: '请输入流程名称', trigger: 'blur' }],
  key: [
    { required: true, message: '请输入流程标识', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/, message: '流程标识需以字母开头，仅允许字母、数字、下划线和横线', trigger: 'blur' }
  ]
}

/** 设计器就绪回调 */
const handleDesignerReady = () => {
  if (!designerRef.value) return

  const designer = designerRef.value
  lfInstance.value = designer.lf || null

  // 如果是编辑模式，加载已有XML
  if (route.query.id) {
    loadExistingProcess(route.query.id as string)
  }
}

/** 加载已有流程定义 */
const loadExistingProcess = async (id: string) => {
  try {
    const [xml, detail] = await Promise.all([
      processDefinitionApi.getXml(id),
      processDefinitionApi.getById(id),
    ])
    if (xml && designerRef.value) {
      designerRef.value.render(xml)
    }
    // 缓存详情并预填部署表单
    if (detail) {
      processDetail.value = detail
      deployForm.name = detail.name || ''
      deployForm.key = detail.key || ''
      deployForm.categoryId = detail.categoryId || undefined
      deployForm.description = detail.description || ''
    }
  } catch (e) {
    ElMessage.error('加载流程定义失败')
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
  router.push('/workflow/process')
}

/** 打开部署对话框 */
const handleOpenDeployDialog = () => {
  if (!isEdit.value) {
    // 新增模式：重置表单
    deployForm.name = ''
    deployForm.key = ''
    deployForm.categoryId = undefined
    deployForm.description = ''
  }
  // 编辑模式下表单已由 loadExistingProcess 预填，保留用户可修改
  deployDialogVisible.value = true
}

/** 部署流程 */
const handleDeploy = async () => {
  if (!deployFormRef.value) return
  await deployFormRef.value.validate()

  if (!designerRef.value) return

  const xmlData = designerRef.value.getXmlData()
  if (!xmlData) {
    ElMessage.warning('请先设计流程图')
    return
  }

  let bpmnXml = typeof xmlData === 'string' ? xmlData : JSON.stringify(xmlData)

  // 将用户填写的 name/key 注入到 BPMN XML 的 <bpmn:process> 元素中
  bpmnXml = bpmnXml
    .replace(/(<bpmn:process[^>]*?)\bid="[^"]*"/, `$1 id="${deployForm.key}"`)
    .replace(/(<bpmn:process[^>]*?)\bname="[^"]*"/, `$1 name="${deployForm.name}"`)
  // 如果 process 没有 name 属性，则添加
  if (!/<bpmn:process[^>]*name="/.test(bpmnXml)) {
    bpmnXml = bpmnXml.replace(
      /(<bpmn:process[^>]*?)\bid="[^"]*"/,
      `$1 id="${deployForm.key}" name="${deployForm.name}"`
    )
  }

  deployLoading.value = true
  try {
    await processDefinitionApi.deploy({
      name: deployForm.name,
      key: deployForm.key,
      categoryId: deployForm.categoryId,
      description: deployForm.description,
      bpmnXml
    })
    ElMessage.success('部署成功')
    deployDialogVisible.value = false
    router.push('/workflow/process')
  } catch (e) {
    ElMessage.error('部署失败')
  } finally {
    deployLoading.value = false
  }
}

/** 加载分类列表 */
const getCategoryList = async () => {
  try {
    categoryList.value = await categoryApi.listAll()
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  getCategoryList()
})
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
