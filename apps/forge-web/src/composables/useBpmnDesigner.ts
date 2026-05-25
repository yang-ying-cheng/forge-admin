import { ref, shallowRef, markRaw, type Ref } from 'vue'
import LogicFlow from '@logicflow/core'
import { BPMNElements, BPMNAdapter } from '@logicflow/extension'

export function useBpmnDesigner(containerRef: Ref<HTMLElement | null>) {
  const lf = shallowRef<LogicFlow | null>(null)
  const isReady = ref(false)

  const init = () => {
    if (!containerRef.value) return

    const instance = new LogicFlow({
      container: containerRef.value,
      grid: { size: 20, visible: true, type: 'mesh' },
      keyboard: { enabled: true },
      plugins: [BPMNElements, BPMNAdapter],
      edgeType: 'bpmn:sequenceFlow',
    })

    lf.value = markRaw(instance)
    isReady.value = true
  }

  const render = (xml: string) => {
    lf.value?.render(xml)
  }

  const getGraphData = () => {
    return lf.value?.getGraphData()
  }

  const getXmlData = () => {
    return lf.value?.getGraphData() as string
  }

  const clear = () => {
    lf.value?.clearData()
  }

  const undo = () => lf.value?.undo()
  const redo = () => lf.value?.redo()

  const zoom = (size: number) => lf.value?.zoom(size)
  const resetZoom = () => lf.value?.resetZoom()

  const destroy = () => {
    lf.value?.destroy()
    lf.value = null
    isReady.value = false
  }

  return {
    lf,
    isReady,
    init,
    render,
    getGraphData,
    getXmlData,
    clear,
    undo,
    redo,
    zoom,
    resetZoom,
    destroy,
  }
}
