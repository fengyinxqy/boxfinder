/**
 * H5 端到端回归脚本（M4 起纳入仓库，每轮一键回归）。
 *
 * 运行：npm run test:e2e
 * 依赖：本机 Chrome 或 Edge（可用 CHROME_PATH 指定），以及 dist/build/h5 构建产物。
 *
 * 覆盖：创建搬家 → 5 箱 30 件物品 → 搜索名称 / 箱号 → 点结果进箱子 →
 *       物品移箱 → 重搜结果同步 → 四态流转 → 状态筛选 → 进度变化 → 重载持久化。
 */
import http from 'node:http'
import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WEB_ROOT = path.join(REPO_ROOT, 'dist', 'build', 'h5')
const ARTIFACT_DIR = path.join(REPO_ROOT, 'e2e-artifacts')

const MOVE_NAME = '我的第一次搬家'
const ITEMS = {
  卧室: ['被子', '枕头', '床单', '窗帘', '衣架', '收纳盒'],
  厨房: ['炒锅', '汤锅', '碗', '盘子', '筷子', '调料瓶', '保鲜盒'],
  书房: ['65W 充电器', '笔记本电脑', '键盘', '鼠标', '移动硬盘', '书'],
  客厅: ['电视遥控器', '路由器', '插线板', '抱枕', '地毯', '落地灯'],
  卫生间: ['毛巾', '牙刷杯', '洗发水', '沐浴露', '吹风机'],
}
const ROOMS = Object.keys(ITEMS)
const TOTAL_ITEMS = Object.values(ITEMS).reduce((sum, list) => sum + list.length, 0)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const passed = []
const failed = []
const pageErrors = []

