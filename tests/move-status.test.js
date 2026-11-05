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

  const move = moves.createMove('我的第一次搬家')
  const bedroom = boxes.createBox(move.id, { room: '卧室' })
  const kitchen = boxes.createBox(move.id, { room: '厨房' })
  const study = boxes.createBox(move.id, { room: '书房' })

  return { move, bedroom, kitchen, study, moves, boxes, items }
}

describe('物品移箱', () => {
  it('移箱后两边箱内清单同步，重启仍保留', async () => {
    const { kitchen, study, items } = await createFixture()
    const charger = items.createItem(study.id, { name: '充电器' })

    const moved = items.moveItem(charger.id, kitchen.id)

    expect(moved.fromBox.id).toBe(study.id)
    expect(moved.toBox.id).toBe(kitchen.id)
    expect(items.listItems(study.id)).toHaveLength(0)
    expect(items.listItems(kitchen.id).map((entry) => entry.name)).toEqual(['充电器'])

    vi.resetModules()
    const restarted = await import('../src/services/items.js')
    expect(restarted.getItem(charger.id).boxId).toBe(kitchen.id)
    expect(restarted.listItems(kitchen.id)).toHaveLength(1)
  })

  it('目标就是当前箱子时拒绝移动', async () => {
    const { study, items } = await createFixture()
    const item = items.createItem(study.id, { name: '笔记本' })

    expect(() => items.moveItem(item.id, study.id)).toThrow('物品已经在这个箱子里')
  })

  it('不能把物品移到其他搬家的箱子', async () => {
    const { study, moves, boxes, items } = await createFixture()
    const item = items.createItem(study.id, { name: '路由器' })
    const otherMove = moves.createMove('另一次搬家')
    const otherBox = boxes.createBox(otherMove.id, { room: '客厅' })

    expect(() => items.moveItem(item.id, otherBox.id)).toThrow('不能移到其他搬家的箱子')
  })

  it('物品或目标箱子不存在时给出可读提示', async () => {
    const { kitchen, items } = await createFixture()

    expect(() => items.moveItem('it_missing', kitchen.id)).toThrow('物品不存在')
    expect(() => items.moveItem(kitchen.id, 'bx_missing')).toThrow('目标箱子不存在')
  })
})

describe('箱子状态流转', () => {
  it('按装箱中→已封箱→已搬运→已拆箱流转，统计随之变化', async () => {
    const { move, bedroom, boxes } = await createFixture()

    expect(boxes.boxStats(move.id)).toMatchObject({ packing: 3, sealed: 0, moved: 0, unpacked: 0 })

    boxes.setBoxStatus(bedroom.id, 'sealed')
    expect(boxes.boxStats(move.id)).toMatchObject({ packing: 2, sealed: 1, moved: 0, unpacked: 0 })

    boxes.setBoxStatus(bedroom.id, 'moved')
    expect(boxes.boxStats(move.id)).toMatchObject({ packing: 2, sealed: 0, moved: 1, unpacked: 0 })

    boxes.setBoxStatus(bedroom.id, 'unpacked')
    expect(boxes.boxStats(move.id)).toMatchObject({ packing: 2, sealed: 0, moved: 0, unpacked: 1 })
  })

  it('允许改回之前的状态，重启后仍保留', async () => {
    const { bedroom, boxes } = await createFixture()
    boxes.setBoxStatus(bedroom.id, 'unpacked')
    boxes.setBoxStatus(bedroom.id, 'sealed')

    expect(boxes.getBox(bedroom.id).status).toBe('sealed')

    vi.resetModules()
    const restarted = await import('../src/services/boxes.js')
    expect(restarted.getBox(bedroom.id).status).toBe('sealed')
  })

  it('非法状态或箱子不存在时给出可读提示', async () => {
    const { bedroom, boxes } = await createFixture()

    expect(() => boxes.setBoxStatus(bedroom.id, 'lost')).toThrow('箱子状态无效')
    expect(() => boxes.setBoxStatus('bx_missing', 'sealed')).toThrow('箱子不存在')
  })

  it('箱子列表可按状态筛选数据', async () => {
    const { move, bedroom, kitchen, boxes } = await createFixture()
    boxes.setBoxStatus(bedroom.id, 'sealed')
    boxes.setBoxStatus(kitchen.id, 'unpacked')

    const stats = boxes.boxStats(move.id)
    expect(stats.total).toBe(3)
    expect(stats.sealed).toBe(1)
    expect(stats.unpacked).toBe(1)
    expect(stats.packing).toBe(1)
  })
})

describe('store 的 M4 actions', () => {
  it('移箱与状态切换后 store 立即反映最新数据', async () => {
    const app = await import('../src/store/index.js')
    app.bootstrap()
    const move = app.actions.createMove('搬家 F')
    const source = app.actions.createBox(move.id, { room: '书房' })
    const target = app.actions.createBox(move.id, { room: '卫生间' })
    const item = app.actions.createItem(source.id, { name: '充电器' })

    app.actions.moveItem(item.id, target.id)
    expect(app.store.db.items[0].boxId).toBe(target.id)

    app.actions.setBoxStatus(target.id, 'unpacked')
    expect(app.store.db.boxes.find((box) => box.id === target.id).status).toBe('unpacked')
  })
})
