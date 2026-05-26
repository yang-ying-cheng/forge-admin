<template>
  <div ref="containerRef" class="bpmn-preview-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import LogicFlow from '@logicflow/core'
import '@logicflow/core/dist/index.css'
import '@logicflow/extension/lib/style/index.css'
import { BPMNElements, BpmnXmlAdapter } from '@logicflow/extension'
import { parseStandardBpmnXml, isStandardBpmnXml } from '@/composables/useBpmnDesigner'

const props = defineProps<{
  xml: string
}>()

const containerRef = ref<HTMLElement | null>(null)
let lfInstance: LogicFlow | null = null

const renderDiagram = () => {
  if (!containerRef.value || !props.xml) return

  if (!lfInstance) {
    lfInstance = new LogicFlow({
      container: containerRef.value,
      plugins: [BPMNElements, BpmnXmlAdapter],
      isSilentMode: true,
      stopZoomGraph: true,
      stopScrollGraph: true,
      stopMoveGraph: true,
    })
  }

  if (isStandardBpmnXml(props.xml)) {
    const graphData = parseStandardBpmnXml(props.xml)
    ;(lfInstance as any).renderRawData(graphData)
  } else {
    ;(lfInstance as any).render(props.xml)
  }
}

watch(() => props.xml, () => renderDiagram())

onMounted(() => renderDiagram())

onBeforeUnmount(() => {
  lfInstance?.destroy()
  lfInstance = null
})
</script>

<style scoped>
.bpmn-preview-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>
