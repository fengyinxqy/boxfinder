import { SCHEMA_VERSION } from '../constants/index.js'
import { DataError } from '../utils/errors.js'
import { readRaw, writeRaw } from './storage.js'

export const DB_KEY = 'db'

/**
 * 单 key 存整库：v1 数据量小（只有箱子和物品文字），读取/备份都简单。
 * 微信单 key 约 10MB 上限，物品量增长后按 README 约定迁移到文件系统。
 * items 先留空数组，M3 直接写入，避免届时再改 schema。
 */
export function createEmptyDb() {
  return {
    schemaVersion: SCHEMA_VERSION,
    moves: [],
    boxes: [],
    items: [],
  }
}

export function loadDb() {
  const raw = readRaw(DB_KEY, null)
  if (!raw) return createEmptyDb()
  return normalizeDb(raw)
}

function normalizeDb(raw) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new DataError('本地数据格式异常，暂不能读取')
  }

  const version = Number(raw.schemaVersion) || 1
  if (version > SCHEMA_VERSION) {
    throw new DataError('本地数据来自更高版本，请升级小程序后再打开')
  }

  // 目前只有 v1；后续版本在这里按 version 逐级补字段，禁止直接清空用户数据。
  return {
    schemaVersion: SCHEMA_VERSION,
    moves: Array.isArray(raw.moves) ? raw.moves : [],
    boxes: Array.isArray(raw.boxes) ? raw.boxes : [],
    items: Array.isArray(raw.items) ? raw.items : [],
  }
}

export function saveDb(db) {
  writeRaw(DB_KEY, db)
}

/**
 * 读-改-写一次完成。回调抛错时不落盘，避免写入半成品数据。
 */
export function mutate(mutator) {
  const db = loadDb()
  const result = mutator(db)
  saveDb(db)
  return result
}
