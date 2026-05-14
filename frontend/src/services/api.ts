import axios from 'axios'
import { useAuthStore } from '../store/auth'

// 开发环境使用代理路径，生产环境使用环境变量
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

// 请求拦截器：添加token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// ===== 类型定义 =====

export interface User {
  id: number
  uuid?: string
  username: string
  name: string
  email?: string
  phone?: string
  role: string
}

export interface Category {
  id: number
  parent_id?: number
  name: string
  label: string
  sort_order: number
  created_at?: string
  children?: Category[]
}

export interface Asset {
  id: number
  uuid: string
  name: string
  code?: string
  category_id?: number
  category?: Category
  spec: string
  location?: string
  quantity: number
  available_quantity: number
  owner?: string
  registered_by: string
  registered_at: string
  image?: string
  created_at: string
  updated_at: string
}

export interface BorrowRecord {
  id: number
  uuid: string
  asset_id: number
  asset_uuid: string
  asset_name?: string
  asset_code?: string
  borrower_name: string
  borrower_email: string
  borrower_phone: string
  quantity: number
  borrow_date: string
  return_date?: string
  status: 'pending' | 'approved' | 'rejected' | 'returned'
  approved_by?: string
  approved_at?: string
  approver_name?: string
  approver_remark?: string
  reject_reason?: string
  remark: string
  created_at: string
  asset?: Asset
}

// ===== API 函数 =====

