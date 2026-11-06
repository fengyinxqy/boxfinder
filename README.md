# 搬家装箱助手（M1–M6 + 我的 tab，v1.0.0）

面向个人用户的微信小程序：搬家时给纸箱写上编号，按编号管理目标房间和箱内物品。第一版是**单人本地版**，不登录、不上云。

- 技术栈：uni-app + Vue 3（组合式 API）+ Vite
- 目标平台：微信小程序
- 数据：微信本地存储，单 key 存整库
- 当前范围：M1 脚手架与数据层、M2 搬家与箱子、M3 物品核心流程、M4 搜索与状态、M5 照片与数据保护、M6 收尾与提审材料

## 当前进度

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M1 | 项目脚手架、数据结构、本地存储封装、示例数据 | 已完成 |
| M2 | 搬家创建/改名/列表，箱子新建/编辑/编号/删除 | 已完成 |
| M3 | 物品新增/编辑/删除/连续录入 | 已完成 |
| M4 | 模糊搜索、箱号查询、物品移箱、状态流转、筛选与进度 | 已完成 |
| M5 | 照片持久化、备份导出/恢复、空状态与校验 | 已完成 |
| M6 | 真机走查、隐私说明、提审材料 | 已完成（真机走查待人工） |
| v1.1 | 底部「搬家 / 我的」双 tab、本地资料（头像昵称）、数据管理、隐私协议、版本号 | 已完成（真机走查与截图重出待排） |

## 目录结构

```text
mover-box-helper/
├─ src/
│  ├─ main.js                 # 应用入口，启动时 bootstrap store
│  ├─ App.vue                 # 全局样式与主题变量
│  ├─ manifest.json           # 应用配置（mp-weixin appid 在此）
│  ├─ pages.json              # 页面路由与导航栏
│  ├─ pages/
│  │  ├─ index/index.vue      # 「搬家」tab：列表、新建、改名
│  │  ├─ mine/index.vue       # 「我的」tab：资料、概览、备份、示例数据、清除数据
│  │  ├─ move/detail.vue      # 搬家详情：搜索入口、状态筛选、进度、箱子列表
│  │  ├─ box/detail.vue       # 箱子详情：大号箱号、状态流转、物品清单、移箱
│  │  ├─ item/form.vue        # 添加/编辑物品：名称、数量、照片、连续添加
│  │  ├─ search/index.vue     # 搜索结果：名称模糊搜索、箱号查询、跳转箱子
│  │  ├─ guide/index.vue      # 使用说明（本地静态）
│  │  └─ privacy/index.vue    # 隐私协议（本地渲染全文）
│  ├─ static/tabbar/          # tabBar 图标与默认头像（4 + 1 张 PNG）
│  ├─ components/
│  │  ├─ AppDialog.vue        # 底部弹窗容器
│  │  ├─ MoveFormDialog.vue   # 搬家新建/改名表单
│  │  ├─ BoxFormDialog.vue    # 箱子新建/编辑表单
│  │  ├─ MoveItemDialog.vue   # 移箱目标箱子选择
│  │  ├─ EmptyState.vue       # 空状态
│  │  └─ StatusChip.vue       # 箱子状态标签
│  ├─ services/
│  │  ├─ storage.js           # uni storage 底层封装
│  │  ├─ db.js                # schema、读写、迁移入口
│  │  ├─ moves.js             # 搬家业务
│  │  ├─ boxes.js             # 箱子业务、箱号分配与状态流转
│  │  ├─ items.js             # 物品业务、箱内清单与移箱
│  │  ├─ search.js            # 名称模糊搜索与箱号查询
│  │  ├─ photos.js            # 照片临时路径 → USER_DATA_PATH 永久路径
│  │  ├─ profile.js           # 昵称头像（独立 key，不进 db / 备份）
│  │  ├─ fsutil.js            # 文件系统薄封装（建目录、判存在、递归删除）
│  │  ├─ privacy.js           # 隐私授权闸门（requirePrivacyAuthorize）
│  │  ├─ appinfo.js           # 版本号与环境标签
│  │  ├─ backup.js            # 备份导出、结构校验与恢复
│  │  ├─ reset.js             # 清除全部本地数据
│  │  └─ seed.js              # 示例数据（幂等、可移除）
│  ├─ store/index.js          # 模块级响应式 store + actions
│  ├─ constants/index.js      # schema 版本、状态枚举、长度限制
│  └─ utils/                  # id、日期格式化、错误类型
├─ tests/                     # Vitest 单元测试（模拟 uni storage）
├─ scripts/e2e-h5.mjs         # H5 端到端回归脚本
├─ docs/                      # 提审材料
│  ├─ privacy.md              # 用户隐私保护指引草案
│  ├─ release-checklist.md    # 提审材料清单
│  ├─ manual-walkthrough.md   # 五分钟走查清单
│  ├─ assets/icon-144.png     # 小程序图标
│  └─ screenshots/            # 提审截图 750×1334
├─ dist/
│  ├─ build/mp-weixin/        # 已构建的微信小程序产物（可直接导入）
│  └─ build/h5/               # H5 预览与端到端回归产物
├─ vite.config.js
├─ vitest.config.js
└─ package.json
```

