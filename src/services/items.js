import { LIMITS } from '../constants/index.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import { createId } from '../utils/id.js'
import { loadDb, mutate } from './db.js'

function normalizePhotoPath(photoPath) {
  return String(photoPath == null ? '' : photoPath).trim()
}

function normalizeName(name) {
  const value = String(name == null ? '' : name).trim()
  if (!value) throw new ValidationError('请填写物品名称')
  if (value.length > LIMITS.itemName) {
    throw new ValidationError(`物品名称最多 ${LIMITS.itemName} 个字`)
  }
  return value
}

function normalizeQuantity(quantity) {
  if (quantity === undefined || quantity === null || quantity === '') return 1
  const value = Number(quantity)
  if (!Number.isInteger(value) || value < 1 || value > LIMITS.itemQuantity) {
    throw new ValidationError(`数量需要填写 1 到 ${LIMITS.itemQuantity} 之间的整数`)
  }
  return value
}

export function listItems(boxId) {
  return loadDb()
    .items.filter((item) => item.boxId === boxId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function getItem(itemId) {
  return loadDb().items.find((item) => item.id === itemId) || null
}

export function createItem(boxId, payload = {}) {
  const name = normalizeName(payload.name)
  const quantity = normalizeQuantity(payload.quantity)

  return mutate((db) => {
    const box = db.boxes.find((entry) => entry.id === boxId)
    if (!box) throw new NotFoundError('箱子不存在')

    const now = Date.now()
    const item = {
      id: createId('it_'),
      boxId,
      name,
      quantity,
      // 照片由页面先经 photos.persistPhoto 转成永久路径，再写到这里。
      photoPath: normalizePhotoPath(payload.photoPath),
      createdAt: now,
    }
    db.items.push(item)
    return item
  })
}

export function updateItem(itemId, payload = {}) {
  const name = normalizeName(payload.name)
  const quantity = normalizeQuantity(payload.quantity)

  return mutate((db) => {
    const item = db.items.find((entry) => entry.id === itemId)
    if (!item) throw new NotFoundError('物品不存在')

    item.name = name
    item.quantity = quantity
    if ('photoPath' in payload) {
      item.photoPath = normalizePhotoPath(payload.photoPath)
    }
    const box = db.boxes.find((entry) => entry.id === item.boxId)
    if (box) box.updatedAt = Date.now()
    return item
  })
}

export function deleteItem(itemId) {
  return mutate((db) => {
    const index = db.items.findIndex((item) => item.id === itemId)
    if (index === -1) throw new NotFoundError('物品不存在')

    const [removed] = db.items.splice(index, 1)
    const box = db.boxes.find((entry) => entry.id === removed.boxId)
    if (box) box.updatedAt = Date.now()
    return removed
  })
}

/**
 * 移箱：物品只关联 boxId，改动后来源箱和目标箱的清单立即同步。
 * 只允许在同一搬家内移动，避免把物品挂到别的搬家的箱子上。
 */
export function moveItem(itemId, targetBoxId) {
  return mutate((db) => {
    const target = db.boxes.find((entry) => entry.id === targetBoxId)
    if (!target) throw new NotFoundError('目标箱子不存在')

    const item = db.items.find((entry) => entry.id === itemId)
    if (!item) throw new NotFoundError('物品不存在')

    const source = db.boxes.find((entry) => entry.id === item.boxId) || null
    if (source && source.id === target.id) {
      throw new ValidationError('物品已经在这个箱子里')
    }
    if (source && source.moveId !== target.moveId) {
      throw new ValidationError('不能移到其他搬家的箱子')
    }

    item.boxId = target.id
    const now = Date.now()
    if (source) source.updatedAt = now
    target.updatedAt = now
    const move = db.moves.find((entry) => entry.id === target.moveId)
    if (move) move.updatedAt = now

    return { item, fromBox: source, toBox: target }
  })
}

export function countItems(boxId) {
  return loadDb().items.filter((item) => item.boxId === boxId).length
}