// 分类
export const categoryAPI = {
  list: () => api.get<Category[]>('/categories'),
  tree: () => api.get<Category[]>('/categories/tree'),
  get: (id: number) => api.get<Category>(`/categories/${id}`),
  create: (data: Partial<Category>) => api.post<Category>('/categories', data),
  update: (id: number, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
  deleteBatch: (ids: number[]) =>
    api.post<{ message: string; affected: number }>('/categories/batch/delete', { ids }),
}

// 资产
export const assetAPI = {
  list: (params?: { page?: number; page_size?: number; keyword?: string; category_id?: number; status?: string }) =>
    api.get<{ items: Asset[]; total: number; page: number }>('/assets', { params }),
  available: () => api.get<{ items: Asset[]; total: number; page: number }>('/assets', { params: { status: 'available' } }),
  get: (id: number) => api.get<Asset>(`/assets/${id}`),
  getByUUID: (uuid: string) => api.get<Asset>(`/assets/uuid/${uuid}`),
  create: (data: Partial<Asset>) => api.post<Asset>('/assets', data),
  update: (id: number, data: Partial<Asset>) => api.put<Asset>(`/assets/${id}`, data),
  delete: (id: number) => api.delete(`/assets/${id}`),
  updateBatch: (data: { ids: number[]; category_id?: number; spec?: string; quantity?: number; owner?: string; location?: string }) =>
    api.put<{ message: string; affected: number }>('/assets/batch', data),
  deleteBatch: (ids: number[]) =>
    api.post<{ message: string; affected: number }>('/assets/batch/delete', { ids }),
}

// 借用记录
export const borrowAPI = {
  list: (params?: { page?: number; page_size?: number; status?: string; keyword?: string }) =>
    api.get<{ items: BorrowRecord[]; total: number; page: number }>('/borrows', { params }),
  pending: () => api.get<BorrowRecord[]>('/borrows/pending'),
  myRecords: (borrowerName: string) => api.get<{ records: BorrowRecord[] }>('/borrows/my-records', { params: { borrower_name: borrowerName } }),
  get: (id: number) => api.get<BorrowRecord>(`/borrows/${id}`),
  create: (data: Partial<BorrowRecord>) => api.post<BorrowRecord>('/borrows', data),
  approve: (id: number) =>
    api.post(`/borrows/${id}/approve`),
  reject: (id: number, reason: string) =>
    api.post(`/borrows/${id}/reject`, { reject_reason: reason }),
  return: (id: number) => api.post(`/borrows/${id}/return`),
  delete: (id: number) => api.delete(`/borrows/${id}`),
  syncOffline: (data: { asset_uuid: string; borrower_name: string; borrower_phone: string; quantity: number; record_time: string }) =>
    api.post('/borrows/sync-offline', data),
}

// 损耗记录
export interface Consumption {
  id: number
  asset_id: number
  asset_uuid: string
  reporter_name: string
  reporter_email: string
  project_name: string
  quantity: number
  consume_date: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  approved_by: string
  approved_at: string
  reject_reason: string
  actual_quantity: number
  project_record: string
  remark: string
  created_at: string
  asset?: Asset
}

export const consumptionAPI = {
  list: (params?: { page?: number; page_size?: number; status?: string; reporter_name?: string }) =>
    api.get<{ items: Consumption[]; total: number; page: number }>('/consumptions', { params }),
  pending: () => api.get<Consumption[]>('/consumptions/pending'),
  myRecords: (name: string) => api.get<{ records: Consumption[] }>('/consumptions/my-records', { params: { name } }),
  get: (id: number) => api.get<Consumption>(`/consumptions/${id}`),
  create: (data: { asset_uuid: string; reporter_name: string; reporter_email?: string; project_name: string; quantity: number; consume_date?: string; remark?: string }) =>
    api.post<Consumption>('/consumptions', data),
  approve: (id: number) => api.post(`/consumptions/${id}/approve`),
  reject: (id: number, reason: string) =>
    api.post(`/consumptions/${id}/reject`, { reject_reason: reason }),
  complete: (id: number, data: { actual_quantity: number; project_record: string; remark?: string }) =>
    api.post(`/consumptions/${id}/complete`, data),
  revoke: (id: number) => api.post(`/consumptions/${id}/revoke`),
  delete: (id: number) => api.delete(`/consumptions/${id}`),
}

// 二维码
export const qrAPI = {
  generate: (uuid: string) => api.get<{ uuid: string; name: string; qr_base64: string }>(`/qr/${uuid}`),
  generateById: (id: number) => api.get<{ uuid: string; name: string; qr_base64: string }>(`/qr/id/${id}`),
  parse: (content: string) => api.post<{ uuid: string; name: string; owner: string; quantity: number }>('/qr/parse', { content }),
  generateBatch: (ids: number[]) => api.post<{
    items: { id: number; uuid: string; name: string; spec?: string; quantity: number; owner?: string; category?: string; qr_base64: string; location?: string }[]
  }>('/qr/batch', { ids }),
  generateBatchBarcode: (ids: number[]) => api.post<{
    items: { id: number; uuid: string; name: string; spec?: string; quantity: number; owner?: string; category?: string; barcode_base64: string; location?: string }[]
  }>('/qr/batch/barcode', { ids }),
}

// 导入
export interface ImportResult {
  success: number
  failed: number
  errors: { row: number; message: string }[]
}

export const importAPI = {
  importAssets: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ImportResult>('/assets/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// 认证
export const authAPI = {
  login: (username: string, password: string) =>
    api.post<{ token: string; user: User; expire_at: string }>('/auth/login', { username, password }),
  visitorRegister: (data: { username: string; name: string; phone?: string; email?: string; password: string }) =>
    api.post<{ token: string; user: User; expire_at: string }>('/auth/visitor-register', data),
  visitorLogin: (name: string, password: string) =>
    api.post<{ token: string; user: User; expire_at: string }>('/auth/visitor-login', { name, password }),
}

// 用户管理
export interface UserListResp {
  items: User[]
  total: number
  page: number
}

export interface CreateUserData {
  username: string
  password: string
  name?: string
  email?: string
  phone?: string
  role?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  phone?: string
  role?: string
}

export const userAPI = {
  list: (params?: { page?: number; page_size?: number; keyword?: string }) =>
    api.get<UserListResp>('/users', { params }),
  get: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: CreateUserData) => api.post<User>('/users', data),
  update: (id: number, data: UpdateUserData) => api.put<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  resetPassword: (id: number) => api.post(`/users/${id}/reset-password`),
}