## 本地运行

要求 Node.js 20 或更高版本（当前验证环境为 Node 22）。

```bash
npm install
npm test                      # 单元测试
npm run build:mp-weixin       # 构建微信小程序
```

### H5 端到端回归

```bash
npm run test:e2e
```

- 自动执行 `build:h5`，启动本地静态服务，用无头 Chrome/Edge 跑完整流程。
- 需要本机安装 Chrome 或 Edge；安装在非默认位置时用 `CHROME_PATH` 指定可执行文件。
- 覆盖：创建搬家 → 5 箱 30 件 → 搜索名称/箱号 → 点结果进箱子 → 移箱 → 重搜结果同步 → 四态流转 → 状态筛选 → 进度变化 → 重载持久化 → 双 tab 切换 → 编辑昵称并重启可见 → 示例数据载入/去重/移除 → 使用说明 → 断网隐私协议 → 备份导出/同机恢复/换机恢复 → 清除数据二次确认与空数据 → 坏备份回滚。
- 截图输出到 `e2e-artifacts/`（已加入 .gitignore），失败时脚本以非 0 退出码结束。

### 导入微信开发者工具

1. 打开微信开发者工具，选择「导入项目」。
2. 目录选择本项目的 `dist/build/mp-weixin`（已随包提供，无需先构建）。
3. AppID 填自己的小程序 AppID；没有时可先选「测试号」或游客模式。
4. 点击导入即可在模拟器里操作。

日常开发使用 watch 模式：

```bash
npm run dev:mp-weixin
```

然后把 `dist/dev/mp-weixin` 导入开发者工具，修改源码会自动重新编译。

> `src/manifest.json` 里 `mp-weixin.appid` 目前是 `touristappid`，仅用于本地预览。正式开发请替换为自己的 AppID。

### H5 预览（可选）

```bash
npm run dev:h5
```

浏览器打开终端提示的地址即可。H5 使用 localStorage 模拟本地存储，仅用于快速看界面和跑端到端回归。

## 数据结构（schema v1）

```js
{
  schemaVersion: 1,
  moves: [
    { id, name, createdAt, updatedAt, nextBoxNo, isDemo? }
  ],
  boxes: [
    { id, moveId, no, room, note, status, createdAt, updatedAt }
  ],
  items: [
    { id, boxId, name, quantity, photoPath, createdAt }
  ]
}
```

- `id` 与展示箱号分离：物品只关联 `boxId`，用户看到的是 `no` 对应的「3 号箱」。
- `move.nextBoxNo` 是箱号分配游标，只增不减。
- `status` 取值：`packing` / `sealed` / `moved` / `unpacked`。
- `move.isDemo` 只用于「移除示例数据」定位，不升 schema；旧示例数据没有该字段时按名称兼容。

## 存储层接口

```js
// services/storage.js
readRaw(key, fallback)        // 读原始值，异常向上抛
writeRaw(key, value)          // 写原始值，配额不足转成可读错误
removeRaw(key)
getStorageUsage()             // 「我的」页展示占用；取不到时 ok=false

// services/db.js
loadDb()                      // 读取 + 版本校验 + 结构归一化
saveDb(db)
mutate((draft) => result)     // 读-改-写；回调抛错不落盘

// services/moves.js
listMoves() / getMove(id) / createMove(name) / renameMove(id, name)

// services/boxes.js
listBoxes(moveId) / getBox(id) / createBox(moveId, { room, note })
updateBox(id, { room, note }) / deleteBox(id)
setBoxStatus(id, status) / boxStats(moveId)

// services/items.js
listItems(boxId) / getItem(id) / createItem(boxId, { name, quantity })
updateItem(id, { name, quantity }) / deleteItem(id)
moveItem(itemId, targetBoxId) / countItems(boxId)

// services/search.js
searchMove(moveId, query)             // 读当前本地库
searchInDb(db, moveId, query)          // 用传入快照搜索，页面直接传 store.db
```

