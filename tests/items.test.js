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
  const box = boxes.createBox(move.id, { room: '卧室' })
  return { move, box, boxes, items }
}

describe('物品新增', () => {
  it('名称必填、数量默认 1，写入后重启仍能读到', async () => {
    const { box, items } = await createFixture()
    const item = items.createItem(box.id, { name: '  充电器  ' })

    expect(item.name).toBe('充电器')
    expect(item.quantity).toBe(1)
    expect(item.photoPath).toBe('')

    vi.resetModules()
    const restarted = await import('../src/services/items.js')
    expect(restarted.listItems(box.id).map((entry) => entry.name)).toEqual(['充电器'])
  })

  it('物品只挂在对应箱子下', async () => {
    const { move, box, boxes, items } = await createFixture()
    const other = boxes.createBox(move.id, { room: '厨房' })
    items.createItem(box.id, { name: '被子' })
    items.createItem(other.id, { name: '锅' })

    expect(items.listItems(box.id).map((entry) => entry.name)).toEqual(['被子'])
    expect(items.listItems(other.id).map((entry) => entry.name)).toEqual(['锅'])
    expect(items.countItems(box.id)).toBe(1)
    expect(items.countItems(other.id)).toBe(1)
  })

  it('名称为空或超长时给出中文提示', async () => {
    const { box, items } = await createFixture()
    expect(() => items.createItem(box.id, { name: '   ' })).toThrow('请填写物品名称')
    expect(() => items.createItem(box.id, { name: '一'.repeat(31) })).toThrow('物品名称最多 30 个字')
  })

  it('数量必须是 1 到 999 之间的整数', async () => {
    const { box, items } = await createFixture()
    expect(items.createItem(box.id, { name: '杯子', quantity: '3' }).quantity).toBe(3)

    const invalid = [0, -1, 1.5, 1000, 'abc']
    invalid.forEach((quantity) => {
      expect(() => items.createItem(box.id, { name: '杯子', quantity })).toThrow(
        '数量需要填写 1 到 999 之间的整数'
      )
    })
  })

  it('箱子不存在时拒绝录入', async () => {
    const { items } = await createFixture()
    expect(() => items.createItem('bx_missing', { name: '杯子' })).toThrow('箱子不存在')
  })
})

describe('物品编辑与删除', () => {
  it('修改名称和数量后持久化', async () => {
    const { box, items } = await createFixture()
    const item = items.createItem(box.id, { name: '杯子', quantity: 2 })

    items.updateItem(item.id, { name: '玻璃杯', quantity: 6 })

    vi.resetModules()
    const restarted = await import('../src/services/items.js')
    const updated = restarted.getItem(item.id)
    expect(updated.name).toBe('玻璃杯')
    expect(updated.quantity).toBe(6)
    expect(updated.boxId).toBe(box.id)
  })

  it('删除只移除目标物品', async () => {
    const { box, items } = await createFixture()
    const first = items.createItem(box.id, { name: '杯子' })
    const second = items.createItem(box.id, { name: '碗' })

    items.deleteItem(first.id)
    expect(items.listItems(box.id).map((entry) => entry.id)).toEqual([second.id])
  })

  it('物品不存在时给出可读提示', async () => {
    const { items } = await createFixture()
    expect(() => items.updateItem('it_missing', { name: '杯子' })).toThrow('物品不存在')
    expect(() => items.deleteItem('it_missing')).toThrow('物品不存在')
  })
})

describe('箱内清单', () => {
  it('按录入顺序返回箱内物品', async () => {
    const { box, items } = await createFixture()
    const names = ['被子', '枕头', '床单']
    names.forEach((name) => items.createItem(box.id, { name }))

    expect(items.listItems(box.id).map((entry) => entry.name)).toEqual(names)
  })
})
