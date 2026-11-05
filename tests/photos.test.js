import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeUni } from './helpers/fake-uni.js'

beforeEach(() => {
  createFakeUni()
  vi.resetModules()
})

function createFakeFs(overrides = {}) {
  const calls = { copy: [], mkdir: [], unlink: [] }
  return {
    calls,
    mkdirSync: vi.fn((options) => calls.mkdir.push(options && options.dirPath)),
    copyFileSync: vi.fn((from, to) => calls.copy.push({ from, to })),
    unlinkSync: vi.fn((filePath) => {
      calls.unlink.push(filePath)
      if (!overrides.allowUnlink?.includes(filePath)) throw new Error('no such file')
    }),
  }
}

const USER_DATA = '/user/data'

describe('照片临时路径转永久路径', () => {
  it('把临时路径复制到 USER_DATA_PATH 下的 photos 目录', async () => {
    const photos = await import('../src/services/photos.js')
    const fs = createFakeFs({ allowUnlink: [] })

    const result = photos.persistPhoto('wxfile://tmp_abc.jpg', { fs, userDataPath: USER_DATA })

    expect(result.persisted).toBe(true)
    expect(result.copied).toBe(true)
    expect(result.path.startsWith(`${USER_DATA}/photos/`)).toBe(true)
    expect(result.path.endsWith('.jpg')).toBe(true)
    expect(fs.calls.copy).toEqual([{ from: 'wxfile://tmp_abc.jpg', to: result.path }])
    expect(fs.calls.mkdir[0]).toBe(`${USER_DATA}/photos`)
  })

  it('已经是永久路径时不再复制', async () => {
    const photos = await import('../src/services/photos.js')
    const fs = createFakeFs()
    const managed = `${USER_DATA}/photos/photo_1.png`

    const result = photos.persistPhoto(managed, { fs, userDataPath: USER_DATA })

    expect(result).toMatchObject({ path: managed, persisted: true, copied: false })
    expect(fs.calls.copy).toHaveLength(0)
  })

  it('没有文件系统（H5）时保留临时路径并标记未持久化', async () => {
    const photos = await import('../src/services/photos.js')

    const result = photos.persistPhoto('blob:http://localhost/abc', { fs: null, userDataPath: '' })

    expect(result).toEqual({ path: 'blob:http://localhost/abc', persisted: false, copied: false })
  })

  it('没有扩展名时默认保存为 jpg', async () => {
    const photos = await import('../src/services/photos.js')
    const fs = createFakeFs()

    const result = photos.persistPhoto('/tmp/tmp_abc', { fs, userDataPath: USER_DATA })

    expect(result.path.endsWith('.jpg')).toBe(true)
  })

  it('两次保存生成不同文件名，避免互相覆盖', async () => {
    const photos = await import('../src/services/photos.js')
    const fs = createFakeFs()

    const first = photos.persistPhoto('/tmp/a.jpg', { fs, userDataPath: USER_DATA })
    const second = photos.persistPhoto('/tmp/b.jpg', { fs, userDataPath: USER_DATA })

    expect(first.path).not.toBe(second.path)
  })

  it('复制失败时给出可读提示', async () => {
    const photos = await import('../src/services/photos.js')
    const fs = createFakeFs()
    fs.copyFileSync = vi.fn(() => {
      throw new Error('quota exceeded')
    })

    expect(() => photos.persistPhoto('/tmp/a.jpg', { fs, userDataPath: USER_DATA })).toThrow(
      '照片保存失败，请检查存储空间后重试'
    )
  })

  it('空路径直接返回空结果', async () => {
    const photos = await import('../src/services/photos.js')
    const result = photos.persistPhoto('', { fs: createFakeFs(), userDataPath: USER_DATA })
    expect(result).toEqual({ path: '', persisted: false, copied: false })
  })
})

describe('照片清理', () => {
  it('删除时只清理持久化目录内的照片', async () => {
    const photos = await import('../src/services/photos.js')
    const managed = `${USER_DATA}/photos/photo_1.jpg`
    const fs = createFakeFs({ allowUnlink: [managed] })

    expect(photos.removePhoto(managed, { fs, userDataPath: USER_DATA })).toBe(true)
    expect(fs.calls.unlink).toEqual([managed])

    expect(photos.removePhoto('wxfile://tmp_abc.jpg', { fs, userDataPath: USER_DATA })).toBe(false)
    expect(fs.calls.unlink).toHaveLength(1)
  })

  it('文件已不存在时不抛错', async () => {
    const photos = await import('../src/services/photos.js')
    const fs = createFakeFs({ allowUnlink: [] })
    const managed = `${USER_DATA}/photos/photo_gone.jpg`

    expect(() => photos.removePhoto(managed, { fs, userDataPath: USER_DATA })).not.toThrow()
    expect(photos.removePhoto(managed, { fs, userDataPath: USER_DATA })).toBe(true)
  })

  it('空路径不触发文件操作', async () => {
    const photos = await import('../src/services/photos.js')
    const fs = createFakeFs()

    expect(photos.removePhoto('', { fs, userDataPath: USER_DATA })).toBe(false)
    expect(fs.calls.unlink).toHaveLength(0)
  })
})

describe('物品照片字段', () => {
  it('新增与编辑后照片路径随物品持久化', async () => {
    const moves = await import('../src/services/moves.js')
    const boxes = await import('../src/services/boxes.js')
    const items = await import('../src/services/items.js')
    const move = moves.createMove('搬家 G')
    const box = boxes.createBox(move.id, { room: '书房' })

    const created = items.createItem(box.id, { name: '笔记本电脑', photoPath: '/user/data/photos/photo_1.jpg' })
    expect(created.photoPath).toBe('/user/data/photos/photo_1.jpg')

    items.updateItem(created.id, { name: '笔记本电脑', quantity: 1, photoPath: '/user/data/photos/photo_2.jpg' })
    vi.resetModules()
    const restarted = await import('../src/services/items.js')
    expect(restarted.getItem(created.id).photoPath).toBe('/user/data/photos/photo_2.jpg')

    items.updateItem(created.id, { name: '笔记本电脑', quantity: 1, photoPath: '' })
    expect(restarted.getItem(created.id)).toBeTruthy()
    const restartedAgain = await import('../src/services/items.js')
    expect(restartedAgain.getItem(created.id).photoPath).toBe('')
  })
})
