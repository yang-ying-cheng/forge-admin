<template>
  <el-dialog
    v-model="visible"
    title="流程图"
    width="800px"
    destroy-on-close
    @close="handleClose"
  >
    <div v-loading="loading" class="diagram-container">
      <div v-if="svgContent" class="svg-wrapper" v-html="svgContent" />
      <el-empty v-else-if="!loading" description="流程图加载失败" />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { processDefinitionApi } from '@/api/workflow/process-definition'
import { processInstanceApi } from '@/api/workflow/process-instance'

const props = defineProps<{
  modelValue: boolean
  processDefinitionId?: string
  processInstanceId?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const svgContent = ref('')

watch(visible, async (val) => {
  if (val) {
    await loadDiagram()
  }
})

const loadDiagram = async () => {
  loading.value = true
  try {
    let blob: Blob
    if (props.processInstanceId) {
      // 优先使用实例 ID，获取带高亮的流程图
      blob = await processInstanceApi.getDiagram(props.processInstanceId)
    } else if (props.processDefinitionId) {
      // 使用流程定义 ID，获取基础流程图
      blob = await processDefinitionApi.getDiagram(props.processDefinitionId)
    } else {
      return
    }
    const text = await blob.text()
    svgContent.value = text
  } catch (error) {
    console.error('加载流程图失败:', error)
    svgContent.value = ''
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  svgContent.value = ''
}
</script>

<style scoped lang="scss">
.diagram-container {
  min-height: 400px;
  max-height: 600px;
  overflow: auto;
  background: #f5f7fa;
  border-radius: 4px;

  .svg-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;

    :deep(svg) {
      max-width: 100%;
      height: auto;
    }
  }
}
</style>