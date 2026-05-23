<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { getNoticeList } from '@/services/notice'
import { notifyInfo } from '@/utils/notify'
import { playNoticeSound } from '@/utils/sound'

const NOTICE_POPUP_MARK_KEY = 'notice_popup_last_key'
const NOTICE_POLL_INTERVAL = 20000
const NOTICE_REPEAT_AFTER_MS = 10 * 60 * 1000
let noticeTimer: ReturnType<typeof setInterval> | null = null
let checkingNotice = false
let appVisible = false

function getCurrentUserId(): number {
  const token = uni.getStorageSync('token')
  if (!token) return 0
  const storedUser = uni.getStorageSync('userInfo')
  const user = storedUser
    ? typeof storedUser === 'string'
      ? JSON.parse(storedUser)
      : storedUser
    : null
  const userId = Number(user?.id || 0)
  return Number.isFinite(userId) && userId > 0 ? userId : 0
}

async function checkNoticeAndPopup() {
  if (!appVisible || checkingNotice) return
  const userId = getCurrentUserId()
  if (!userId) return
  checkingNotice = true
  try {
    const notices = await getNoticeList(userId)
    const unread = notices.filter((x) => !x.read)
    if (!unread.length) return

    const top = unread[0]
    const markKey = `${userId}_${top.id}`
    const lastRaw = uni.getStorageSync(NOTICE_POPUP_MARK_KEY)
    const now = Date.now()
    let allow = true
    if (lastRaw && typeof lastRaw === 'object') {
      const lastKey = String((lastRaw as any).key || '')
      const lastAt = Number((lastRaw as any).at || 0)
      if (lastKey === markKey && now - lastAt < NOTICE_REPEAT_AFTER_MS) {
        allow = false
      }
    } else {
      const legacy = String(lastRaw || '')
      if (legacy === markKey) {
        allow = false
      }
    }
    if (!allow) return
    uni.setStorageSync(NOTICE_POPUP_MARK_KEY, { key: markKey, at: now })
    showNoticeToast(top.title || '新通知', top.content || '您有一条新通知')
  } catch (error) {
    // 忽略通知异常，不阻断主流程
  } finally {
    checkingNotice = false
  }
}

function showNoticeToast(title: string, content: string) {
  notifyInfo(`${title}：${content}`, '新通知')
  playNoticeSound()
}

function startNoticePolling() {
  if (noticeTimer) return
  noticeTimer = setInterval(() => {
    checkNoticeAndPopup()
  }, NOTICE_POLL_INTERVAL)
}

function stopNoticePolling() {
  if (!noticeTimer) return
  clearInterval(noticeTimer)
  noticeTimer = null
}

onLaunch(() => {
  console.log('App Launch')
})
onShow(async () => {
  appVisible = true
  await checkNoticeAndPopup()
  startNoticePolling()
})
onHide(() => {
  appVisible = false
  stopNoticePolling()
  console.log('App Hide')
})
</script>
<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

page {
  @apply bg-gray-50;
  animation: pageFadeIn 0.25s ease;
  font-family: Inter, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC',
    'Source Han Sans SC', sans-serif;
  text-rendering: optimizeLegibility;
}

:root {
  --safe-bottom: env(safe-area-inset-bottom);
  --bottom-bar-gap-rpx: 16rpx;
}

.safe-bottom-padding {
  padding-bottom: calc(var(--safe-bottom) + var(--bottom-bar-gap-rpx));
}

.base-input {
  padding: 0 20rpx;
  height: 72rpx;
  line-height: 72rpx;
  box-sizing: border-box;
}

.base-input--search {
  padding: 0 24rpx;
  height: 96rpx;
  line-height: 96rpx;
}

.base-field__control {
  padding: 0;
}

.base-field__text {
  padding: 16rpx 20rpx;
  display: block;
}

@keyframes pageFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Disable uview injected root toast host; we use custom top-message host instead. */
ku-root-toast-host {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
}

</style>
