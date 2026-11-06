import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeFs } from './helpers/fake-fs.js'
import { createFakeUni } from './helpers/fake-uni.js'

const USER_DATA = '/user/data'
const PROFILE_DIR = `${USER_DATA}/profile`

let fake

beforeEach(() => {
  fake = createFakeUni()
  vi.resetModules()
})

function env(fs) {
  return { fs, userDataPath: USER_DATA }
}

describe('资料读写', () => {
  it('从未设置时返回空资料与默认状态', async () => {
    const profile = await import('../src/services/profile.js')
    expect(profile.loadProfile()).toEqual({ nickname: '', avatarPath: '', avatarMissing: false })
  })

  it('昵称与头像路径落独立 key，重启后仍能读到', async () => {
    const profile = await import('../src/services/profile.js')
    const avatarPath = `${PROFILE_DIR}/avatar_1.png`
    profile.saveProfile({ nickname: '  小王  ', avatarPath }, env(createFakeFs({ files: [avatarPath] })))

    expect(fake.data.has('mover:profile')).toBe(true)
    expect(fake.data.has('mover:db')).toBe(false)

    vi.resetModules()
    const restarted = await import('../src/services/profile.js')
    expect(restarted.loadProfile(env(createFakeFs({ files: [avatarPath] })))).toEqual({
      nickname: '小王',
      avatarPath,
      avatarMissing: false,
    })
  })

  it('昵称 trim 后 1–20 字，空值与超长都拒绝', async () => {
    const profile = await import('../src/services/profile.js')
    const fs = createFakeFs()

    expect(() => profile.saveProfile({ nickname: '   ' }, env(fs))).toThrow('请填写昵称')
    expect(() => profile.saveProfile({ nickname: '一'.repeat(21) }, env(fs))).toThrow('昵称最多 20 个字')
    expect(profile.saveProfile({ nickname: '一'.repeat(20) }, env(fs)).nickname).toBe('一'.repeat(20))
  })

  it('临时路径不写进资料', async () => {
    const profile = await import('../src/services/profile.js')
    const saved = profile.saveProfile(
      { nickname: '小王', avatarPath: 'wxfile://tmp_avatar.png' },
      env(createFakeFs())
    )
    expect(saved.avatarPath).toBe('')
  })

  it('历史脏数据不导致读取失败，超长昵称截断', async () => {
    fake.data.set('mover:profile', { nickname: '  一'.repeat(30), avatarPath: null })
    const profile = await import('../src/services/profile.js')
    const loaded = profile.loadProfile()
    expect(loaded.nickname).toHaveLength(20)
    expect(loaded.avatarPath).toBe('')
  })
})

describe('头像文件', () => {
  it('chooseAvatar 的临时文件复制到 USER_DATA_PATH/profile', async () => {
    const profile = await import('../src/services/profile.js')
    const fs = createFakeFs()

    const result = profile.persistAvatar('wxfile://tmp_avatar.png', env(fs))

    expect(result.persisted).toBe(true)
    expect(result.path.startsWith(`${PROFILE_DIR}/avatar_`)).toBe(true)
    expect(result.path.endsWith('.png')).toBe(true)
    expect(fs.calls.mkdir[0]).toEqual({ dirPath: PROFILE_DIR, recursive: true })
    expect(fs.calls.copy).toEqual([{ from: 'wxfile://tmp_avatar.png', to: result.path }])
  })

  it('没有文件系统（H5）时返回未持久化，调用方据此提示', async () => {
    const profile = await import('../src/services/profile.js')
    const result = profile.persistAvatar('blob:http://localhost/a.png', { fs: null, userDataPath: '' })
    expect(result).toEqual({ path: 'blob:http://localhost/a.png', persisted: false, copied: false })
  })

  it('只删除受管头像，重复删除不抛错', async () => {
    const profile = await import('../src/services/profile.js')
    const managed = `${PROFILE_DIR}/avatar_1.png`
    const fs = createFakeFs({ files: [managed] })

    expect(profile.removeAvatar(managed, env(fs))).toBe(true)
    expect(fs.calls.unlink).toEqual([managed])
    expect(() => profile.removeAvatar(managed, env(fs))).not.toThrow()
    expect(profile.removeAvatar('wxfile://tmp.png', env(fs))).toBe(false)
  })

  it('头像文件被手动删除后回默认头像并标记丢失，不抛错', async () => {
    const profile = await import('../src/services/profile.js')
    const missing = `${PROFILE_DIR}/avatar_gone.png`
    fake.data.set('mover:profile', { nickname: '小王', avatarPath: missing })

    const loaded = profile.loadProfile(env(createFakeFs({ files: [] })))
    expect(loaded).toEqual({ nickname: '小王', avatarPath: '', avatarMissing: true })
  })

  it('无法检查文件（无 fs）时不误判为丢失', async () => {
    const profile = await import('../src/services/profile.js')
    const avatarPath = `${PROFILE_DIR}/avatar_1.png`
    fake.data.set('mover:profile', { nickname: '小王', avatarPath })

    const loaded = profile.loadProfile({ fs: null, userDataPath: USER_DATA })
    expect(loaded.avatarPath).toBe(avatarPath)
    expect(loaded.avatarMissing).toBe(false)
  })
})

describe('清除资料', () => {
  it('删除独立 key 与头像目录', async () => {
    const profile = await import('../src/services/profile.js')
    fake.data.set('mover:profile', { nickname: '小王', avatarPath: `${PROFILE_DIR}/avatar_1.png` })
    const fs = createFakeFs({ dirs: [PROFILE_DIR] })

    profile.clearProfile(env(fs))

    expect(fake.data.has('mover:profile')).toBe(false)
    expect(fs.calls.rmdir).toEqual([{ dirPath: PROFILE_DIR, recursive: true }])
  })
})