## 搜索规则

- 物品名称按包含关系模糊匹配，英文不区分大小写。
- 输入纯数字（支持「3」「3号」「3 号箱」「03」）时按箱号查询，空箱也能查到箱号、房间与件数。
- 每条结果都显示「N 号箱 · 目标房间」，点击进入对应箱子详情。
- 只搜索当前搬家的箱子；换箱子或移箱后回到搜索页会自动重算。

## 照片规则

- 拍照或从相册选图后，先把临时路径复制到 `USER_DATA_PATH/photos/` 下再写入物品数据，临时路径不会落库。
- 每件物品最多 1 张照片；换图或移除时清理旧的受管文件，删除物品与删除箱子也会清理对应照片文件。
- H5 没有文件系统，`persistPhoto` 会返回 `persisted: false`，页面明确提示「当前环境无法写入持久目录」，保存时照片字段留空，不写入 blob 临时路径。
- 照片不在备份包内；恢复备份后照片字段一律为空，需要重新拍照或选图。

## 备份与恢复规则

- 导出内容包含 `app`、`schemaVersion`、`exportedAt`（ISO 时间）、`counts` 与 `moves` / `boxes` / `items`，并标记 `photoIncluded: false`，明确不含照片。
- 恢复时先完整校验：JSON 合法性、应用标识、schema 版本、三张表齐全、ID 不重复、箱子→搬家与物品→箱子的关联、必填字段与数量范围；任一项不通过就给出可读提示，且不会写库。
- 校验通过后整体替换本地文字数据，不保留恢复前的旧记录。

## 「我的」资料与清除数据规则

- 昵称与头像是纯本地资料，不是账号：独立存 `mover:profile`，不写 `mover:db`、不进备份，不取微信真实头像昵称。
- 昵称 trim 后 1–20 字；头像经 `chooseAvatar` 选择后复制到 `USER_DATA_PATH/profile/`，替换时删除旧受管文件，占用不单调增长。
- 头像文件被手动删除时静默回默认头像，并在本次启动提示一次「头像文件已丢失，请重新设置」，不白屏、不报错。
- 清除本地数据必须两段确认，第二段按钮为红色「确认删除」；执行后删除 `mover:db`、`mover:profile`、`photos/`、`profile/` 并重置 store。
- 空数据时只 toast「当前没有可清除的数据」，不弹确认。
- 示例数据在正式版也可见；「移除示例数据」级联删除示例搬家及其箱子、物品、照片（含用户后加的内容），其他搬家不受影响。
- 版本行优先取 `getAccountInfoSync().miniProgram.version`，为空时退回 `manifest.versionName`；环境标签由 `envVersion` 映射，全部取不到也不留空。
- 隐私授权走 `wx.requirePrivacyAuthorize`：拒绝后照片与备份入口给可读提示，文字记录仍可用；H5/旧基础库直接放行。

## 物品与移箱规则

- 名称必填，最多 30 个字；数量默认 1，范围 1–999 的整数。
- 物品只关联 `boxId`，清单一律显示所属箱号（如「3 号箱」）。
- 支持「保存并继续添加」：保存后停留在表单并清空名称，连续录入同一箱物品。
- 移箱只能在同一搬家内进行；目标就是当前箱子时拒绝移动。
- 移箱后来源箱、目标箱的清单和搜索结果同时更新。
- 照片字段目前只占位，不调用相机/相册，数据里保留空 `photoPath`。
- 删除物品只移除该条记录；删除箱子会级联删除箱内物品。

## 箱子规则

- 每次搬家从 1 号开始，新箱子取 `max(nextBoxNo, 当前最大箱号 + 1)`。
- 删除箱子不回收编号，`nextBoxNo` 不回退，所以后续新箱一定使用更大的编号。
- 箱号创建后不可修改；删除箱子会级联删除该箱物品。
- 状态流转：装箱中 → 已封箱 → 已搬运 → 已拆箱，允许直接改回之前的状态。
- 箱子列表支持按状态筛选，并显示箱子总数、已拆箱数与拆箱进度。

## 已知边界

