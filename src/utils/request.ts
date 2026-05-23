// src/utils/request.ts
import Request from 'luch-request'
import type { HttpResponse } from 'luch-request' // 引入类型
import type { Result } from '@/types/response'
import { notifyError } from '@/utils/notify'

const http = new Request()
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'https://localhost:8080'

http.setConfig((config) => {
  config.baseURL = API_BASE_URL
  config.timeout = 10000
  config.header = {
    ...config.header,
    'Content-Type': 'application/json'
  }
  return config
})

http.interceptors.request.use(
  (config) => {
    const token = uni.getStorageSync('token')
    if (token) {
      config.header = {
        ...config.header,
        Authorization: token
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// --- 🔴 这里是修复重点 ---
http.interceptors.response.use(
  (response: HttpResponse) => {
    const res = response.data as Result
    const silentError = Boolean((response as any)?.config?.custom?.silentError)

    if (res.code === 200) {
      // 报错1修复：强制转换为 any，因为我们改变了 luch-request 默认的返回结构
      // 这样前端拿到 http.get() 的结果直接就是 Result 对象，而不是 { data: Result, ... }
      return res as any
    }

    if (!silentError) {
      handleErrorStatus(res.code, res.message)
    }
    return Promise.reject(res)
  },
  (error) => {
    const statusCode = error.statusCode
    const silentError = Boolean((error as any)?.config?.custom?.silentError)
    if (!silentError) {
      handleErrorStatus(statusCode as number, '网络请求异常')
    }
    return Promise.reject(error)
  }
)

const handleErrorStatus = (code: number, msg: string) => {
  let message = msg || '请求失败'
  if (code === 401) {
    message = '登录已过期'
    uni.removeStorageSync('token')
  } else if (code === 500) {
    // 对业务性 500（如权限/绑定提示）优先展示后端原始文案
    message = msg || '服务器内部错误'
  } else if (code === 404) {
    message = '接口不存在'
  }
  notifyError(message)
}

export default http
