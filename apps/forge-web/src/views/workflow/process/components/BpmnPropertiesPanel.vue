<template>
  <div class="bpmn-properties-panel">
    <div v-if="!selectedNode" class="empty-tip">
      <el-empty description="请选择一个节点" :image-size="60" />
    </div>
    <div v-else class="properties-form">
      <h4 class="panel-title">{{ nodeTypeLabel }}</h4>
      <el-form label-width="80px" size="small">
        <el-form-item label="节点ID">
          <el-input :model-value="selectedNode.id" disabled />
        </el-form-item>
        <el-form-item label="节点名称">
          <el-input v-model="formData.name" @change="handleNameChange" />
        </el-form-item>
        <template v-if="isTaskNode">
          <el-form-item label="受理人">
            <el-input v-model="formData.assignee" placeholder="如: ${initiator}" @change="handlePropertyChange" />
          </el-form-item>
          <el-form-item label="候选用户">
            <el-input v-model="formData.candidateUsers" placeholder="多个用逗号分隔" @change="handlePropertyChange" />
          </el-form-item>
          <el-form-item label="候选组">
            <el-input v-model="formData.candidateGroups" placeholder="角色ID,多个用逗号分隔" @change="handlePropertyChange" />
          </el-form-item>
          <el-form-item label="表单标识">
            <el-input v-model="formData.formKey" @change="handlePropertyChange" />
          </el-form-item>
        </template>
        <template v-if="isSequenceFlow">
          <el-form-item label="条件表达式">
            <el-input v-model="formData.conditionExpression" type="textarea" :rows="2" placeholder="${approved == true}" @change="handlePropertyChange" />
          </el-form-item>
        </template>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type LogicFlow from '@logicflow/core'

const props = defineProps<{
  lf: LogicFlow | null
}>()

const selectedNode = ref<any>(null)

const nodeTypeMap: Record<string, string> = {
  'bpmn:startEvent': '开始事件',
  'bpmn:endEvent': '结束事件',
  'bpmn:userTask': '用户任务',
  'bpmn:serviceTask': '系统任务',
  'bpmn:exclusiveGateway': '排他网关',
  'bpmn:parallelGateway': '并行网关',
  'bpmn:inclusiveGateway': '包容网关',
  'bpmn:subProcess': '子流程',
  'bpmn:sequenceFlow': '顺序流',
  'bpmn:boundaryEvent': '边界事件',
  'bpmn:intermediateCatchEvent': '中间捕获事件',
}

const nodeTypeLabel = computed(() => nodeTypeMap[selectedNode.value?.type] || selectedNode.value?.type || '')
const isTaskNode = computed(() => ['bpmn:userTask', 'bpmn:serviceTask'].includes(selectedNode.value?.type))
const isSequenceFlow = computed(() => selectedNode.value?.type === 'bpmn:sequenceFlow')

const formData = ref({
  name: '',
  assignee: '',
  candidateUsers: '',
  candidateGroups: '',
  formKey: '',
  conditionExpression: '',
})

const handleNameChange = () => {
  if (!props.lf || !selectedNode.value) return
  props.lf.updateText(selectedNode.value.id, formData.value.name)
}

const handlePropertyChange = () => {
  if (!props.lf || !selectedNode.value) return
  props.lf.setProperties(selectedNode.value.id, {
    ...selectedNode.value.properties,
    assignee: formData.value.assignee,
    candidateUsers: formData.value.candidateUsers,
    candidateGroups: formData.value.candidateGroups,
    formKey: formData.value.formKey,
    conditionExpression: formData.value.conditionExpression,
  })
}

watch(
  () => props.lf,
  (lf) => {
    if (!lf) return
    lf.on('node:click', ({ data }: any) => {
      selectedNode.value = data
      loadFormData(data)
    })
    lf.on('edge:click', ({ data }: any) => {
      selectedNode.value = data
      loadFormData(data)
    })
    lf.on('blank:click', () => {
      selectedNode.value = null
    })
  },
  { immediate: true },
)

const loadFormData = (data: any) => {
  const nodeProps = data.properties || {}
  formData.value = {
    name: data.text?.value || data.text || '',
    assignee: nodeProps.assignee || '',
    candidateUsers: nodeProps.candidateUsers || '',
    candidateGroups: nodeProps.candidateGroups || '',
    formKey: nodeProps.formKey || '',
    conditionExpression: nodeProps.conditionExpression || '',
  }
}
</script>

<style scoped>
.bpmn-properties-panel {
  width: 280px;
  border-left: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  overflow-y: auto;
}
.empty-tip {
  padding: 40px 20px;
}
.panel-title {
  padding: 12px 16px;
  margin: 0;
  border-bottom: 1px solid var(--el-border-color-light);
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.properties-form {
  padding: 16px;
}
</style>