function check(name, condition, detail = '') {
  if (condition) {
    passed.push(name)
    console.log(`  PASS ${name}`)
  } else {
    failed.push(`${name}${detail ? ` (${detail})` : ''}`)
    console.log(`  FAIL ${name}${detail ? ` (${detail})` : ''}`)
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
}

function startStaticServer() {
  const server = http.createServer(async (req, res) => {
    const pathname = decodeURIComponent((req.url || '/').split('?')[0])
    const isAsset = path.extname(pathname) !== ''
    let file = path.join(WEB_ROOT, pathname === '/' ? 'index.html' : pathname)
    if (!file.startsWith(WEB_ROOT)) file = path.join(WEB_ROOT, 'index.html')
    if (!existsSync(file) && !isAsset) file = path.join(WEB_ROOT, 'index.html')
    try {
      const body = await readFile(file)
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean)
  return candidates.find((candidate) => existsSync(candidate)) || ''
}

async function main() {
  if (!existsSync(path.join(WEB_ROOT, 'index.html'))) {
    throw new Error('缺少 dist/build/h5，请先执行 npm run build:h5')
  }
  mkdirSync(ARTIFACT_DIR, { recursive: true })

  const executablePath = findBrowser()
  if (!executablePath) throw new Error('未找到 Chrome/Edge，可用 CHROME_PATH 指定浏览器路径')

  const { server, port } = await startStaticServer()
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'],
    defaultViewport: { width: 390, height: 844 },
  })
  const page = await browser.newPage()
  page.on('pageerror', (error) => pageErrors.push(error.message))

  const bodyText = () => page.evaluate(() => document.body.innerText)
  const count = (selector) => page.$$eval(selector, (elements) => elements.length)

  async function waitFor(predicate, description, timeout = 12000) {
    const started = Date.now()
    while (Date.now() - started < timeout) {
      try {
        if (await predicate()) return true
      } catch {
        // 页面切换过程中的瞬时错误继续轮询
      }
      await sleep(150)
    }
    throw new Error(`等待超时：${description}`)
  }

  async function waitText(text, timeout) {
    await waitFor(async () => (await bodyText()).includes(text), `页面出现「${text}」`, timeout)
  }

  async function clickButton(label) {
    const ok = await page.evaluate((text) => {
      const button = [...document.querySelectorAll('uni-button')].find(
        (element) => (element.innerText || '').trim() === text
      )
      if (!button) return false
      button.click()
      return true
    }, label)
    if (!ok) {
      await screenshot(`error-button-${label}.png`).catch(() => {})
      const state = await page.evaluate(() => ({
        hash: location.hash,
        buttons: [...document.querySelectorAll('uni-button')].map((element) => (element.innerText || '').trim()),
        tail: document.body.innerText.slice(-400),
      }))
      throw new Error(
        `找不到按钮：${label} | hash=${state.hash} | buttons=${JSON.stringify(state.buttons)} | text=${state.tail}`
      )
    }
    await sleep(220)
  }

  async function clickIn(selector, text) {
    const ok = await page.evaluate(
      ({ selector: target, text: needle }) => {
        const element = [...document.querySelectorAll(target)].find(
          (entry) => !needle || (entry.innerText || '').includes(needle)
        )
        if (!element) return false
        element.click()
        return true
      },
      { selector, text }
    )
    if (!ok) throw new Error(`点击失败：${selector} 包含「${text}」`)
    await sleep(240)
  }

  async function clickActionInRow(rowText, selector) {
    const ok = await page.evaluate(
      ({ rowText: needle, selector: target }) => {
        const row = [...document.querySelectorAll('.item-row')].find((entry) =>
          (entry.innerText || '').includes(needle)
        )
        if (!row) return false
        const action = row.querySelector(target)
        if (!action) return false
        action.click()
        return true
      },
      { rowText, selector }
    )
    if (!ok) throw new Error(`在包含「${rowText}」的行里找不到 ${selector}`)
    await sleep(240)
  }

  async function fillInput(value, index = 0) {
    const inputs = await page.$$('input')
    if (!inputs[index]) throw new Error(`找不到第 ${index + 1} 个输入框`)
    await inputs[index].click()
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.keyboard.type(value, { delay: 6 })
    await sleep(120)
  }

  async function navTo(url) {
    await page.evaluate((target) => {
      location.hash = `#${target}`
    }, url)
    await sleep(450)
  }

  async function navBack() {
    const viaHead = await page.evaluate(() => {
      const button = document.querySelector('uni-page-head .uni-page-head-btn')
      if (!button) return false
      button.click()
      return true
    })
    if (!viaHead) await page.evaluate(() => history.back())
    await sleep(500)
  }

  async function screenshot(name) {
    await page.screenshot({ path: path.join(ARTIFACT_DIR, name) })
  }

  try {
    await page.goto(`http://127.0.0.1:${port}/#/pages/index/index`, { waitUntil: 'networkidle0' })
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'networkidle0' })
    await waitText('还没有搬家记录')
    check('首页空状态正常', true)

    // ---- 创建搬家 ----
    await clickButton('新建搬家')
    await page.waitForSelector('.dialog__panel', { visible: true })
    await fillInput(MOVE_NAME)
    await clickButton('保存')
    await page.waitForSelector('.dialog__panel', { hidden: true })
    await waitText(MOVE_NAME)
    check('创建「我的第一次搬家」', true)

    await clickIn('.move-card', MOVE_NAME)
    await waitText('箱子列表')

    // ---- 5 个箱子 ----
    for (let index = 0; index < ROOMS.length; index += 1) {
      await clickButton('添加箱子')
      await page.waitForSelector('.dialog__panel', { visible: true })
      await fillInput(ROOMS[index])
      await clickButton('保存')
      await page.waitForSelector('.dialog__panel', { hidden: true })
      await waitFor(async () => (await count('.box-row')) === index + 1, `第 ${index + 1} 个箱子`)
    }
    check('5 个箱子按 1–5 号编号', (await count('.box-row')) === 5)
    await screenshot('01-move-boxes.png')

    // ---- 30 件物品（每箱一次「保存并继续添加」连续录入）----
    for (const room of ROOMS) {
      const names = ITEMS[room]
      await clickIn('.box-row', room)
      await waitText('箱内物品')

      await clickButton('添加物品')
      await waitText('物品名称')

      for (let index = 0; index < names.length; index += 1) {
        await fillInput(names[index])
        if (index < names.length - 1) {
          await clickButton('保存并继续添加')
          await waitFor(
            async () => page.evaluate(() => document.querySelector('input').value === ''),
            '「保存并继续添加」后清空名称'
          )
        } else {
          await clickButton('保存')
          await waitText('箱内物品')
        }
      }

      await waitFor(async () => (await count('.item-row')) === names.length, `${room} 件数`)
      check(`${room} 箱内 ${names.length} 件`, (await count('.item-row')) === names.length)
      await navBack()
      await waitText('箱子列表')
    }
    check('合计 30 件物品', TOTAL_ITEMS === 30)

    // ---- 搜索名称 ----
    await clickIn('.search-entry')
    await page.waitForSelector('.search-box', { visible: true })
    await waitText('输入物品名称或箱号')
    await fillInput('充电器')
    await waitText('3 号箱 · 书房')
    check('搜索「充电器」显示「3 号箱 · 书房」', (await bodyText()).includes('3 号箱 · 书房'))
    check('搜索结果包含 65W 充电器', (await bodyText()).includes('65W 充电器'))
    check('搜索只返回 1 条物品结果', (await count('.item-row')) === 1)
    await screenshot('02-search-result.png')

    await clickIn('.item-row', '65W 充电器')
    await waitText('箱内物品')
    const boxThreeText = await bodyText()
    check('点击搜索结果进入 3 号箱详情', boxThreeText.includes('书房') && boxThreeText.includes('65W 充电器'))

    // ---- 物品移箱 ----
    await clickActionInRow('65W 充电器', '.item-row__move')
    await page.waitForSelector('.sheet__panel', { visible: true })
    check('移箱弹窗列出其他箱子', (await bodyText()).includes('卫生间'))
    await clickIn('.target', '卫生间')
    await page.waitForSelector('.sheet__panel', { hidden: true })
    await waitFor(async () => !(await bodyText()).includes('65W 充电器'), '移箱后 3 号箱清单移除')
    check('移箱后 3 号箱清单不再显示充电器', !(await bodyText()).includes('65W 充电器'))
    check('3 号箱剩下 5 件', (await count('.item-row')) === 5)

    await navBack()
    await page.waitForSelector('.search-box', { visible: true })
    await navBack()
    await waitText('箱子列表')
    await clickIn('.box-row', '卫生间')
    await waitText('箱内物品')
    check('5 号箱清单出现充电器', (await bodyText()).includes('65W 充电器'))
    check('5 号箱变为 6 件', (await count('.item-row')) === 6)
    await navBack()
    await waitText('箱子列表')

    // ---- 移箱后重搜 ----
    await clickIn('.search-entry')
    await page.waitForSelector('.search-box', { visible: true })
    await fillInput('充电器')
    await waitText('5 号箱 · 卫生间')
    const reSearchText = await bodyText()
    check('移箱后重搜显示「5 号箱 · 卫生间」', reSearchText.includes('5 号箱 · 卫生间'))
    check('重搜不再显示 3 号箱 · 书房', !reSearchText.includes('3 号箱 · 书房'))

    // ---- 直接查箱号 ----
    await clickIn('.search-box__clear')
    await fillInput('2')
    await waitText('7 件物品')
    const boxQueryText = await bodyText()
    const boxHitText = await page.$eval('.box-row', (element) => element.innerText)
    check('查箱号「2」返回 2 号箱 · 厨房', /2\s*号箱/.test(boxHitText) && boxHitText.includes('厨房'))
    check('箱号结果显示 7 件物品', boxQueryText.includes('7 件物品'))
    await clickIn('.box-row', '厨房')
    await waitText('箱内物品')
    check('点箱号结果进入 2 号箱详情', (await bodyText()).includes('厨房'))
    await navBack()
    await page.waitForSelector('.search-box', { visible: true })
    await navBack()
    await waitText('箱子列表')

    // ---- 四态流转 ----
    await clickIn('.box-row', '卧室')
    await waitText('箱子状态')
    for (const label of ['已封箱', '已搬运', '已拆箱']) {
      await clickIn('.status-step', label)
      await waitFor(
        async () => (await page.$eval('.status-step--on', (element) => element.innerText)).includes(label),
        `状态切到${label}`
      )
    }
    check('状态可完成装箱中→已封箱→已搬运→已拆箱', (await page.$eval('.chip__label', (element) => element.innerText)) === '已拆箱')
    await screenshot('03-status-unpacked.png')
    await navBack()
    await waitText('箱子列表')
    await waitFor(
      async () => (await page.$eval('.progress__value', (element) => element.innerText)).includes('1 / 5'),
      '拆箱进度变为 1 / 5'
    )
    check('拆箱后进度显示 1 / 5 箱', (await page.$eval('.progress__value', (element) => element.innerText)).includes('1 / 5'))

    // ---- 状态筛选 ----
    await clickIn('.filter', '已拆箱')
    await waitFor(async () => (await count('.box-row')) === 1, '已拆箱筛选只剩 1 个')
    check('按「已拆箱」筛选只剩 1 个箱子', (await count('.box-row')) === 1)
    check('筛选结果为目标房间卧室', (await page.$eval('.box-row', (element) => element.innerText)).includes('卧室'))
    await clickIn('.filter', '全部')
    await waitFor(async () => (await count('.box-row')) === 5, '切回全部')
    check('切回「全部」恢复 5 个箱子', (await count('.box-row')) === 5)

    // ---- 允许改回 ----
    await clickIn('.box-row', '卧室')
    await waitText('箱子状态')
    await clickIn('.status-step', '已封箱')
    await waitFor(
      async () => (await page.$eval('.status-step--on', (element) => element.innerText)).includes('已封箱'),
      '状态改回已封箱'
    )
    check('允许从已拆箱改回已封箱', (await page.$eval('.chip__label', (element) => element.innerText)) === '已封箱')
    await navBack()
    await waitText('箱子列表')
    await waitFor(
      async () => (await page.$eval('.progress__value', (element) => element.innerText)).includes('0 / 5'),
      '改回后进度回到 0 / 5'
    )
    check('状态改回后进度回到 0 / 5 箱', (await page.$eval('.progress__value', (element) => element.innerText)).includes('0 / 5'))

    // ---- 重载持久化 ----
    await page.reload({ waitUntil: 'networkidle0' })
    await waitText('箱子列表')
    check('重载后搬家与箱子仍在', (await bodyText()).includes(MOVE_NAME) && (await count('.box-row')) === 5)
    await clickIn('.search-entry')
    await page.waitForSelector('.search-box', { visible: true })
    await fillInput('充电器')
    await waitText('5 号箱 · 卫生间')
    check('重载后搜索结果仍指向 5 号箱', (await bodyText()).includes('5 号箱 · 卫生间'))
    await screenshot('04-persisted-search.png')

    check('页面无 JS 运行时错误', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 300))
  } finally {
    await browser.close()
    server.close()
  }
}

main()
  .then(() => {
    console.log(`\n结果：${passed.length} 项通过，${failed.length} 项失败`)
    if (failed.length) {
      console.log(failed.map((item) => ` - ${item}`).join('\n'))
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('\nE2E 执行失败：', error.message)
    process.exit(1)
  })
