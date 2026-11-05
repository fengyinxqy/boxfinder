import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeUni } from './helpers/fake-uni.js'

let fake

beforeEach(() => {
  fake = createFakeUni()
  vi.resetModules()
})

describe('搬家记录', () => {
  it('创建后重启仍能读到（本地持久化）', async () => {
    const moves = await import('../src/services/moves.js')
    const created = moves.createMove('  我的第一次搬家  ')
    expect(created.name).toBe('我的第一次搬家')
    expect(created.nextBoxNo).toBe(1)

    vi.resetModules()
    const restarted = await import('../src/services/moves.js')
    const list = restarted.listMoves()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(created.id)
  })

  it('名称为空或超长时给出中文校验提示', async () => {
    const moves = await import('../src/services/moves.js')
    expect(() => moves.createMove('   ')).toThrow('请填写搬家名称')
    expect(() => moves.createMove('一'.repeat(21))).toThrow('搬家名称最多 20 个字')
  })

  it('改名会持久化，且不影响箱号游标', async () => {
    const moves = await import('../src/services/moves.js')
    const boxes = await import('../src/services/boxes.js')
    const move = moves.createMove('旧名字')
    boxes.createBox(move.id, { room: '卧室' })
    moves.renameMove(move.id, '新名字')

    vi.resetModules()
    const restarted = await import('../src/services/moves.js')
    expect(restarted.getMove(move.id).name).toBe('新名字')
    expect(restarted.getMove(move.id).nextBoxNo).toBe(2)
  })
})

describe('箱子编号', () => {
  it('按创建顺序从 1 开始编号', async () => {
    const moves = await import('../src/services/moves.js')
    const boxes = await import('../src/services/boxes.js')
    const move = moves.createMove('搬家 A')

    const first = boxes.createBox(move.id, { room: '卧室' })
    const second = boxes.createBox(move.id, { room: '厨房' })

    expect([first.no, second.no]).toEqual([1, 2])
    expect(boxes.boxStats(move.id).nextNo).toBe(3)
  })

  it('删除后不复用编号，重启后继续递增', async () => {
    const moves = await import('../src/services/moves.js')
    const boxes = await import('../src/services/boxes.js')
    const move = moves.createMove('搬家 B')

    const first = boxes.createBox(move.id, { room: '卧室' })
    const second = boxes.createBox(move.id, { room: '厨房' })
    const third = boxes.createBox(move.id, { room: '书房' })

    boxes.deleteBox(second.id)
    const fourth = boxes.createBox(move.id, { room: '阳台' })
    expect(fourth.no).toBe(4)
    expect(fourth.no).not.toBe(second.no)

    vi.resetModules()
    const restartedBoxes = await import('../src/services/boxes.js')
    const fifth = restartedBoxes.createBox(move.id, { room: '客厅' })
    expect(fifth.no).toBe(5)
    expect(restartedBoxes.listBoxes(move.id).map((box) => box.no)).toEqual([1, 3, 4, 5])
    expect(first.no).toBe(1)
    expect(third.no).toBe(3)
  })

  it('删除箱子会级联清理箱内物品', async () => {
    const moves = await import('../src/services/moves.js')
    const boxes = await import('../src/services/boxes.js')
    const db = await import('../src/services/db.js')
    const move = moves.createMove('搬家 C')
    const box = boxes.createBox(move.id, { room: '卧室' })

    // 模拟 M3 写入的物品数据
    db.mutate((draft) => {
      draft.items.push({ id: 'it_1', boxId: box.id, name: '充电器', quantity: 1 })
    })

    boxes.deleteBox(box.id)
    expect(db.loadDb().items).toHaveLength(0)
  })

  it('编辑箱子只改房间和备注，箱号不变', async () => {
    const moves = await import('../src/services/moves.js')
    const boxes = await import('../src/services/boxes.js')
    const move = moves.createMove('搬家 D')
    const box = boxes.createBox(move.id, { room: '卧室', note: '旧备注' })

    boxes.updateBox(box.id, { room: '书房', note: '新备注' })
    const updated = boxes.getBox(box.id)

    expect(updated.no).toBe(box.no)
    expect(updated.room).toBe('书房')
    expect(updated.note).toBe('新备注')
  })
})

describe('示例数据', () => {
  it('重复载入保持幂等', async () => {
    const moves = await import('../src/services/moves.js')
    const seed = await import('../src/services/seed.js')

    expect(seed.seedDemoData()).toEqual({ created: true, boxes: 3 })
    expect(seed.seedDemoData()).toEqual({ created: false, boxes: 0 })
    expect(moves.listMoves()).toHaveLength(1)
  })
})

describe('存储异常', () => {
  it('写入失败时转成可读提示', async () => {
    const storage = await import('../src/services/storage.js')
    fake.api.setStorageSync = () => {
      throw new Error('quota exceeded')
    }
    expect(() => storage.writeRaw('db', {})).toThrow('保存失败，可能是本地存储空间不足')
  })
})
