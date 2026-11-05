import { beforeEach, expect, it, vi } from 'vitest'
import { createFakeUni } from './helpers/fake-uni.js'

let fake

beforeEach(() => {
  fake = createFakeUni()
  vi.resetModules()
})

it('首次读取返回空库', async () => {
  const db = await import('../src/services/db.js')
  expect(db.loadDb()).toEqual({ schemaVersion: 1, moves: [], boxes: [], items: [] })
})

it('数据格式损坏时抛出可读错误，且不覆盖原数据', async () => {
  fake.data.set('mover:db', 'not-an-object')
  const db = await import('../src/services/db.js')

  expect(() => db.loadDb()).toThrow('本地数据格式异常')
  expect(fake.data.get('mover:db')).toBe('not-an-object')
})

it('数据版本高于当前版本时拒绝读取', async () => {
  fake.data.set('mover:db', { schemaVersion: 99, moves: [], boxes: [], items: [] })
  const db = await import('../src/services/db.js')
  expect(() => db.loadDb()).toThrow('本地数据来自更高版本')
})

it('缺少 items 字段时补空数组', async () => {
  fake.data.set('mover:db', { schemaVersion: 1, moves: [], boxes: [] })
  const db = await import('../src/services/db.js')
  expect(db.loadDb().items).toEqual([])
})
