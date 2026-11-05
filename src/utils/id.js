const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

function randomString(length = 6) {
  let result = ''
  for (let i = 0; i < length; i += 1) {
    result += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return result
}

/**
 * 不依赖 crypto 的本地唯一 ID：时间戳 + 随机串。
 * 单机使用足够；若以后接入云同步，需要改由服务端生成。
 */
export function createId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${randomString(6)}`
}
