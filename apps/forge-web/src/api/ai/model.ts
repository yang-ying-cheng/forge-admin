import request from '@/utils/request'

// 模型配置响应
export interface ModelConfigResponse {
  id: number
  name: string
  provider: string
  modelType: string
  apiKey: string | null
  apiEndpoint: string | null
  maxTokens: number
  temperature: number
  isDefault: boolean
  status: number // 0: 禁用, 1: 启用, 2: 连接异常
  createTime: string
  updateTime: string
}

// 模型配置请求
export interface ModelConfigRequest {
  apiKey?: string
  apiEndpoint?: string
  maxTokens?: number
  temperature?: number
}

// 模型切换请求
export interface ModelSwitchRequest {
  modelId: number
}

export const modelApi = {
  // 获取模型列表
  list: () =>
    request.get<ModelConfigResponse[]>('/ai/model/list'),

  // 配置模型
  config: (id: number, data: ModelConfigRequest) =>
    request.put<ModelConfigResponse>(`/ai/model/${id}/config`, data),

  // 设为默认模型
  switch: (id: number) =>
    request.put<ModelConfigResponse>(`/ai/model/${id}/default`),

  // 刷新模型状态
  refreshStatus: (id: number) =>
    request.post<ModelConfigResponse>(`/ai/model/${id}/refresh`),

  // 批量刷新状态
  refreshAll: () =>
    request.post<ModelConfigResponse[]>('/ai/model/refresh-all')
}

// 导出独立函数
export const getModelList = () => modelApi.list().then(res => res.data)
export const configModel = (id: number, data: ModelConfigRequest) =>
  modelApi.config(id, data).then(res => res.data)
export const switchModel = (id: number) => modelApi.switch(id).then(res => res.data)
export const refreshModelStatus = (id: number) =>
  modelApi.refreshStatus(id).then(res => res.data)
export const refreshAllModels = () => modelApi.refreshAll().then(res => res.data)