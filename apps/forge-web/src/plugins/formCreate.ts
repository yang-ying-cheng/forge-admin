import type { App } from 'vue'
import formCreate from '@form-create/element-ui'
import FcDesigner from '@form-create/designer'
import install from '@form-create/element-ui/auto-import'

/**
 * 注册 form-create 表单设计器插件
 */
export function setupFormCreate(app: App<Element>) {
  formCreate.use(install)
  app.use(formCreate)
  app.use(FcDesigner)
}
