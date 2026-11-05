/** 面向用户的业务错误：message 直接展示，code 用于测试与日志区分。 */
export class AppError extends Error {
  constructor(message, code = 'APP_ERROR') {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 'VALIDATION')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = '数据不存在或已被删除') {
    super(message, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class StorageError extends AppError {
  constructor(message = '本地存储读写失败', cause) {
    super(message, 'STORAGE')
    this.name = 'StorageError'
    this.cause = cause
  }
}

export class DataError extends AppError {
  constructor(message = '本地数据格式异常') {
    super(message, 'DATA')
    this.name = 'DataError'
  }
}
