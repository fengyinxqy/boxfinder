import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeFs } from './helpers/fake-fs.js'
import { createFakeUni } from './helpers/fake-uni.js'

const USER_DATA = '/user/data'

beforeEach(() => {
  createFakeUni()
  vi.resetModules()
})

describe('示例数据标记', () => {
  it('seed 写入的搬家带 isDemo，schema 不升版本', async () => {
    const seed = await import('../src/services/seed.js')
    const db = await import('../src/services/db.js')

    expect(seed.seedDemoData()).toEqual({ created: true, boxes: 3 })
    const demo = db.loadDb().moves[0]
    expect(demo.isDemo).toBe(true)
    expect(db.loadDb().schemaVersion).toBe(1)
    expect(seed.hasDemoData()).toBe(true)
  })

  it('重复载入保持幂等，不重复创建', async () => {
    const seed = await import('../src/services/seed.js')
    const moves = await import('../src/services/moves.js')

    seed.seedDemoData()
    expect(seed.seedDemoData()).toEqual({ created: false, boxes: 0 })
    expect(moves.listMoves()).toHaveLength(1)
  })

  it('兼容 v1 只写名称、没有 isDemo 的示例搬家', async () => {
    const db = await import('../src/services/db.js')
    const seed = await import('../src/services/seed.js')
    const constants = await import('../src/constants/index.js')

    db.mutate((draft) => {
      draft.moves.push({ id: 'mv_legacy', name: constants.DEMO_MOVE_NAME, createdAt: 1, updatedAt: 1, nextBoxNo: 1 })
    })

    expect(seed.hasDemoData()).toBe(true)
    expect(seed.seedDemoData()).toEqual({ created: false, boxes: 0 })
  })
})

describe('移除示例数据', () => {
  async function fixture() {
    const moves = await import('../src/services/moves.js')
    const boxes = await import('../src/services/boxes.js')
    const items = await import('../src/services/items.js')
    const seed = await import('../src/services/seed.js')

    const realMove = moves.createMove('真实搬家')
    const realBox = boxes.createBox(realMove.id, { room: '卧室' })
    const realPhoto = `${USER_DATA}/photos/photo_real.jpg`
    items.createItem(realBox.id, { name: '被子', photoPath: realPhoto })

    seed.seedDemoData()
    const demo = moves.listMoves().find((move) => move.isDemo)
    const demoBox = boxes.listBoxes(demo.id)[0]
    const demoPhoto = `${USER_DATA}/photos/photo_demo.jpg`
    items.createItem(demoBox.id, { name: '示例里后加的物品', photoPath: demoPhoto })

    return { moves, boxes, items, seed, realMove, realBox, realPhoto, demo, demoBox, demoPhoto }
  }

  it('级联删除示例搬家的箱子、物品与照片，其他搬家不受影响', async () => {
    const { moves, boxes, items, seed, realMove, realBox, demo, demoPhoto, realPhoto } = await fixture()
    const fs = createFakeFs({ files: [demoPhoto, realPhoto] })

    const result = seed.removeDemoData({ fs, userDataPath: USER_DATA })

    expect(result).toEqual({ removed: true, boxes: 3, items: 1 })
    expect(moves.listMoves().map((move) => move.id)).toEqual([realMove.id])
    expect(boxes.listBoxes(realMove.id).map((box) => box.id)).toEqual([realBox.id])
    expect(items.listItems(realBox.id)).toHaveLength(1)
    expect(seed.hasDemoData()).toBe(false)
    // 只删示例物品的照片，真实搬家的照片保持不动。
    expect(fs.calls.unlink).toEqual([demoPhoto])
  })

  it('没有示例数据时返回未移除，不删任何东西', async () => {
    const moves = await import('../src/services/moves.js')
    const seed = await import('../src/services/seed.js')
    moves.createMove('真实搬家')

    const fs = createFakeFs()
    expect(seed.removeDemoData({ fs, userDataPath: USER_DATA })).toEqual({
      removed: false,
      boxes: 0,
      items: 0,
    })
    expect(fs.calls.unlink).toHaveLength(0)
    expect(moves.listMoves()).toHaveLength(1)
  })

  it('可通过 store action 移除并刷新概览', async () => {
    const app = await import('../src/store/index.js')
    app.bootstrap()
    app.actions.createMove('真实搬家')
    app.actions.seedDemo()
    expect(app.store.db.moves).toHaveLength(2)

    app.actions.removeDemo({ fs: null, userDataPath: '' })
    expect(app.store.db.moves).toHaveLength(1)
    expect(app.store.db.moves[0].name).toBe('真实搬家')
  })
})
