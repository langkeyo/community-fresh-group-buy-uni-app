import http from '@/utils/request'
import type { Result } from '@/types/response'

// --- 类型定义 ---
export interface UserInfo {
  id: number
  openid: string
  nickname: string
  avatar: string
  mobile: string
  isLeader: boolean
  createTime: string
  updateTime: string
}

export interface LoginResult {
  token: string
  userInfo?: UserInfo
}

// --- 接口定义 (修复重点) ---

export const login = (code: string) => {
  // 🔴 关键修复：添加 'as unknown as Promise<Result<LoginResult>>'
  // 这告诉 TS：别管 luch-request 原本定义的类型了，这里返回的就是 Result 结构！
  return http.post<Result<LoginResult>>(
    '/api/user/login',
    {},
    {
      params: { code }
    }
  ) as unknown as Promise<Result<LoginResult>>
}

export const getUserInfo = () => {
  // 同理修复
  return http.get<Result<UserInfo>>('/api/user/info') as unknown as Promise<
    Result<UserInfo>
  >
}

export const testApi = () => {
  // 同理修复
  return http.get<Result<string>>('/api/user/test') as unknown as Promise<
    Result<string>
  >
}

export const getUserList = () => {
  return http.get<Result<UserInfo[]>>('/api/user/list') as unknown as Promise<
    Result<UserInfo[]>
  >
}
