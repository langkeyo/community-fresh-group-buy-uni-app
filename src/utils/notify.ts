export type AppToastType = 'success' | 'error' | 'info'

export interface AppToastPayload {
  title?: string
  content: string
  type?: AppToastType
  duration?: number
  icon?: string
  expandable?: boolean
  maxLines?: 1 | 2 | 3
}

export const APP_TOP_MESSAGE_EVENT = 'app:top-message'
const PENDING_TOP_MESSAGE_KEY = '__pendingTopMessages'

const pushPending = (payload: AppToastPayload) => {
  const u = uni as any
  const list = Array.isArray(u[PENDING_TOP_MESSAGE_KEY]) ? u[PENDING_TOP_MESSAGE_KEY] : []
  list.push(payload)
  u[PENDING_TOP_MESSAGE_KEY] = list
}

export const emitAppToast = (payload: AppToastPayload) => {
  if ((uni as any).__topMessageReady) {
    uni.$emit(APP_TOP_MESSAGE_EVENT, payload)
    return
  }
  pushPending(payload)
}

export const notifySuccess = (content: string, title = '操作成功') => {
  emitAppToast({ title, content, type: 'success' })
}

export const notifyError = (content: string, title = '提示') => {
  emitAppToast({ title, content, type: 'error' })
}

export const notifyInfo = (content: string, title = '提示') => {
  emitAppToast({ title, content, type: 'info' })
}

export const notifyCustom = (payload: AppToastPayload) => {
  emitAppToast(payload)
}
