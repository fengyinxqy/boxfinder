import { LIMITS } from '../constants/index.js'
import { StorageError, ValidationError } from '../utils/errors.js'
import { createId } from '../utils/id.js'
import { copyFile, dirPathOf, ensureDir, fileExists, removeDirAt, removeFileAt, resolveFsEnv } from './fsutil.js'
import { readRaw, removeRaw, writeRaw } from './storage.js'

/**
 * 「我的」页资料：昵称 + 头像。
 *
 * 这是纯本地资料，不是账号：独立存 key `profile`（实际键名 `mover:profile`），
 * 不进 `mover:db`、不进备份。换手机、卸载或清除数据后回默认值，这是设计而不是缺陷。
 */
export const PROFILE_KEY = 'profile'
export const PROFILE_DIR = 'profile'

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

function profileDirOf(env) {
  return dirPathOf(env, PROFILE_DIR)
}

function extensionOf(filePath) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(String(filePath).split('?')[0])
  if (!match) return 'jpg'
  const ext = match[1].toLowerCase()
  return ALLOWED_EXTENSIONS.includes(ext) ? ext : 'jpg'
}

/** 只认 USER_DATA_PATH/profile/ 下由本应用写入的头像文件。 */
export function isManagedAvatar(filePath, overrides = {}) {
  const env = resolveFsEnv(overrides)
  if (!env.userDataPath || !filePath) return false
  return String(filePath).startsWith(`${profileDirOf(env)}/`)
}

/** 昵称校验：trim 后必须是 1–20 字（空昵称只出现在从未设置过的状态）。 */
export function validateNickname(value) {
  const text = String(value == null ? '' : value).trim()
  if (!text) throw new ValidationError('请填写昵称')
  if (text.length > LIMITS.nickname) {
    throw new ValidationError(`昵称最多 ${LIMITS.nickname} 个字`)
  }
  return text
}

function normalizeProfile(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { nickname: '', avatarPath: '' }
  }
  // 以外部数据为准时只做防御性截断，不因为历史脏数据让整页打不开。
  const nickname = String(raw.nickname == null ? '' : raw.nickname)
    .trim()
    .slice(0, LIMITS.nickname)
  const avatarPath = String(raw.avatarPath == null ? '' : raw.avatarPath).trim()
  return { nickname, avatarPath }
}

/**
 * 读取资料。头像文件被手动删除时静默降级为默认头像，并带出 avatarMissing，
 * 由页面负责只提示一次；这里不抛错，避免白屏。
 */
export function loadProfile(overrides = {}) {
  const profile = normalizeProfile(readRaw(PROFILE_KEY, null))
  if (!profile.avatarPath) return { ...profile, avatarMissing: false }

  const env = resolveFsEnv(overrides)
  if (isManagedAvatar(profile.avatarPath, overrides) && !fileExists(env, profile.avatarPath)) {
    return { ...profile, avatarPath: '', avatarMissing: true }
  }
  return { ...profile, avatarMissing: false }
}

/** 保存资料；头像路径只接受受管文件，临时路径不落库。 */
export function saveProfile(input = {}, overrides = {}) {
  const nickname = validateNickname(input.nickname)
  const rawAvatar = String(input.avatarPath == null ? '' : input.avatarPath).trim()
  const avatarPath = rawAvatar && isManagedAvatar(rawAvatar, overrides) ? rawAvatar : ''

  const profile = { nickname, avatarPath, updatedAt: Date.now() }
  writeRaw(PROFILE_KEY, profile)
  return { nickname: profile.nickname, avatarPath: profile.avatarPath, avatarMissing: false }
}

/**
 * 把 chooseAvatar 返回的临时文件复制到 USER_DATA_PATH/profile/。
 * 没有文件系统（H5）时返回 persisted=false，调用方据此提示头像无法保存。
 */
export function persistAvatar(tempPath, overrides = {}) {
  const source = String(tempPath == null ? '' : tempPath)
  if (!source) return { path: '', persisted: false, copied: false }
  if (isManagedAvatar(source, overrides)) {
    return { path: source, persisted: true, copied: false }
  }

  const env = resolveFsEnv(overrides)
  if (!env.fs || !env.userDataPath) {
    return { path: source, persisted: false, copied: false }
  }

  const dir = profileDirOf(env)
  ensureDir(env, dir)
  const target = `${dir}/avatar_${createId()}${'.'}${extensionOf(source)}`
  try {
    copyFile(env, source, target)
  } catch (error) {
    throw new StorageError('头像保存失败，请检查存储空间后重试', error)
  }
  return { path: target, persisted: true, copied: true }
}

/** 只删除受管头像文件；外部路径不会被触碰。 */
export function removeAvatar(filePath, overrides = {}) {
  if (!filePath) return false
  const env = resolveFsEnv(overrides)
  if (!env.fs || !isManagedAvatar(filePath, overrides)) return false
  removeFileAt(env, filePath)
  return true
}

/** 清除资料与头像目录（「清除本地数据」的一部分）。 */
export function clearProfile(overrides = {}) {
  removeRaw(PROFILE_KEY)
  const env = resolveFsEnv(overrides)
  if (env.fs && env.userDataPath) {
    removeDirAt(env, profileDirOf(env))
  }
}
