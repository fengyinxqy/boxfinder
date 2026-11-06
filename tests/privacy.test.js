import { describe, expect, it, vi } from 'vitest'

describe('隐私授权闸门', () => {
  it('没有 requirePrivacyAuthorize（H5/旧基础库）时直接放行', async () => {
    const privacy = await import('../src/services/privacy.js')
    const result = await privacy.ensurePrivacyAuthorized({ api: {} })
    expect(result).toEqual({ ok: true, skipped: true, message: '' })
  })

  it('用户同意后返回 ok', async () => {
    const privacy = await import('../src/services/privacy.js')
    const api = {
      requirePrivacyAuthorize: vi.fn(({ success }) => success()),
    }

    await expect(privacy.ensurePrivacyAuthorized({ api })).resolves.toEqual({
      ok: true,
      skipped: false,
      message: '',
    })
    expect(api.requirePrivacyAuthorize).toHaveBeenCalled()
  })

  it('用户拒绝后返回可读提示，调用方据此中止照片/备份', async () => {
    const privacy = await import('../src/services/privacy.js')
    const api = {
      requirePrivacyAuthorize: vi.fn(({ fail }) => fail({ errMsg: 'deny' })),
    }

    const result = await privacy.ensurePrivacyAuthorized({ api })
    expect(result.ok).toBe(false)
    expect(result.message).toContain('隐私保护指引')
  })
})
