const DEFAULT_TEMPLATE_IDS = [
  'TPL_GROUP_SUCCESS',
  'TPL_PICKUP_READY',
  'TPL_REFUND_RESULT'
]

function getTemplateIds() {
  const stored = uni.getStorageSync('subscribe_template_ids')
  if (Array.isArray(stored)) {
    return stored.filter((x) => typeof x === 'string' && x.trim())
  }
  return DEFAULT_TEMPLATE_IDS
}

export async function requestOrderSubscribeOnce() {
  const templateIds = getTemplateIds()
  if (!templateIds.length) return

  // #ifdef MP-WEIXIN
  try {
    await new Promise<void>((resolve) => {
      uni.requestSubscribeMessage({
        tmplIds: templateIds,
        success: () => resolve(),
        fail: () => resolve()
      })
    })
  } catch {
    // ignore subscribe failure, do not block order flow
  }
  // #endif
}
