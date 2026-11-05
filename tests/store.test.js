import { beforeEach, expect, it, vi } from 'vitest'
import { createFakeUni } from './helpers/fake-uni.js'

beforeEach(() => {
  createFakeUni()
  vi.resetModules()
})

it('actions 写入后 store 立即反映最新数据', async () => {
  const app = await import('../src/store/index.js')
  app.bootstrap()
  expect(app.store.db.moves).toHaveLength(0)

  const move = app.actions.createMove('我的第一次搬家')
  const box = app.actions.createBox(move.id, { room: '卧室' })

  expect(app.store.db.moves).toHaveLength(1)
  expect(app.store.db.boxes).toHaveLength(1)
  expect(app.store.db.boxes[0].no).toBe(1)

  app.actions.deleteBox(box.id)
  expect(app.store.db.boxes).toHaveLength(0)
  expect(app.store.db.moves[0].nextBoxNo).toBe(2)
})


it('物品 actions 写入后 store 与持久化同步', async () => {
  const app = await import('../src/store/index.js')
  app.bootstrap()
  const move = app.actions.createMove('搬家 E')
  const box = app.actions.createBox(move.id, { room: '书房' })
  const item = app.actions.createItem(box.id, { name: '充电器' })

  expect(app.store.db.items).toHaveLength(1)
  expect(app.store.db.items[0].name).toBe('充电器')

  app.actions.updateItem(item.id, { name: '快充头', quantity: 3 })
  expect(app.store.db.items[0].quantity).toBe(3)

  app.actions.deleteItem(item.id)
  expect(app.store.db.items).toHaveLength(0)
})
