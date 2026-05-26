<template>
  <div class="form-schema-editor">
    <div v-for="(field, index) in fields" :key="index" class="field-row">
      <el-input v-model="field.key" placeholder="字段Key" style="width: 90px" @change="handleChange" />
      <el-input v-model="field.label" placeholder="标签" style="width: 90px" @change="handleChange" />
      <el-select v-model="field.type" style="width: 100px" @change="handleChange">
        <el-option label="文本" value="text" />
        <el-option label="数字" value="number" />
        <el-option label="下拉" value="select" />
        <el-option label="日期" value="date" />
        <el-option label="多行" value="textarea" />
      </el-select>
      <el-checkbox v-model="field.required" @change="handleChange">必填</el-checkbox>
      <el-input
        v-if="field.type === 'select'"
        v-model="field.options"
        placeholder="选项,逗号分隔"
        style="width: 120px"
        @change="handleChange"
      />
      <el-button type="danger" link @click="removeField(index)">
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>
    <el-button type="primary" link @click="addField">
      <el-icon><Plus /></el-icon>添加字段
    </el-button>
  </div>
</template>

<script setup lang="ts">
interface FormField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'textarea'
  required: boolean
  options?: string
}

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const fields = ref<FormField[]>([])

const parseValue = (val: string) => {
  if (!val) {
    fields.value = []
    return
  }
  try {
    fields.value = JSON.parse(val)
  } catch {
    fields.value = []
  }
}

watch(() => props.modelValue, parseValue, { immediate: true })

const handleChange = () => {
  emit('update:modelValue', JSON.stringify(fields.value))
}

const addField = () => {
  fields.value.push({ key: '', label: '', type: 'text', required: false })
  handleChange()
}

const removeField = (index: number) => {
  fields.value.splice(index, 1)
  handleChange()
}
</script>

<style scoped>
.form-schema-editor {
  width: 100%;
}
.field-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}
</style>
