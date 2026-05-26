<template>
  <div class="bpmn-palette">
    <div class="palette-section">
      <div class="section-title">事件</div>
      <div class="palette-items">
        <div class="palette-item" @mousedown="handleMouseDown($event, 'bpmn:startEvent', '开始事件')">
          <div class="item-icon start-event"></div>
          <span>开始事件</span>
        </div>
        <div class="palette-item" @mousedown="handleMouseDown($event, 'bpmn:endEvent', '结束事件')">
          <div class="item-icon end-event"></div>
          <span>结束事件</span>
        </div>
      </div>
    </div>
    <div class="palette-section">
      <div class="section-title">任务</div>
      <div class="palette-items">
        <div class="palette-item" @mousedown="handleMouseDown($event, 'bpmn:userTask', '用户任务')">
          <div class="item-icon user-task"></div>
          <span>用户任务</span>
        </div>
        <div class="palette-item" @mousedown="handleMouseDown($event, 'bpmn:serviceTask', '系统任务')">
          <div class="item-icon service-task"></div>
          <span>系统任务</span>
        </div>
      </div>
    </div>
    <div class="palette-section">
      <div class="section-title">网关</div>
      <div class="palette-items">
        <div class="palette-item" @mousedown="handleMouseDown($event, 'bpmn:exclusiveGateway', '排他网关')">
          <div class="item-icon exclusive-gateway"></div>
          <span>排他网关</span>
        </div>
        <div class="palette-item" @mousedown="handleMouseDown($event, 'bpmn:parallelGateway', '并行网关')">
          <div class="item-icon parallel-gateway"></div>
          <span>并行网关</span>
        </div>
      </div>
    </div>
    <div class="palette-section">
      <div class="section-title">子流程</div>
      <div class="palette-items">
        <div class="palette-item" @mousedown="handleMouseDown($event, 'bpmn:subProcess', '子流程')">
          <div class="item-icon sub-process"></div>
          <span>子流程</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  lf: any
}>()

const handleMouseDown = (_event: MouseEvent, type: string, text: string) => {
  if (!props.lf) return
  props.lf.dnd.startDrag({
    type,
    text,
  })
}
</script>

<style scoped>
.bpmn-palette {
  width: 180px;
  padding: 12px;
  border-right: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  overflow-y: auto;
}
.palette-section {
  margin-bottom: 16px;
}
.section-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  font-weight: 600;
}
.palette-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: grab;
  font-size: 12px;
  transition: background 0.2s;
  user-select: none;
}
.palette-item:hover {
  background: var(--el-fill-color-light);
}
.palette-item:active {
  cursor: grabbing;
}
.item-icon {
  width: 24px;
  height: 24px;
  border: 2px solid var(--el-color-primary);
  flex-shrink: 0;
}
.start-event {
  border-radius: 50%;
  background: #e8f5e9;
  border-color: #4caf50;
}
.end-event {
  border-radius: 50%;
  background: #ffebee;
  border-color: #f44336;
  border-width: 3px;
}
.user-task {
  border-radius: 4px;
  background: #e3f2fd;
  border-color: #2196f3;
}
.service-task {
  border-radius: 4px;
  background: #f3e5f5;
  border-color: #9c27b0;
}
.exclusive-gateway {
  border-radius: 0;
  background: #fff8e1;
  border-color: #ff9800;
  transform: rotate(45deg);
  width: 20px;
  height: 20px;
}
.parallel-gateway {
  border-radius: 0;
  background: #e0f7fa;
  border-color: #00bcd4;
  transform: rotate(45deg);
  width: 20px;
  height: 20px;
}
.sub-process {
  border-radius: 4px;
  background: #fce4ec;
  border-color: #e91e63;
  width: 28px;
  height: 18px;
  border-style: dashed;
}
</style>
