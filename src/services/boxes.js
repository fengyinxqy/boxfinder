import { BOX_STATUS, LIMITS } from '../constants/index.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import { createId } from '../utils/id.js'
import { loadDb, mutate } from './db.js'

function normalizeRoom(room) {
  const value = String(room == null ? '' : room).trim()
  if (!value) throw new ValidationError('请填写目标房间')
  if (value.length > LIMITS.room) {
    throw new ValidationError(`房间名称最多 ${LIMITS.room} 个字`)
  }
  return value
}

function normalizeNote(note) {
  const value = String(note == null ? '' : note).trim()
  if (value.length > LIMITS.note) {
    throw new ValidationError(`备注最多 ${LIMITS.note} 个字`)
  }
  return value
}

export function listBoxes(moveId) {
  return loadDb()
    .boxes.filter((box) => box.moveId === moveId)
    .sort((a, b) => a.no - b.no)
}

export function getBox(boxId) {
  return loadDb().boxes.find((box) => box.id === boxId) || null
}

export function createBox(moveId, payload = {}) {
  const room = normalizeRoom(payload.room)
  const note = normalizeNote(payload.note)

  return mutate((db) => {
    const move = db.moves.find((item) => item.id === moveId)
    if (!move) throw new NotFoundError('搬家记录不存在')

    const boxNos = db.boxes
      .filter((box) => box.moveId === moveId)
      .map((box) => Number(box.no) || 0)
    const maxNo = boxNos.reduce((max, no) => (no > max ? no : max), 0)
    // nextBoxNo 是唯一分配依据；maxNo + 1 只用于修复被外部改坏的游标。
    const boxNo = Math.max(Number(move.nextBoxNo) || 1, maxNo + 1)

    const now = Date.now()
    const box = {
      id: createId('bx_'),
      moveId,
      no: boxNo,
      room,
      note,
      status: 'packing',
      createdAt: now,
      updatedAt: now,
    }
    db.boxes.push(box)
    move.nextBoxNo = boxNo + 1
    move.updatedAt = now
    return box
  })
}

export function updateBox(boxId, payload = {}) {
  const room = normalizeRoom(payload.room)
  const note = normalizeNote(payload.note)

  return mutate((db) => {
    const box = db.boxes.find((item) => item.id === boxId)
    if (!box) throw new NotFoundError('箱子不存在')

    box.room = room
    box.note = note
    box.updatedAt = Date.now()
    const move = db.moves.find((item) => item.id === box.moveId)
    if (move) move.updatedAt = box.updatedAt
    return box
  })
}

export function deleteBox(boxId) {
  return mutate((db) => {
    const index = db.boxes.findIndex((box) => box.id === boxId)
    if (index === -1) throw new NotFoundError('箱子不存在')

    const [removed] = db.boxes.splice(index, 1)
    // 级联删除箱内物品（M3 起有数据）；箱号计数器不回退。
    db.items = db.items.filter((item) => item.boxId !== boxId)

    const move = db.moves.find((item) => item.id === removed.moveId)
    if (move) move.updatedAt = Date.now()
    return removed
  })
}

/**
 * 状态流转：装箱中 → 已封箱 → 已搬运 → 已拆箱。
 * 第一版不做前后顺序限制，允许直接改回之前的任何状态。
 */
export function setBoxStatus(boxId, status) {
  if (!BOX_STATUS[status]) throw new ValidationError('箱子状态无效')

  return mutate((db) => {
    const box = db.boxes.find((entry) => entry.id === boxId)
    if (!box) throw new NotFoundError('箱子不存在')
    if (box.status === status) return box

    const now = Date.now()
    box.status = status
    box.updatedAt = now
    const move = db.moves.find((entry) => entry.id === box.moveId)
    if (move) move.updatedAt = now
    return box
  })
}

export function boxStats(moveId) {
  const db = loadDb()
  const move = db.moves.find((item) => item.id === moveId) || null
  const boxes = db.boxes.filter((box) => box.moveId === moveId)
  const maxNo = boxes.reduce((max, box) => Math.max(max, Number(box.no) || 0), 0)

  return {
    total: boxes.length,
    packing: boxes.filter((box) => box.status === 'packing').length,
    sealed: boxes.filter((box) => box.status === 'sealed').length,
    moved: boxes.filter((box) => box.status === 'moved').length,
    unpacked: boxes.filter((box) => box.status === 'unpacked').length,
    nextNo: Math.max(Number(move && move.nextBoxNo) || 1, maxNo + 1),
  }
}
