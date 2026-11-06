import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeUni } from './helpers/fake-uni.js'

let fake

beforeEach(() => {
  fake = createFakeUni()
  vi.resetModules()
})

describe('版本行', () => {
  it('正式版优先使用微信返回的版本号', async () => {
    const appinfo = await import('../src/services/appinfo.js')
    const info = appinfo.resolveAppInfo({ miniProgram: { version: '1.2.3', envVersion: 'release' } })

    expect(info.version).toBe('1.2.3')
    expect(info.text).toBe('v1.2.3 · 正式版')
  })

  it('体验版标签为「体验版」，并去掉可能的前缀 v', async () => {
    const appinfo = await import('../src/services/appinfo.js')
    expect(appinfo.resolveAppInfo({ miniProgram: { version: 'v1.2.3', envVersion: 'trial' } }).text).toBe(
      'v1.2.3 · 体验版'
    )
  })

  it('开发版没有版本号时退回 manifest.versionName，不留空', async () => {
    const appinfo = await import('../src/services/appinfo.js')
    const info = appinfo.resolveAppInfo({ miniProgram: { version: '', envVersion: 'develop' } })

    expect(info.version).toBe('1.0.0')
    expect(info.text).toBe('v1.0.0 · 开发版')
  })

  it('getAccountInfoSync 不可用或抛错时也给出可用版本行', async () => {
    const appinfo = await import('../src/services/appinfo.js')
    fake.api.getAccountInfoSync = () => {
      throw new Error('not supported')
    }

    expect(appinfo.resolveAppInfo().text).toBe('v1.0.0 · 开发版')
  })

  it('未知环境标签按开发版处理', async () => {
    const appinfo = await import('../src/services/appinfo.js')
    expect(appinfo.resolveAppInfo({ miniProgram: { version: '1.0.0', envVersion: 'unknown' } }).envLabel).toBe(
      '开发版'
    )
  })
})
