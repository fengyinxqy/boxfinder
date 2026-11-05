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
