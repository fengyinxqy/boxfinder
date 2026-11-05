import { LIMITS } from '../constants/index.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import { createId } from '../utils/id.js'
import { loadDb, mutate } from './db.js'

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
      // 照片功能在 M5 接入；先保留字段，避免把相机临时路径写进数据。
      photoPath: '',
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

export function countItems(boxId) {
  return loadDb().items.filter((item) => item.boxId === boxId).length
}
