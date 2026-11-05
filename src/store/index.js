import { reactive, readonly } from 'vue'
import { createEmptyDb, loadDb } from '../services/db.js'
import * as backupApi from '../services/backup.js'
import * as boxesApi from '../services/boxes.js'
import * as itemsApi from '../services/items.js'
import * as movesApi from '../services/moves.js'
import { seedDemoData } from '../services/seed.js'

const state = reactive({
  db: createEmptyDb(),
  ready: false,
  error: '',
})

/**
 * 页面只读 store；写操作统一走 actions，写入成功后用 refresh() 重新读库。
 * v1 不引入 Pinia：数据只有一份本地快照，页面数量少，模块级响应式对象足够。
 */
export const store = readonly(state)

export function bootstrap() {
  if (state.ready) return
  try {
    state.db = loadDb()
    state.error = ''
  } catch (error) {
    state.error = error.message || '本地数据加载失败'
  } finally {
    state.ready = true
  }
}

export function refresh() {
  try {
    state.db = loadDb()
    state.error = ''
  } catch (error) {
    state.error = error.message || '本地数据加载失败'
  }
}

function withRefresh(write) {
  const result = write()
  refresh()
  return result
}

export const actions = {
  createMove(name) {
    return withRefresh(() => movesApi.createMove(name))
  },
  renameMove(moveId, name) {
    return withRefresh(() => movesApi.renameMove(moveId, name))
  },
  createBox(moveId, payload) {
    return withRefresh(() => boxesApi.createBox(moveId, payload))
  },
  updateBox(boxId, payload) {
    return withRefresh(() => boxesApi.updateBox(boxId, payload))
  },
  deleteBox(boxId) {
    return withRefresh(() => boxesApi.deleteBox(boxId))
  },
  createItem(boxId, payload) {
    return withRefresh(() => itemsApi.createItem(boxId, payload))
  },
  updateItem(itemId, payload) {
    return withRefresh(() => itemsApi.updateItem(itemId, payload))
  },
  deleteItem(itemId) {
    return withRefresh(() => itemsApi.deleteItem(itemId))
  },
  moveItem(itemId, targetBoxId) {
    return withRefresh(() => itemsApi.moveItem(itemId, targetBoxId))
  },
  setBoxStatus(boxId, status) {
    return withRefresh(() => boxesApi.setBoxStatus(boxId, status))
  },
  seedDemo() {
    return withRefresh(() => seedDemoData())
  },
  restoreBackup(text) {
    return withRefresh(() => backupApi.restoreBackup(text))
  },
}
