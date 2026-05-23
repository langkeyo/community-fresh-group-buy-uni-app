const SOUND_ENABLED_KEY = 'app_sound_enabled'
const MINI_NOTIFY_SOUND_SRC = '/static/sounds/notify.wav'

let audioCtx: UniNamespace.InnerAudioContext | null = null
let lastPlayAt = 0

export const isSoundEnabled = (): boolean => {
  const raw = uni.getStorageSync(SOUND_ENABLED_KEY)
  if (raw === '' || raw === null || raw === undefined) return true
  return raw === true || raw === 'true' || raw === 1 || raw === '1'
}

export const setSoundEnabled = (enabled: boolean) => {
  uni.setStorageSync(SOUND_ENABLED_KEY, enabled ? 'true' : 'false')
}

const throttle = (ms = 800): boolean => {
  const now = Date.now()
  if (now - lastPlayAt < ms) return true
  lastPlayAt = now
  return false
}

const ensureAudioContext = () => {
  if (audioCtx) return audioCtx
  audioCtx = uni.createInnerAudioContext()
  audioCtx.autoplay = false
  audioCtx.obeyMuteSwitch = false
  audioCtx.src = MINI_NOTIFY_SOUND_SRC
  return audioCtx
}

const fallbackVibrate = () => {
  uni.vibrateShort({ type: 'light' as any })
}

export const playNoticeSound = () => {
  if (!isSoundEnabled() || throttle()) return
  try {
    const ctx = ensureAudioContext()
    ctx.stop()
    ctx.seek(0)
    ctx.play()
    const onceFail = () => {
      fallbackVibrate()
      ctx.offError(onceFail)
    }
    ctx.onError(onceFail)
  } catch (error) {
    fallbackVibrate()
  }
}

