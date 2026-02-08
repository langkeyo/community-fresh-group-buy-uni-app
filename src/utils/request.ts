// src/utils/request.ts
import Request from 'luch-request'
import type { HttpResponse } from 'luch-request' // 引入类型
import type { Result } from '@/types/response'

const http = new Request()

http.setConfig((config) => {
  config.baseURL = 'http://localhost:8080'
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

    if (res.code === 200) {
      // 报错1修复：强制转换为 any，因为我们改变了 luch-request 默认的返回结构
      // 这样前端拿到 http.get() 的结果直接就是 Result 对象，而不是 { data: Result, ... }
      return res as any
    }

    handleErrorStatus(res.code, res.message)
    return Promise.reject(res)
  },
  (error) => {
    const statusCode = error.statusCode
    handleErrorStatus(statusCode as number, '网络请求异常')
    return Promise.reject(error)
  }
)

const handleErrorStatus = (code: number, msg: string) => {
  let message = msg || '请求失败'
  if (code === 401) {
    message = '登录已过期'
    uni.removeStorageSync('token')
  } else if (code === 500) {
    message = '服务器内部错误'
  } else if (code === 404) {
    message = '接口不存在'
  }
  uni.showToast({ title: message, icon: 'none', duration: 2000 })
}

export default http
