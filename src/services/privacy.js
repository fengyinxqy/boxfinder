/**
 * 隐私授权闸门。
 *
 * 微信基础库 2.32.3+ 提供 `wx.requirePrivacyAuthorize`：调用时若用户尚未同意
 * 《小程序隐私保护指引》，会由微信弹出官方授权弹窗；同意后回调 success。
 * 相比自己实现 `onNeedPrivacyAuthorization`，它不依赖页面里额外的
 * `open-type="agreePrivacyAuthorization"` 按钮，失败路径也更明确。
 *
 * H5 与旧基础库没有该 API 时直接放行，避免把本地功能整个阻断。
 */
export function getPrivacyApi(overrides = {}) {
  if (overrides.api) return overrides.api
  try {
    if (typeof wx !== 'undefined' && wx) return wx
  } catch (error) {
    // 某些构建产物访问未定义全局会抛错，按不可用处理。
  }
  return null
}

/**
 * 返回 { ok, skipped, message }。拒绝授权时 message 是给用户看的可读提示，
 * 调用方据此中止拍照/选图/剪贴板并 toast，不要继续调用隐私接口。
 */
export function ensurePrivacyAuthorized(overrides = {}) {
  const api = getPrivacyApi(overrides)
  return new Promise((resolve) => {
    if (!api || typeof api.requirePrivacyAuthorize !== 'function') {
      resolve({ ok: true, skipped: true, message: '' })
      return
    }
    api.requirePrivacyAuthorize({
      success: () => resolve({ ok: true, skipped: false, message: '' }),
      fail: () =>
        resolve({
          ok: false,
          skipped: false,
          message: '需要同意《用户隐私保护指引》后才能使用照片与备份功能',
        }),
    })
  })
}
