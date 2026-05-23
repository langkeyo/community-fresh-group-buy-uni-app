import type { Result } from '@/types/response'

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'https://localhost:8080'

export function uploadAvatar(filePath: string): Promise<Result<{ url: string }>> {
  return uploadBizFile(filePath, 'avatar')
}

export function uploadBizFile(
  filePath: string,
  bizType: 'avatar' | 'realname' | 'license' | 'face'
): Promise<Result<{ url: string }>> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.uploadFile({
      url: `${API_BASE_URL}/api/file/upload`,
      filePath,
      name: 'file',
      formData: {
        bizType,
        uploader: 'miniapp-user'
      },
      header: token ? { Authorization: token } : {},
      success: (res) => {
        try {
          const data = JSON.parse(res.data || '{}') as Result<{ url: string }>
          if (data.code === 0 || data.code === 200) {
            resolve(data)
            return
          }
          reject(new Error(data.message || '上传失败'))
        } catch (error) {
          reject(new Error('上传结果解析失败'))
        }
      },
      fail: (error) => {
        reject(error)
      }
    })
  })
}
