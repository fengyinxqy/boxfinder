// manifest.json 同时是 uni-app 的构建配置和开发版的版本号兜底来源：
// 微信只在体验版/正式版返回 miniProgram.version，开发版为空。
import manifest from '../manifest.json'

export const ENV_LABELS = {
  develop: '开发版',
  trial: '体验版',
  release: '正式版',
}

const DEFAULT_ENV = 'develop'

function readMiniProgram(overrides) {
  if (overrides && overrides.miniProgram) return overrides.miniProgram
  try {
    if (typeof uni === 'undefined' || typeof uni.getAccountInfoSync !== 'function') return null
    const info = uni.getAccountInfoSync()
    return (info && info.miniProgram) || null
  } catch (error) {
    console.warn('[appinfo] getAccountInfoSync failed:', error)
    return null
  }
}

/**
 * 版本行文案：`v1.1.0 · 正式版`。
 * 优先微信返回的版本号，开发版为空时退回 manifest.versionName；
 * 环境标签由 envVersion 映射，全部取不到也不留空。
 */
export function resolveAppInfo(overrides = {}) {
  const mini = readMiniProgram(overrides)
  const rawVersion =
    (mini && mini.version) ||
    overrides.versionName ||
    (manifest && manifest.versionName) ||
    '0.0.0'
  const version = String(rawVersion).replace(/^v/i, '').trim() || '0.0.0'

  const envVersion = (mini && mini.envVersion) || overrides.envVersion || DEFAULT_ENV
  const envLabel = ENV_LABELS[envVersion] || ENV_LABELS[DEFAULT_ENV]

  return {
    version,
    envVersion,
    envLabel,
    text: `v${version} · ${envLabel}`,
  }
}