- 单个存储 key 上限约 10MB。当前只存文字，量级可控；物品量增长后需要把明细迁到 `uni.getFileSystemManager()` 的 `USER_DATA_PATH`，届时按 `db.js` 注释补迁移。
- 备份只含文字数据、不含照片；恢复后照片字段为空。「我的」页已明确提示卸载或清理微信数据会丢失记录与照片。
- 昵称与头像只在本机保存：换手机、卸载、清理微信数据或「清除本地数据」后即丢失，这是 v1 边界的既定代价，已在页面文案与隐私协议中说明。
- 用户选图后直接离开表单时，可能留下未被引用的照片文件；不影响功能，后续可加定期清理。
- 照片持久化与重启后可见已在微信开发者工具（真实 AppID `wx634a8ae7205ea24e`）验证；真机仍按 `docs/manual-walkthrough.md` 人工走查。
- 除「移除示例数据」外，普通搬家仍不支持删除（v1 边界，未实现）。
- 隐私授权弹窗属于原生交互，自动化无法点击；拒绝后的降级路径需在真机按走查清单确认。

## 边界变更记录

| 日期 | 变更项 | 原边界（POLA-1） | 变更后 | 批准人 | 原因 |
|---|---|---|---|---|---|
| 2026-11-06 | 底部多标签导航 | 「第一版不做底部多标签导航」，页面为「首页 + 下钻」 | 底部 2 个 tab：「搬家」「我的」；非 tab 页仍用 `navigateTo` | 肖祺彦（POLA-6 决定） | 需要一个承载本地资料、数据管理、隐私协议与版本号的入口；把 v1「数据与说明」页整体并入「我的」并删除独立页，避免两处设置 |

影响：

- 提审截图与 M6 材料需按 2 tab 结构重出（`docs/screenshots/` 现有 5 张已过期，重出不在本次实现范围）。
- 真机走查在 `docs/manual-walkthrough.md` 原 9 步基础上追加「我的」8 步。
- tabBar 需要 4 张 81×81 PNG 图标（由「POLA-6 图标」子任务交付）；微信 tabBar 不认 SVG / 字体图标 / emoji。
- 不变：仍然不做登录、账号体系、云同步、多端同步、家庭协作；昵称头像不进备份。

## 提审材料

- 隐私保护指引草案（含摄像头、相册、剪贴板声明与可粘贴正文）：`docs/privacy.md`
- 提审材料清单（名称、简介、类目、图标、截图、备案状态）：`docs/release-checklist.md`
- 五分钟真机/模拟器走查清单：`docs/manual-walkthrough.md`
- 图标与截图：`docs/assets/icon-144.png`、`docs/screenshots/01-home.png` ~ `05-settings.png`

## 验证

```bash
npm test            # 13 个测试文件、97 条用例
npm run build:mp-weixin
npm run test:e2e    # 87 项 H5 端到端检查
```

单元测试覆盖：搬家创建/改名持久化、箱号连续分配、删除后不复用、跨“重启”继续递增、删除箱子级联清理物品、物品新增/编辑/删除与持久化、名称与数量校验、箱内清单归属、名称模糊搜索、箱号查询、移箱与搜索同步、状态流转与改回、状态统计、照片临时路径转永久路径与清理、照片路径随物品持久化、备份导出结构（不含照片）、恢复数量与关联一致、坏备份拒绝且原数据不变、store 刷新、数据格式损坏保护、示例数据幂等与移除级联、资料读写与昵称校验、头像落盘/替换/丢失降级、清除数据、版本行兜底、隐私授权闸门、存储写入失败提示。

端到端覆盖：5 箱 30 件录入与逐箱件数核对、搜索「充电器」定位到「3 号箱 · 书房」、点结果进箱子、移箱到 5 号箱、重搜结果同步、查箱号 2、四态流转、按已拆箱筛选、拆箱进度变化、改回状态、重载后数据与搜索仍正确、照片选择与预览（H5 调用路径）、双 tab 切换与概览口径、编辑昵称并重启可见、昵称边界、示例数据载入/去重/移除、使用说明、断网隐私协议、备份导出结构（不含昵称头像）、同机恢复不动资料、清除数据二次确认与取消、空数据只 toast、换机恢复回默认、坏备份失败后原数据不变、页面无 JS 运行时错误。

## 端到端验证的边界

- 照片「临时路径 → 永久路径」的真实写入只在微信小程序端发生，H5 验证的是选择、预览与「不把临时路径写进数据」的调用路径；持久化与重启后可见需要在小程序端确认。
- 微信开发者工具 CLI 端口已开、`cli islogin` 返回 `{"login":true}`，但 `cli open --project` 因 `project.config.json` 仍是 `touristappid` 报 `code 10：不存在此 AppID`，`--appid` 在传 `--project` 时会被忽略；模拟器走查需要真实 AppID 或测试号。
