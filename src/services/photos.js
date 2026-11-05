import { StorageError } from '../utils/errors.js'
import { createId } from '../utils/id.js'

/**
 * 照片持久化：相机/相册返回的是临时路径，关闭小程序后可能失效。
 * 小程序端必须复制到 USER_DATA_PATH 下的 photos 目录；H5 没有文件系统，
 * 只能保留临时路径（blob/URL），仅用于界面预览，不进入本地数据持久化。
 */
export const PHOTO_DIR = 'photos'

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

function uniFileSystem() {
  try {
    if (typeof uni !== 'undefined' && typeof uni.getFileSystemManager === 'function') {
      return uni.getFileSystemManager()
    }
  } catch (error) {
    console.warn('[photos] getFileSystemManager failed:', error)
  }
  return null
}

function uniUserDataPath() {
  try {
    if (typeof uni !== 'undefined' && uni.env && typeof uni.env.USER_DATA_PATH === 'string') {
      return uni.env.USER_DATA_PATH
    }
  } catch (error) {
    console.warn('[photos] uni.env.USER_DATA_PATH failed:', error)
  }
  return ''
}

/** 允许调用方注入文件系统与目录，单测不依赖真实小程序环境。 */
export function resolvePhotoEnv(overrides = {}) {
  const fs = 'fs' in overrides ? overrides.fs : uniFileSystem()
  const userDataPath = 'userDataPath' in overrides ? overrides.userDataPath : uniUserDataPath()
  return { fs: fs || null, userDataPath: userDataPath || '' }
}

function photoDirOf(env) {
  return `${env.userDataPath}/${PHOTO_DIR}`
}

export function isManagedPhoto(filePath, overrides = {}) {
  const env = resolvePhotoEnv(overrides)
  if (!env.userDataPath || !filePath) return false
  return String(filePath).startsWith(`${photoDirOf(env)}/`)
}

function extensionOf(filePath) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(String(filePath).split('?')[0])
  if (!match) return 'jpg'
  const ext = match[1].toLowerCase()
  return ALLOWED_EXTENSIONS.includes(ext) ? ext : 'jpg'
}

/**
 * 把临时路径转成永久路径。已是永久路径时直接返回；没有文件系统时明确返回
 * persisted=false，调用方据此提示用户照片只在当前会话可见。
 */
export function persistPhoto(tempPath, overrides = {}) {
  const source = String(tempPath == null ? '' : tempPath)
  if (!source) return { path: '', persisted: false, copied: false }

  const env = resolvePhotoEnv(overrides)
  if (isManagedPhoto(source, overrides)) {
    return { path: source, persisted: true, copied: false }
  }
  if (!env.fs || !env.userDataPath) {
    return { path: source, persisted: false, copied: false }
  }

  const dir = photoDirOf(env)
  try {
    if (typeof env.fs.mkdirSync === 'function') {
      // 微信 FileSystemManager.mkdirSync 是位置参数：mkdirSync(dirPath, recursive)。
      env.fs.mkdirSync(dir, true)
    }
  } catch (error) {
    // 目录已存在时部分基础库会抛错，继续尝试复制。
    console.warn('[photos] mkdir skipped:', error)
  }

  const target = `${dir}/photo_${createId()}${'.'}${extensionOf(source)}`
  try {
    env.fs.copyFileSync(source, target)
  } catch (error) {
    throw new StorageError('照片保存失败，请检查存储空间后重试', error)
  }

  return { path: target, persisted: true, copied: true }
}

/** 只清理持久化目录内的照片；临时路径与空路径不会触碰。 */
export function removePhoto(filePath, overrides = {}) {
  if (!filePath) return false
  const env = resolvePhotoEnv(overrides)
  if (!env.fs || !isManagedPhoto(filePath, overrides)) return false
  try {
    env.fs.unlinkSync(filePath)
  } catch (error) {
    // 文件已经不存在时视为清理完成。
    console.warn('[photos] unlink skipped:', error && error.message)
  }
  return true
}
