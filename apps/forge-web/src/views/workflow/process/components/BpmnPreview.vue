<template>
  <div ref="containerRef" class="bpmn-preview-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'

const props = defineProps<{
  xml: string
  highlightElements?: string[]
}>()

const containerRef = ref<HTMLElement | null>(null)
const viewer = ref<BpmnViewer | null>(null)

const initViewer = async () => {
  if (!containerRef.value) return

  const instance = new BpmnViewer({
    container: containerRef.value,
  })

  viewer.value = instance

  if (props.xml) {
    await renderXml(props.xml)
  }
}

const applyHighlight = async () => {
  if (!viewer.value || !props.highlightElements || props.highlightElements.length === 0) return

  try {
    const elementRegistry = viewer.value.get('elementRegistry')
    const canvas = viewer.value.get('canvas')

    for (const elementId of props.highlightElements) {
      const element = elementRegistry.get(elementId)
      if (element) {
        canvas.addMarker(elementId, 'highlight-current')
      }
    }
  } catch (err) {
    console.error('高亮节点失败:', err)
  }
}

const renderXml = async (xml: string) => {
  if (!viewer.value || !xml) return

  try {
    await viewer.value.importXML(xml)
    const canvas = viewer.value.get('canvas')
    canvas.zoom('fit-viewport')

    // 添加高亮样式
    addHighlightStyles()

    // 应用高亮
    await applyHighlight()
  } catch (err) {
    console.error('渲染 BPMN XML 失败:', err)
  }
}

const addHighlightStyles = () => {
  // 避免重复添加
  if (document.getElementById('bpmn-highlight-styles')) return

  const style = document.createElement('style')
  style.id = 'bpmn-highlight-styles'
  style.textContent = `
    .bpmn-preview-container .highlight-current .djs-visual > :nth-child(1) {
      stroke: #e6a23c !important;
      stroke-width: 3px !important;
      fill: rgba(230, 162, 60, 0.15) !important;
    }
    .bpmn-preview-container .highlight-current > .djs-visual > text {
      fill: #e6a23c !important;
    }
  `
  document.head.appendChild(style)
}

watch(() => props.xml, async (newXml) => {
  if (newXml && viewer.value) {
    await renderXml(newXml)
  }
})

watch(() => props.highlightElements, async () => {
  if (viewer.value) {
    // 先清除旧的高亮
    const canvas = viewer.value.get('canvas')
    const elementRegistry = viewer.value.get('elementRegistry')
    const elements = elementRegistry.getAll()
    for (const el of elements) {
      try { canvas.removeMarker(el.id, 'highlight-current') } catch {}
    }
    await applyHighlight()
  }
}, { deep: true })

onMounted(() => {
  initViewer()
})

onBeforeUnmount(() => {
  if (viewer.value) {
    viewer.value.destroy()
  }
})
</script>

<style scoped>
.bpmn-preview-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: #f8f8f8;
}
</style>
