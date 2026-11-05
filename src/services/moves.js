import { LIMITS } from '../constants/index.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import { createId } from '../utils/id.js'
import { loadDb, mutate } from './db.js'

function normalizeName(name) {
  const value = String(name == null ? '' : name).trim()
  if (!value) throw new ValidationError('请填写搬家名称')
  if (value.length > LIMITS.moveName) {
    throw new ValidationError(`搬家名称最多 ${LIMITS.moveName} 个字`)
  }
  return value
}

export function listMoves() {
  return loadDb()
    .moves.slice()
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function getMove(moveId) {
  return loadDb().moves.find((move) => move.id === moveId) || null
}

export function createMove(name) {
  const cleanName = normalizeName(name)
  return mutate((db) => {
    const now = Date.now()
    const move = {
      id: createId('mv_'),
      name: cleanName,
      createdAt: now,
      updatedAt: now,
      // 箱号分配游标：只增不减，删除箱子不回退。
      nextBoxNo: 1,
    }
    db.moves.push(move)
    return move
  })
}

export function renameMove(moveId, name) {
  const cleanName = normalizeName(name)
  return mutate((db) => {
    const move = db.moves.find((item) => item.id === moveId)
    if (!move) throw new NotFoundError('搬家记录不存在')
    move.name = cleanName
    move.updatedAt = Date.now()
    return move
  })
}

export function countBoxes(moveId) {
  return loadDb().boxes.filter((box) => box.moveId === moveId).length
}
