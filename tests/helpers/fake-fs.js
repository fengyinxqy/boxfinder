import { vi } from 'vitest'

/**
 * 假的小程序 FileSystemManager。
 * files 里的路径视为存在；其余访问会抛错，用来覆盖「文件被外部删掉」的降级路径。
 */
export function createFakeFs(options = {}) {
  const files = new Set(options.files || [])
  const dirs = new Set(options.dirs || [])
  const calls = { copy: [], mkdir: [], unlink: [], rmdir: [], access: [] }

  return {
    files,
    dirs,
    calls,
    // 微信 FileSystemManager.mkdirSync 是位置参数：mkdirSync(dirPath, recursive)
    mkdirSync: vi.fn((dirPath, recursive) => {
      calls.mkdir.push({ dirPath, recursive })
      dirs.add(dirPath)
    }),
    copyFileSync: vi.fn((from, to) => {
      calls.copy.push({ from, to })
      files.add(to)
    }),
    unlinkSync: vi.fn((filePath) => {
      calls.unlink.push(filePath)
      if (!files.has(filePath)) throw new Error('no such file')
      files.delete(filePath)
    }),
    accessSync: vi.fn((filePath) => {
      calls.access.push(filePath)
      if (!files.has(filePath)) throw new Error('not found')
    }),
    statSync: vi.fn((filePath) => {
      if (!files.has(filePath)) throw new Error('not found')
    }),
    rmdirSync: vi.fn((dirPath, recursive) => {
      calls.rmdir.push({ dirPath, recursive })
      dirs.delete(dirPath)
    }),
  }
}
