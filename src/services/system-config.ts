import { getSystemConfigApi } from '@/api/system-config'
import { systemConfigSchema } from '@/schemas/system-config'
import type { SystemConfig } from '@/types/system-config'

const fallbackConfig: SystemConfig = {
  noticeText: '欢迎来到社区团购，今天也有新鲜直供好货。',
  servicePhone: '400-800-1234',
  serviceWechat: 'ligo-service',
  serviceHours: '09:00-22:00',
  serviceTerms: '服务条款：当前版本为毕业设计演示环境，支付流程为模拟链路。'
}

export async function getSystemConfig(): Promise<SystemConfig> {
  try {
    const res = await getSystemConfigApi()
    const parsed = systemConfigSchema.safeParse(res.data ?? {})
    if (!parsed.success) {
      return fallbackConfig
    }
    return {
      ...fallbackConfig,
      ...parsed.data
    }
  } catch (error) {
    return fallbackConfig
  }
}
