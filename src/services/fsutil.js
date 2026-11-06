/**
 * 小程序本地文件系统的薄封装。
 *
 * 微信端通过 uni.getFileSystemManager() 访问 USER_DATA_PATH；H5 没有文件系统，
 * 所有写入能力降级为不可用，由调用方决定提示文案。单测通过 overrides 注入假 fs，
 * 不依赖真实小程序环境（photos.js 沿用自己已有的注入方式，这里只服务资料与清数据）。
 */

function uniFileSystem() {
  try {
    if (typeof uni !== 'undefined' && typeof uni.getFileSystemManager === 'function') {
      return uni.getFileSystemManager()
    }
  } catch (error) {
    console.warn('[fsutil] getFileSystemManager failed:', error)
  }
  return null
}

function uniUserDataPath() {
  try {
    if (typeof uni !== 'undefined' && uni.env && typeof uni.env.USER_DATA_PATH === 'string') {
      return uni.env.USER_DATA_PATH
    }
  } catch (error) {
    console.warn('[fsutil] uni.env.USER_DATA_PATH failed:', error)
  }
  return ''
}

export function resolveFsEnv(overrides = {}) {
  const fs = 'fs' in overrides ? overrides.fs : uniFileSystem()
  const userDataPath = 'userDataPath' in overrides ? overrides.userDataPath : uniUserDataPath()
  return { fs: fs || null, userDataPath: userDataPath || '' }
}

export function dirPathOf(env, name) {
  return `${env.userDataPath}/${name}`
}

/** 建目录；目录已存在时部分基础库会抛错，视为成功继续。 */
export function ensureDir(env, dir) {
  if (!env.fs || !env.userDataPath) return false
  try {
    if (typeof env.fs.mkdirSync === 'function') {
      // 微信 FileSystemManager.mkdirSync 是位置参数：mkdirSync(dirPath, recursive)。
      env.fs.mkdirSync(dir, true)
    }
  } catch (error) {
    console.warn('[fsutil] mkdir skipped:', error)
  }
  return true
}

/**
 * 文件是否存在。没有文件系统或没有可用的检查 API 时返回 true，
 * 避免在无法判断的环境里把正常头像误判成「文件已丢失」。
 */
export function fileExists(env, filePath) {
  if (!filePath) return false
  if (!env.fs) return true
  try {
    if (typeof env.fs.accessSync === 'function') {
      env.fs.accessSync(filePath)
      return true
    }
    if (typeof env.fs.statSync === 'function') {
      env.fs.statSync(filePath)
      return true
    }
  } catch (error) {
    return false
  }
  return true
}

export function copyFile(env, from, to) {
  env.fs.copyFileSync(from, to)
}

/** 删除单个文件；文件已经不存在时视为清理完成。 */
export function removeFileAt(env, filePath) {
  if (!env.fs || !filePath) return false
  try {
    env.fs.unlinkSync(filePath)
  } catch (error) {
    console.warn('[fsutil] unlink skipped:', error && error.message)
  }
  return true
}

/** 递归删除目录；目录不存在时静默跳过，不影响「数据已清除」的结果。 */
export function removeDirAt(env, dir) {
  if (!env.fs || !env.userDataPath || !dir) return false
  if (typeof env.fs.rmdirSync === 'function') {
    try {
      // 微信 FileSystemManager.rmdirSync 是位置参数：rmdirSync(dirPath, recursive)。
      env.fs.rmdirSync(dir, true)
      return true
    } catch (error) {
      console.warn('[fsutil] rmdir skipped:', error && error.message)
    }
  }

  // 兜底：基础库不支持递归删除时，逐个删除目录内文件再移除目录。
  try {
    const entries = typeof env.fs.readdirSync === 'function' ? env.fs.readdirSync(dir) : []
    entries.forEach((name) => {
      try {
        if (typeof env.fs.unlinkSync === 'function') env.fs.unlinkSync(`${dir}/${name}`)
      } catch (error) {
        console.warn('[fsutil] unlink skipped:', error && error.message)
      }
    })
    if (typeof env.fs.rmdirSync === 'function') env.fs.rmdirSync(dir)
    return true
  } catch (error) {
    return false
  }
}
