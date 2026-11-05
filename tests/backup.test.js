import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeUni } from './helpers/fake-uni.js'

beforeEach(() => {
  createFakeUni()
  vi.resetModules()
})

async function createFixture() {
  const moves = await import('../src/services/moves.js')
  const boxes = await import('../src/services/boxes.js')
  const items = await import('../src/services/items.js')
  const backup = await import('../src/services/backup.js')

  const move = moves.createMove('我的第一次搬家')
  const bedroom = boxes.createBox(move.id, { room: '卧室' })
  const study = boxes.createBox(move.id, { room: '书房' })
  items.createItem(bedroom.id, { name: '被子', quantity: 2 })
  items.createItem(study.id, { name: '65W 充电器', quantity: 3, photoPath: '/user/data/photos/p1.jpg' })
  items.createItem(study.id, { name: '笔记本电脑' })

  return { move, bedroom, study, moves, boxes, items, backup }
}

describe('备份导出', () => {
  it('包含 schema 版本、导出时间和数量统计', async () => {
    const { backup } = await createFixture()

    const payload = backup.buildBackup(backup.loadBackupDb(), Date.UTC(2026, 10, 5, 1, 2, 3))

    expect(payload.app).toBe('boxfinder')
    expect(payload.schemaVersion).toBe(1)
    expect(payload.exportedAt).toBe('2026-11-05T01:02:03.000Z')
    expect(payload.counts).toEqual({ moves: 1, boxes: 2, items: 3 })
    expect(payload.photoIncluded).toBe(false)
  })

  it('物品不携带照片路径，并标记照片不在备份内', async () => {
    const { backup } = await createFixture()

    const payload = backup.buildBackup(backup.loadBackupDb())
    const charger = payload.items.find((entry) => entry.name === '65W 充电器')

    expect(charger.photoPath).toBeUndefined()
    expect(JSON.stringify(payload)).not.toContain('/user/data/photos')
    expect(payload.notes.join(' ')).toContain('照片')
  })

  it('序列化为可读 JSON 文本', async () => {
    const { backup } = await createFixture()

    const text = backup.serializeBackup(backup.loadBackupDb())

    expect(() => JSON.parse(text)).not.toThrow()
    expect(text).toContain('"schemaVersion": 1')
  })
})

describe('备份恢复', () => {
  it('导出后恢复，数量与关联关系一致', async () => {
    const { backup } = await createFixture()
    const text = backup.serializeBackup(backup.loadBackupDb())

    const result = backup.restoreBackup(text)

    expect(result.counts).toEqual({ moves: 1, boxes: 2, items: 3 })
    const db = backup.loadBackupDb()
    expect(db.moves).toHaveLength(1)
    expect(db.boxes).toHaveLength(2)
    expect(db.items).toHaveLength(3)
    const charger = db.items.find((entry) => entry.name === '65W 充电器')
    const study = db.boxes.find((entry) => entry.room === '书房')
    expect(charger.boxId).toBe(study.id)
    expect(charger.quantity).toBe(3)
  })

  it('恢复会整体替换现有数据，不残留旧记录', async () => {
    const { backup } = await createFixture()
    const text = backup.serializeBackup(backup.loadBackupDb())

    const moves = await import('../src/services/moves.js')
    const extra = moves.createMove('恢复前的临时搬家')
    expect(backup.loadBackupDb().moves).toHaveLength(2)

    backup.restoreBackup(text)

    const db = backup.loadBackupDb()
    expect(db.moves).toHaveLength(1)
    expect(db.moves.some((move) => move.id === extra.id)).toBe(false)
  })

  it('照片路径不会从备份中恢复', async () => {
    const { backup } = await createFixture()
    const text = backup.serializeBackup(backup.loadBackupDb())

    backup.restoreBackup(text)

    expect(backup.loadBackupDb().items.every((item) => item.photoPath === '')).toBe(true)
  })
})

