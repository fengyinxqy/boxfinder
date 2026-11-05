/** 本地数据结构版本；后续改动结构时递增，并在 db.js 里写迁移。 */
export const SCHEMA_VERSION = 1

/** 输入长度限制，服务层与界面校验共用，避免两处规则不一致。 */
export const LIMITS = {
  moveName: 20,
  room: 16,
  note: 60,
}

export const BOX_STATUS = {
  packing: { label: '装箱中', tone: 'packing' },
  sealed: { label: '已封箱', tone: 'sealed' },
  moved: { label: '已搬运', tone: 'moved' },
  unpacked: { label: '已拆箱', tone: 'unpacked' },
}

export const BOX_STATUS_LIST = Object.keys(BOX_STATUS).map((key) => ({
  key,
  ...BOX_STATUS[key],
}))

export const ROOM_PRESETS = ['卧室', '客厅', '厨房', '书房', '卫生间', '阳台', '储物间']

export const DEMO_MOVE_NAME = '示例：我的第一次搬家'
