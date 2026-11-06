import { BOX_STATUS, LIMITS, SCHEMA_VERSION } from '../constants/index.js'
import { BackupError } from '../utils/errors.js'
import { loadDb, saveDb } from './db.js'

export const BACKUP_APP = 'boxfinder'
export const BACKUP_NOTES = ['照片文件不在备份内，恢复后需要重新拍照或选图。']

/** 备份读库入口：页面和单测都从这里拿当前快照。 */
export function loadBackupDb() {
  return loadDb()
}

function normalizeText(value, fallback = '') {
  return String(value == null ? fallback : value).trim()
}

function isValidTime(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * 备份只包含文字数据：schema 版本、导出时间与数量统计。
 * photoPath 被移除，避免把临时路径或设备路径带进备份包。
 */
export function buildBackup(db, now = Date.now()) {
  const moves = db.moves.map((move) => ({
    id: move.id,
    name: move.name,
    createdAt: move.createdAt,
    updatedAt: move.updatedAt,
    nextBoxNo: move.nextBoxNo,
  }))
  const boxes = db.boxes.map((box) => ({
    id: box.id,
    moveId: box.moveId,
    no: box.no,
    room: box.room,
    note: box.note || '',
    status: box.status,
    createdAt: box.createdAt,
    updatedAt: box.updatedAt,
  }))
  const items = db.items.map((item) => ({
    id: item.id,
    boxId: item.boxId,
    name: item.name,
    quantity: item.quantity,
    createdAt: item.createdAt,
  }))

  return {
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date(now).toISOString(),
    photoIncluded: false,
    notes: BACKUP_NOTES.slice(),
    counts: { moves: moves.length, boxes: boxes.length, items: items.length },
    moves,
    boxes,
    items,
  }
}

export function serializeBackup(db, now = Date.now()) {
  return JSON.stringify(buildBackup(db, now), null, 2)
}

function fail(message) {
  throw new BackupError(message)
}

function assertUniqueIds(list, label) {
  const seen = new Set()
  for (const entry of list) {
    if (!entry || typeof entry.id !== 'string' || !entry.id.trim()) {
      fail(`备份文件里的${label}缺少 ID`)
    }
    if (seen.has(entry.id)) fail(`备份文件存在重复的${label} ID：${entry.id}`)
    seen.add(entry.id)
  }
}

/**
 * 只做校验与归一化，不写库。任何一处不合法都直接抛错，
 * 调用方（restoreBackup）因此不会在坏文件上覆盖现有数据。
 */
export function parseBackup(text) {
  const raw = String(text == null ? '' : text).trim()
  if (!raw) fail('请先粘贴备份内容')

  let payload
  try {
    payload = JSON.parse(raw)
  } catch (error) {
    fail('备份内容不是有效的 JSON，请确认粘贴完整')
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    fail('备份内容格式不正确')
  }
  if (payload.app !== BACKUP_APP) {
    fail('这不是封箱之前的备份文件')
  }

  const version = Number(payload.schemaVersion)
  if (!Number.isInteger(version) || version < 1) {
    fail('备份文件缺少有效的 schemaVersion')
  }
  if (version > SCHEMA_VERSION) {
    fail('备份来自更高版本，请升级小程序后再恢复')
  }
  if (!Array.isArray(payload.moves) || !Array.isArray(payload.boxes) || !Array.isArray(payload.items)) {
    fail('备份文件缺少 moves、boxes 或 items 数据')
  }

  assertUniqueIds(payload.moves, '搬家')
  assertUniqueIds(payload.boxes, '箱子')
  assertUniqueIds(payload.items, '物品')

  const moveIds = new Set(payload.moves.map((move) => move.id))
  const boxIds = new Set(payload.boxes.map((box) => box.id))

  const moves = payload.moves.map((move) => {
    const name = normalizeText(move.name)
    if (!name) fail(`搬家记录名称为空：${move.id}`)
    const nextBoxNo = Number(move.nextBoxNo)
    return {
      id: move.id,
      name,
      createdAt: isValidTime(move.createdAt) ? move.createdAt : Date.now(),
      updatedAt: isValidTime(move.updatedAt) ? move.updatedAt : move.createdAt || Date.now(),
      nextBoxNo: Number.isInteger(nextBoxNo) && nextBoxNo >= 1 ? nextBoxNo : 1,
    }
  })

  const boxes = payload.boxes.map((box) => {
    if (!moveIds.has(box.moveId)) {
      fail(`箱子关联的搬家不存在：${box.id}`)
    }
    const no = Number(box.no)
    if (!Number.isInteger(no) || no < 1) fail(`箱子编号无效：${box.id}`)
    const room = normalizeText(box.room)
    if (!room) fail(`箱子目标房间为空：${box.id}`)
    const status = BOX_STATUS[box.status] ? box.status : 'packing'
    return {
      id: box.id,
      moveId: box.moveId,
      no,
      room: room.length > LIMITS.room ? room.slice(0, LIMITS.room) : room,
      note: normalizeText(box.note),
      status,
      createdAt: isValidTime(box.createdAt) ? box.createdAt : Date.now(),
      updatedAt: isValidTime(box.updatedAt) ? box.updatedAt : box.createdAt || Date.now(),
    }
  })

  const items = payload.items.map((item) => {
    if (!boxIds.has(item.boxId)) {
      fail(`物品关联的箱子不存在：${item.id}`)
    }
    const name = normalizeText(item.name)
    if (!name) fail(`物品名称为空：${item.id}`)
    const quantity = item.quantity === undefined ? 1 : Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > LIMITS.itemQuantity) {
      fail(`物品数量无效：${item.id}`)
    }
    return {
      id: item.id,
      boxId: item.boxId,
      name: name.length > LIMITS.itemName ? name.slice(0, LIMITS.itemName) : name,
      quantity,
      // 照片不进备份，恢复后一律为空，等用户重新拍照。
      photoPath: '',
      createdAt: isValidTime(item.createdAt) ? item.createdAt : Date.now(),
    }
  })

  return {
    schemaVersion: SCHEMA_VERSION,
    moves,
    boxes,
    items,
  }
}

/** 先完整校验，再整体替换本地数据；校验失败时原数据保持不变。 */
export function restoreBackup(text) {
  const db = parseBackup(text)
  saveDb(db)
  return {
    counts: { moves: db.moves.length, boxes: db.boxes.length, items: db.items.length },
  }
}
