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
  const search = await import('../src/services/search.js')

  const move = moves.createMove('我的第一次搬家')
  const bedroom = boxes.createBox(move.id, { room: '卧室' })
  const kitchen = boxes.createBox(move.id, { room: '厨房' })
  const study = boxes.createBox(move.id, { room: '书房' })

  return { move, bedroom, kitchen, study, moves, boxes, items, search }
}

describe('物品搜索', () => {
  it('按名称模糊搜索，结果带箱号与目标房间', async () => {
    const { move, bedroom, study, items, search } = await createFixture()
    items.createItem(study.id, { name: '65W 充电器', quantity: 3 })
    items.createItem(bedroom.id, { name: '被子' })

    const result = search.searchMove(move.id, '充电')

    expect(result.items).toHaveLength(1)
    expect(result.items[0].item.name).toBe('65W 充电器')
    expect(result.items[0].item.quantity).toBe(3)
    expect(result.items[0].box.no).toBe(3)
    expect(result.items[0].box.room).toBe('书房')
  })

  it('匹配多个物品时按箱号返回', async () => {
    const { move, bedroom, study, items, search } = await createFixture()
    items.createItem(study.id, { name: '手机充电器' })
    items.createItem(bedroom.id, { name: '充电线' })

    const result = search.searchMove(move.id, '充电')

    expect(result.items.map((row) => row.box.no)).toEqual([1, 3])
  })

  it('英文名称不区分大小写', async () => {
    const { move, study, items, search } = await createFixture()
    items.createItem(study.id, { name: 'USB Cable' })

    expect(search.searchMove(move.id, 'usb').items).toHaveLength(1)
    expect(search.searchMove(move.id, 'CABLE').items).toHaveLength(1)
  })

  it('支持直接用箱号查询，返回箱号、房间与件数', async () => {
    const { move, kitchen, items, search } = await createFixture()
    items.createItem(kitchen.id, { name: '炒锅' })
    items.createItem(kitchen.id, { name: '碗', quantity: 6 })

    const result = search.searchMove(move.id, '2')

    expect(result.boxes).toHaveLength(1)
    expect(result.boxes[0].box.no).toBe(2)
    expect(result.boxes[0].box.room).toBe('厨房')
    expect(result.boxes[0].itemCount).toBe(2)
    expect(result.items).toHaveLength(0)
  })

  it('箱号支持「3号」「3 号箱」「03」等写法', async () => {
    const { move, search } = await createFixture()

    for (const query of ['3', '3号', '3 号箱', '03']) {
      const result = search.searchMove(move.id, query)
      expect(result.boxes.map((row) => row.box.no)).toEqual([3])
    }
  })

  it('空箱也能按箱号查到', async () => {
    const { move, boxes, search } = await createFixture()
    const balcony = boxes.createBox(move.id, { room: '阳台' })

    const result = search.searchMove(move.id, String(balcony.no))

    expect(result.boxes).toHaveLength(1)
    expect(result.boxes[0].box.room).toBe('阳台')
    expect(result.boxes[0].itemCount).toBe(0)
  })

  it('空查询与无匹配都返回空结果', async () => {
    const { move, search } = await createFixture()

    expect(search.searchMove(move.id, '   ')).toEqual({ query: '', items: [], boxes: [] })
    expect(search.searchMove(move.id, '不存在的物品')).toEqual({
      query: '不存在的物品',
      items: [],
      boxes: [],
    })
  })

  it('只搜索当前搬家的箱子', async () => {
    const { move, study, moves, boxes, items, search } = await createFixture()
    items.createItem(study.id, { name: '充电器' })

    const otherMove = moves.createMove('另一次搬家')
    const otherBox = boxes.createBox(otherMove.id, { room: '客厅' })
    items.createItem(otherBox.id, { name: '充电器' })

    const result = search.searchMove(move.id, '充电器')

    expect(result.items).toHaveLength(1)
    expect(result.items[0].box.moveId).toBe(move.id)
  })

  it('物品移箱后搜索结果同步更新', async () => {
    const { move, kitchen, study, items, search } = await createFixture()
    const charger = items.createItem(study.id, { name: '65W 充电器' })

    items.moveItem(charger.id, kitchen.id)

    const result = search.searchMove(move.id, '充电器')
    expect(result.items).toHaveLength(1)
    expect(result.items[0].box.no).toBe(2)
    expect(result.items[0].box.room).toBe('厨房')
  })
})
