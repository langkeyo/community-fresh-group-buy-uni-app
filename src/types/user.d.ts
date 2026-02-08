// src/types/user.d.ts

/**
 * 对应后端文档中的 User Schema
 */
export interface UserInfo {
  id: number // integer(int64)
  openid: string // string
  nickname: string // string
  avatar: string // string
  mobile: string // string
  isLeader: boolean // boolean
  createTime: string // string(date-time)
  updateTime: string // string(date-time)
  deleted?: number // integer(int32) - 文档里有的字段，咱们也加上
}

/**
 * 对应登录接口返回的 ResultMapStringObject
 * 咱们预判后端 Map 里放的是 token 和 userInfo
 */
export interface LoginResult {
  token: string
  userInfo?: UserInfo
}
