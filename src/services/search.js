import { loadDb } from './db.js'

// 「3」「3号」「3 号箱」「03」都按箱号查；其他输入按物品名称模糊匹配。
const BOX_QUERY = /^0*(\d+)\s*号?\s*箱?$/

function normalizeQuery(raw) {
  return String(raw == null ? '' : raw).trim()
}

/**
 * 在当前搬家内搜索：物品名称模糊匹配 + 直接查箱号。
 * 返回成对的 item/box，页面无需再自己关联箱号与目标房间。
 */
export function searchMove(moveId, rawQuery) {
  return searchInDb(loadDb(), moveId, rawQuery)
}

/** 用调用方给的库快照搜索，页面可直接传 store.db，写入后自动重算。 */
export function searchInDb(db, moveId, rawQuery) {
  const query = normalizeQuery(rawQuery)
  if (!query) return { query: '', items: [], boxes: [] }

  const boxes = db.boxes.filter((box) => box.moveId === moveId)
  const boxMap = new Map(boxes.map((box) => [box.id, box]))

  const boxNoMatch = BOX_QUERY.exec(query)
  const wantedNo = boxNoMatch ? Number(boxNoMatch[1]) : null
  const lowerQuery = query.toLowerCase()

  const items = db.items
    .filter((item) => {
      const box = boxMap.get(item.boxId)
      if (!box) return false
      return String(item.name).toLowerCase().includes(lowerQuery)
    })
    .map((item) => ({ item, box: boxMap.get(item.boxId) }))
    .sort((a, b) => a.box.no - b.box.no || a.item.createdAt - b.item.createdAt)

  const boxResults =
    wantedNo === null
      ? []
      : boxes
          .filter((box) => Number(box.no) === wantedNo)
          .sort((a, b) => a.no - b.no)
          .map((box) => ({
            box,
            itemCount: db.items.filter((item) => item.boxId === box.id).length,
          }))

  return { query, items, boxes: boxResults }
}
