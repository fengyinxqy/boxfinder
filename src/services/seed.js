import { DEMO_MOVE_NAME } from '../constants/index.js'
import { createId } from '../utils/id.js'
import { loadDb, mutate } from './db.js'
import { removePhoto } from './photos.js'

const DEMO_BOXES = [
  { no: 1, room: '卧室', note: '衣物、床品和窗帘' },
  { no: 2, room: '厨房', note: '锅具、餐具和调料' },
  { no: 3, room: '书房', note: '书、文件和数码配件' },
]

/**
 * 示例搬家的身份标记。
 * schema 不升版本：旧数据没有 isDemo 字段时按名称兼容（v1 的 seed 只写名称），
 * 这样升级前载入的示例数据也能被识别和移除。
 */
export function isDemoMove(move) {
  return Boolean(move) && (move.isDemo === true || move.name === DEMO_MOVE_NAME)
}

export function hasDemoData() {
  return loadDb().moves.some(isDemoMove)
}

/** 幂等：已存在示例搬家时直接返回，不影响真实数据。 */
export function seedDemoData() {
  return mutate((db) => {
    if (db.moves.some(isDemoMove)) {
      return { created: false, boxes: 0 }
    }

    const now = Date.now()
    const move = {
      id: createId('mv_'),
      name: DEMO_MOVE_NAME,
      createdAt: now,
      updatedAt: now,
      nextBoxNo: DEMO_BOXES.length + 1,
      // 只用于「移除示例数据」定位，其他业务忽略该字段。
      isDemo: true,
    }
    db.moves.push(move)

    DEMO_BOXES.forEach((demo, index) => {
      db.boxes.push({
        id: createId('bx_'),
        moveId: move.id,
        no: demo.no,
        room: demo.room,
        note: demo.note,
        status: 'packing',
        createdAt: now + index,
        updatedAt: now + index,
      })
    })

    return { created: true, boxes: DEMO_BOXES.length }
  })
}

/**
 * 移除示例搬家：级联删除它的箱子、物品与物品照片，其他搬家不动。
 * 用户在示例搬家后加的内容也会一起删除——调用方必须先向用户确认这一点。
 */
export function removeDemoData(overrides = {}) {
  const photoPaths = []

  const result = mutate((db) => {
    const demo = db.moves.find(isDemoMove)
    if (!demo) return { removed: false, boxes: 0, items: 0 }

    const boxIds = new Set(db.boxes.filter((box) => box.moveId === demo.id).map((box) => box.id))
    const items = db.items.filter((item) => boxIds.has(item.boxId))
    items.forEach((item) => {
      if (item.photoPath) photoPaths.push(item.photoPath)
    })

    db.items = db.items.filter((item) => !boxIds.has(item.boxId))
    db.boxes = db.boxes.filter((box) => box.moveId !== demo.id)
    db.moves = db.moves.filter((move) => move.id !== demo.id)

    return { removed: true, boxes: boxIds.size, items: items.length }
  })

  // 数据先落库，再清理文件；删文件失败不影响数据已移除的结果。
  photoPaths.forEach((filePath) => removePhoto(filePath, overrides))
  return result
}
