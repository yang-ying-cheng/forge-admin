<template>
  <el-dialog v-model="visible" title="流程图" width="800px" top="5vh" @opened="handleOpened">
    <div style="height: 60vh">
      <BpmnPreview
        v-if="bpmnXml && visible"
        :xml="bpmnXml"
        :highlight-elements="activeActivityIds"
        :key="diagramKey"
      />
      <el-empty v-else description="暂无流程图" />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BpmnPreview from './BpmnPreview.vue'

defineProps<{
  bpmnXml: string
  activeActivityIds?: string[]
}>()

const visible = defineModel<boolean>({ default: false })

const diagramKey = ref(0)

const handleOpened = () => {
  diagramKey.value++
}
</script>
