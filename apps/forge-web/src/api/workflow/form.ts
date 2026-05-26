import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

export interface WfForm {
  id: number
  name: string
  status: number
  conf: string
  fields: string
  remark: string
  createTime: string
  updateTime: string
}

export interface WfFormSimple {
  id: number
  name: string
}

export interface FormQuery {
  pageNum: number
  pageSize: number
  name?: string
  status?: number
}

export interface FormRequest {
  id?: number
  name: string
  status?: number
  conf?: string
  fields?: string
  remark?: string
}

export const formApi = {
  page: (params: FormQuery) =>
    request.get<PageResult<WfForm>>('/workflow/form/list', { params }).then(res => res.data),
  listAll: () =>
    request.get<WfFormSimple[]>('/workflow/form/all').then(res => res.data),
  getById: (id: number) =>
    request.get<WfForm>(`/workflow/form/${id}`).then(res => res.data),
  add: (data: FormRequest) =>
    request.post('/workflow/form', data),
  update: (data: FormRequest) =>
    request.put('/workflow/form', data),
  delete: (ids: number[]) =>
    request.delete('/workflow/form', { data: ids }),
}