describe('备份校验', () => {
  it('空内容给出可读提示', async () => {
    const { backup } = await createFixture()
    expect(() => backup.restoreBackup('   ')).toThrow('请先粘贴备份内容')
  })

  it('不是 JSON 时给出可读提示，且不覆盖现有数据', async () => {
    const { backup } = await createFixture()
    const before = JSON.stringify(backup.loadBackupDb())

    expect(() => backup.restoreBackup('{ 这不是 json')).toThrow('备份内容不是有效的 JSON')
    expect(JSON.stringify(backup.loadBackupDb())).toBe(before)
  })

  it('不是搬家装箱助手的备份时拒绝', async () => {
    const { backup } = await createFixture()
    const before = JSON.stringify(backup.loadBackupDb())
    const text = JSON.stringify({ app: 'other-app', schemaVersion: 1, moves: [], boxes: [], items: [] })

    expect(() => backup.restoreBackup(text)).toThrow('不是搬家装箱助手的备份文件')
    expect(JSON.stringify(backup.loadBackupDb())).toBe(before)
  })

  it('缺少必要字段时拒绝', async () => {
    const { backup } = await createFixture()
    const before = JSON.stringify(backup.loadBackupDb())
    const text = JSON.stringify({ app: 'boxfinder', schemaVersion: 1, moves: [] })

    expect(() => backup.restoreBackup(text)).toThrow('备份文件缺少')
    expect(JSON.stringify(backup.loadBackupDb())).toBe(before)
  })

  it('版本高于当前版本时拒绝', async () => {
    const { backup } = await createFixture()
    const before = JSON.stringify(backup.loadBackupDb())
    const text = JSON.stringify({ app: 'boxfinder', schemaVersion: 99, moves: [], boxes: [], items: [] })

    expect(() => backup.restoreBackup(text)).toThrow('备份来自更高版本')
    expect(JSON.stringify(backup.loadBackupDb())).toBe(before)
  })

  it('物品指向不存在的箱子时拒绝，原数据不变', async () => {
    const { backup } = await createFixture()
    const before = JSON.stringify(backup.loadBackupDb())
    const payload = backup.buildBackup(backup.loadBackupDb())
    payload.items[0].boxId = 'bx_missing'
    const text = JSON.stringify(payload)

    expect(() => backup.restoreBackup(text)).toThrow('关联')
    expect(JSON.stringify(backup.loadBackupDb())).toBe(before)
  })

  it('箱子指向不存在的搬家时拒绝', async () => {
    const { backup } = await createFixture()
    const payload = backup.buildBackup(backup.loadBackupDb())
    payload.boxes[0].moveId = 'mv_missing'

    expect(() => backup.restoreBackup(JSON.stringify(payload))).toThrow('关联')
  })

  it('重复 ID 时拒绝', async () => {
    const { backup } = await createFixture()
    const payload = backup.buildBackup(backup.loadBackupDb())
    payload.items.push({ ...payload.items[0] })

    expect(() => backup.restoreBackup(JSON.stringify(payload))).toThrow('重复')
  })

  it('物品名称为空时拒绝', async () => {
    const { backup } = await createFixture()
    const payload = backup.buildBackup(backup.loadBackupDb())
    payload.items[0].name = '   '

    expect(() => backup.restoreBackup(JSON.stringify(payload))).toThrow('名称为空')
  })

  it('校验只在落库前发生：坏文件不会写入任何数据', async () => {
    const { backup } = await createFixture()
    const raw = JSON.stringify(backup.loadBackupDb())
    const fakeDb = await import('../src/services/db.js')

    expect(() => backup.restoreBackup('{"app":"boxfinder","schemaVersion":1,"moves":[],"boxes":[{"id":"bx_1","moveId":"mv_x","no":1}],"items":[]}')).toThrow()
    expect(fakeDb.loadDb()).toEqual(JSON.parse(raw))
  })
})
