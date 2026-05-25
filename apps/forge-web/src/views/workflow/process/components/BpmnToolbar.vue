<template>
  <div class="bpmn-toolbar">
    <div class="toolbar-left">
      <el-button-group>
        <el-button size="small" @click="emit('undo')">
          <el-icon><RefreshLeft /></el-icon>撤销
        </el-button>
        <el-button size="small" @click="emit('redo')">
          <el-icon><RefreshRight /></el-icon>重做
        </el-button>
      </el-button-group>
    </div>
    <div class="toolbar-center">
      <el-button-group>
        <el-button size="small" @click="emit('zoomOut')">
          <el-icon><ZoomOut /></el-icon>
        </el-button>
        <el-button size="small" @click="emit('resetZoom')">适应</el-button>
        <el-button size="small" @click="emit('zoomIn')">
          <el-icon><ZoomIn /></el-icon>
        </el-button>
      </el-button-group>
    </div>
    <div class="toolbar-right">
      <el-button size="small" @click="emit('clear')">
        <el-icon><Delete /></el-icon>清空
      </el-button>
      <el-button type="primary" size="small" @click="emit('save')">
        <el-icon><Check /></el-icon>保存
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'save'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'zoomIn'): void
  (e: 'zoomOut'): void
  (e: 'resetZoom'): void
  (e: 'clear'): void
}>()
</script>

<style scoped>
.bpmn-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}
.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
