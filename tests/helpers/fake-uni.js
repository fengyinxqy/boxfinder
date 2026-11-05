import { vi } from 'vitest'

/**
 * 模拟 uni 的同步 storage API。
 * 传入同一份 data 可模拟“关闭后重新打开”仍然读到旧数据。
 */
export function createFakeUni(initial = {}) {
  const data = new Map(
    Object.entries(initial).map(([key, value]) => [key, JSON.parse(JSON.stringify(value))])
  )

  const api = {
    getStorageSync(key) {
      if (!data.has(key)) return ''
      return JSON.parse(JSON.stringify(data.get(key)))
    },
    setStorageSync(key, value) {
      data.set(key, JSON.parse(JSON.stringify(value)))
    },
    removeStorageSync(key) {
      data.delete(key)
    },
    getStorageInfoSync() {
      return { keys: [...data.keys()], currentSize: 1, limitSize: 10240 }
    },
  }

  vi.stubGlobal('uni', api)
  return { data, api }
}
