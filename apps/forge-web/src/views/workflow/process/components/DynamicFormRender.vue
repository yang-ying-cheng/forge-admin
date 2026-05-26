<template>
  <el-form label-width="100px" size="default">
    <el-form-item
      v-for="field in parsedSchema"
      :key="field.key"
      :label="field.label"
      :required="field.required"
    >
      <el-input
        v-if="field.type === 'text'"
        v-model="formValues[field.key]"
        @input="handleChange"
      />
      <el-input-number
        v-else-if="field.type === 'number'"
        v-model="formValues[field.key]"
        style="width: 100%"
        @change="handleChange"
      />
      <el-select
        v-else-if="field.type === 'select'"
        v-model="formValues[field.key]"
        style="width: 100%"
        @change="handleChange"
      >
        <el-option
          v-for="opt in getOptions(field.options)"
          :key="opt"
          :label="opt"
          :value="opt"
        />
      </el-select>
      <el-date-picker
        v-else-if="field.type === 'date'"
        v-model="formValues[field.key]"
        type="date"
        value-format="YYYY-MM-DD"
        style="width: 100%"
        @change="handleChange"
      />
      <el-input
        v-else-if="field.type === 'textarea'"
        v-model="formValues[field.key]"
        type="textarea"
        :rows="3"
        @input="handleChange"
      />
    </el-form-item>
  </el-form>
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
  schema: string
  modelValue: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
}>()

const parsedSchema = computed<FormField[]>(() => {
  if (!props.schema) return []
  try {
    return JSON.parse(props.schema)
  } catch {
    return []
  }
})

const formValues = ref<Record<string, any>>({})

watch(() => props.modelValue, (val) => {
  formValues.value = { ...val }
}, { immediate: true, deep: true })

watch(parsedSchema, (schema) => {
  // 初始化缺失的字段默认值
  schema.forEach(field => {
    if (formValues.value[field.key] === undefined) {
      formValues.value[field.key] = field.type === 'number' ? undefined : ''
    }
  })
}, { immediate: true })

const handleChange = () => {
  emit('update:modelValue', { ...formValues.value })
}

const getOptions = (options?: string): string[] => {
  if (!options) return []
  return options.split(',').map(s => s.trim()).filter(Boolean)
}
</script>
