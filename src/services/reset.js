import { DB_KEY } from './db.js'
import { dirPathOf, removeDirAt, resolveFsEnv } from './fsutil.js'
import { PHOTO_DIR } from './photos.js'
import { PROFILE_DIR, PROFILE_KEY } from './profile.js'
import { removeRaw } from './storage.js'

/**
 * 清除全部本地数据：整库、资料，以及照片与头像两个文件目录。
 *
 * 这是不可恢复的高风险动作，调用方必须完成两段确认。
 * 顺序：先删本地存储（失败会抛出、页面可提示），再清文件目录（尽力而为，
 * 目录不存在或基础库不支持时不阻断）。
 */
export function clearAllLocalData(overrides = {}) {
  removeRaw(DB_KEY)
  removeRaw(PROFILE_KEY)

  const env = resolveFsEnv(overrides)
  if (env.fs && env.userDataPath) {
    removeDirAt(env, dirPathOf(env, PHOTO_DIR))
    removeDirAt(env, dirPathOf(env, PROFILE_DIR))
  }
  return true
}
