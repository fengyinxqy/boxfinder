import { StorageError } from '../utils/errors.js'

const KEY_PREFIX = 'mover:'

export function fullKey(key) {
  return `${KEY_PREFIX}${key}`
}

/** 读取原始数据；从未写入时返回 fallback。读取异常向上抛，避免静默丢数据。 */
export function readRaw(key, fallback = null) {
  try {
    const value = uni.getStorageSync(fullKey(key))
    if (value === '' || value === undefined || value === null) return fallback
    return value
  } catch (error) {
    console.error('[storage] read failed:', key, error)
    throw new StorageError('读取本地数据失败，请稍后重试', error)
  }
}

/** 写入原始数据；微信端超出配额会抛错，这里转成可读提示。 */
export function writeRaw(key, value) {
  try {
    uni.setStorageSync(fullKey(key), value)
  } catch (error) {
    console.error('[storage] write failed:', key, error)
    throw new StorageError('保存失败，可能是本地存储空间不足', error)
  }
}

export function removeRaw(key) {
  try {
    uni.removeStorageSync(fullKey(key))
  } catch (error) {
    console.error('[storage] remove failed:', key, error)
    throw new StorageError('清理本地数据失败', error)
  }
}

export function getStorageUsage() {
  try {
    const info = uni.getStorageInfoSync()
    return {
      currentSize: info.currentSize || 0,
      limitSize: info.limitSize || 0,
    }
  } catch (error) {
    console.warn('[storage] getStorageInfoSync failed:', error)
    return { currentSize: 0, limitSize: 0 }
  }
}
