import { DEMO_MOVE_NAME } from '../constants/index.js'
import { createId } from '../utils/id.js'
import { mutate } from './db.js'

const DEMO_BOXES = [
  { no: 1, room: '卧室', note: '衣物、床品和窗帘' },
  { no: 2, room: '厨房', note: '锅具、餐具和调料' },
  { no: 3, room: '书房', note: '书、文件和数码配件' },
]

/**
 * 幂等：已存在同名示例搬家时直接返回，不影响真实数据。
 * 只在「数据与说明」页手动触发，不在首次启动时自动写入。
 */
export function seedDemoData() {
  return mutate((db) => {
    if (db.moves.some((move) => move.name === DEMO_MOVE_NAME)) {
      return { created: false, boxes: 0 }
    }

    const now = Date.now()
    const move = {
      id: createId('mv_'),
      name: DEMO_MOVE_NAME,
      createdAt: now,
      updatedAt: now,
      nextBoxNo: DEMO_BOXES.length + 1,
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
