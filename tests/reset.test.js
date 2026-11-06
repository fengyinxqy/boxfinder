import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeFs } from './helpers/fake-fs.js'
import { createFakeUni } from './helpers/fake-uni.js'

const USER_DATA = '/user/data'

let fake

beforeEach(() => {
  fake = createFakeUni()
  vi.resetModules()
})

describe('清除全部本地数据', () => {
  it('清空整库与资料 key，并删除照片、头像目录', async () => {
    const moves = await import('../src/services/moves.js')
    const profile = await import('../src/services/profile.js')
    const reset = await import('../src/services/reset.js')

    const avatar = `${USER_DATA}/profile/avatar_1.png`
    moves.createMove('搬家 A')
    profile.saveProfile({ nickname: '小王', avatarPath: avatar }, { fs: createFakeFs({ files: [avatar] }), userDataPath: USER_DATA })

    const fs = createFakeFs()
    reset.clearAllLocalData({ fs, userDataPath: USER_DATA })

    expect(fake.data.has('mover:db')).toBe(false)
    expect(fake.data.has('mover:profile')).toBe(false)
    expect(fs.calls.rmdir).toEqual([
      { dirPath: `${USER_DATA}/photos`, recursive: true },
      { dirPath: `${USER_DATA}/profile`, recursive: true },
    ])
  })

  it('清除后重新读库为空，重启也不会恢复', async () => {
    const moves = await import('../src/services/moves.js')
    const boxes = await import('../src/services/boxes.js')
    const reset = await import('../src/services/reset.js')

    const move = moves.createMove('搬家 B')
    boxes.createBox(move.id, { room: '卧室' })
    reset.clearAllLocalData({ fs: null, userDataPath: '' })

    vi.resetModules()
    const db = await import('../src/services/db.js')
    expect(db.loadDb()).toEqual({ schemaVersion: 1, moves: [], boxes: [], items: [] })
  })

  it('没有文件系统时仍然清除存储数据', async () => {
    const moves = await import('../src/services/moves.js')
    const reset = await import('../src/services/reset.js')
    moves.createMove('搬家 C')

    reset.clearAllLocalData({ fs: null, userDataPath: '' })

    const db = await import('../src/services/db.js')
    expect(db.loadDb().moves).toHaveLength(0)
  })
})
