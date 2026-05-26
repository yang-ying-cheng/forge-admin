/**
 * form-create 工具函数
 * 参考 shi9 的 formCreate 工具函数设计
 */

/** 编码表单配置 */
export function encodeConf(designer: any): string {
  return JSON.stringify(designer.getOption())
}

/** 编码表单字段 */
export function encodeFields(designer: any): string {
  const rule = designer.getJson()
  const rules = typeof rule === 'string' ? JSON.parse(rule) : rule
  return JSON.stringify(rules.map((r: any) => JSON.stringify(r)))
}

/** 解码表单字段 */
export function decodeFields(fields: string): any[] {
  if (!fields) return []
  try {
    const arr = JSON.parse(fields)
    return arr.map((f: string) => typeof f === 'string' ? JSON.parse(f) : f)
  } catch {
    return []
  }
}

/** 加载表单配置和字段到 form-create 组件 */
export function setConfAndFields(
  target: any,
  conf: string,
  fields: string,
  value?: Record<string, any>
) {
  if (!target) return
  const decodedFields = decodeFields(fields)
  if (conf) {
    try {
      target.setOption(JSON.parse(conf))
    } catch { /* ignore */ }
  }
  target.setRule(decodedFields)
  if (value) {
    Object.keys(value).forEach(key => {
      target.setValue(key, value[key])
    })
  }
}
