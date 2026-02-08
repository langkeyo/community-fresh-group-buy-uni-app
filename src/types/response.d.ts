// src/types/response.d.ts

// 1. 通用响应结构 (根据你的 OpenAPI 文档)
export interface Result<T = any> {
  code: number // 0 表示成功
  message: string // 错误信息
  data: T // 具体数据
  timestamp: number
}

// 2. 分页数据结构 (预留，后面肯定会用到)
export interface PageResult<T = any> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}
