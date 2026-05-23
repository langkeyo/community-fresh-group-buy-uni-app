import http from '@/utils/request'
import type { Result } from '@/types/response'

export interface QrCodeResp {
  url: string
}

export const generateQrCode = (text: string) => {
  return http.get<Result<QrCodeResp>>('/api/tool/qrcode', {
    params: { text }
  }) as unknown as Promise<Result<QrCodeResp>>
}
