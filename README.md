# 搬家装箱助手（M1 + M2 + M3）

面向个人用户的微信小程序：搬家时给纸箱写上编号，按编号管理目标房间和箱内物品。第一版是**单人本地版**，不登录、不上云。

- 技术栈：uni-app + Vue 3（组合式 API）+ Vite
- 目标平台：微信小程序
- 数据：微信本地存储，单 key 存整库
- 本轮范围：M1 脚手架 + 数据层，M2 搬家与箱子，M3 物品核心流程

## 当前进度

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M1 | 项目脚手架、数据结构、本地存储封装、示例数据 | 已完成 |
| M2 | 搬家创建/改名/列表，箱子新建/编辑/编号/删除 | 已完成 |
| M3 | 物品新增/编辑/删除/连续录入 | 已完成 |
| M4 | 模糊搜索、物品移箱、箱子状态筛选与进度 | 未开始 |
| M5 | 照片持久化、备份导出/恢复、空状态与校验 | 未开始 |
| M6 | 真机走查、隐私说明、提审材料 | 未开始 |

## 目录结构

```text
mover-box-helper/
├─ src/
│  ├─ main.js                 # 应用入口，启动时 bootstrap store
│  ├─ App.vue                 # 全局样式与主题变量
│  ├─ manifest.json           # 应用配置（mp-weixin appid 在此）
│  ├─ pages.json              # 页面路由与导航栏
│  ├─ pages/
│  │  ├─ index/index.vue      # 搬家首页：列表、新建、改名
│  │  ├─ move/detail.vue      # 搬家详情：箱子列表、添加箱子
│  │  ├─ box/detail.vue       # 箱子详情：大号箱号、物品清单、编辑/删除
│  │  ├─ item/form.vue        # 添加/编辑物品：名称、数量、连续添加
│  │  └─ settings/index.vue   # 数据与说明、示例数据
│  ├─ components/
│  │  ├─ AppDialog.vue        # 底部弹窗容器
│  │  ├─ MoveFormDialog.vue   # 搬家新建/改名表单
│  │  ├─ BoxFormDialog.vue    # 箱子新建/编辑表单
│  │  ├─ EmptyState.vue       # 空状态
│  │  └─ StatusChip.vue       # 箱子状态标签
│  ├─ services/
│  │  ├─ storage.js           # uni storage 底层封装
│  │  ├─ db.js                # schema、读写、迁移入口
│  │  ├─ moves.js             # 搬家业务
│  │  ├─ boxes.js             # 箱子业务与箱号分配
│  │  ├─ items.js             # 物品业务与箱内清单
│  │  └─ seed.js              # 示例数据（幂等）
│  ├─ store/index.js          # 模块级响应式 store + actions
│  ├─ constants/index.js      # schema 版本、状态枚举、长度限制
│  └─ utils/                  # id、日期格式化、错误类型
├─ tests/                     # Vitest 单元测试（模拟 uni storage）
├─ dist/
│  ├─ build/mp-weixin/        # 已构建的微信小程序产物（可直接导入）
│  └─ build/h5/               # H5 预览产物
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

### 导入微信开发者工具

1. 打开微信开发者工具，选择「导入项目」。
2. 目录选择本项目的 `dist/build/mp-weixin`（已随包提供，无需先构建）。
3. AppID 填自己的小程序 AppID；没有时可先选「测试号」或游客模式。
4. 点击导入即可在模拟器里操作。

日常开发使用watch 模式：

```bash
npm run dev:mp-weixin
```

然后把 `dist/dev/mp-weixin` 导入开发者工具，修改源码会自动重新编译。

> `src/manifest.json` 里 `mp-weixin.appid` 目前是 `touristappid`，仅用于本地预览。正式开发请替换为自己的 AppID。

### H5 预览（可选）

```bash
npm run dev:h5
```

浏览器打开终端提示的地址即可。H5 使用 localStorage 模拟本地存储，仅用于快速看界面。

## 数据结构（schema v1）

```js
{
  schemaVersion: 1,
  moves: [
    { id, name, createdAt, updatedAt, nextBoxNo }
  ],
  boxes: [
    { id, moveId, no, room, note, status, createdAt, updatedAt }
  ],
  items: [] // M3 使用：{ id, boxId, name, quantity, photoPath, createdAt }
}
```

- `id` 与展示箱号分离：物品只关联 `boxId`，用户看到的是 `no` 对应的「3 号箱」。
- `move.nextBoxNo` 是箱号分配游标，只增不减。
- `status` 取值：`packing` / `sealed` / `moved` / `unpacked`；M2 默认 `packing`，状态切换与筛选在 M4 实现。

## 存储层接口

```js
// services/storage.js
readRaw(key, fallback)        // 读原始值，异常向上抛
writeRaw(key, value)          // 写原始值，配额不足转成可读错误
removeRaw(key)
getStorageUsage()             // 设置页展示占用

// services/db.js
loadDb()                      // 读取 + 版本校验 + 结构归一化
saveDb(db)
mutate((draft) => result)     // 读-改-写；回调抛错不落盘

// services/moves.js
listMoves() / getMove(id) / createMove(name) / renameMove(id, name)

// services/boxes.js
listBoxes(moveId) / getBox(id) / createBox(moveId, { room, note })
updateBox(id, { room, note }) / deleteBox(id) / boxStats(moveId)

// services/items.js
listItems(boxId) / getItem(id) / createItem(boxId, { name, quantity })
updateItem(id, { name, quantity }) / deleteItem(id) / countItems(boxId)
```

## 物品规则

- 名称必填，最多 30 个字；数量默认 1，范围 1–999 的整数。
- 物品只关联 `boxId`，清单一律显示所属箱号（如「3 号箱」）。
- 支持「保存并继续添加」：保存后停留在表单并清空名称，连续录入同一箱物品。
- 照片字段在 M3 只做占位，不调用相机/相册，数据里保留空 `photoPath`。
- 删除物品只移除该条记录；删除箱子会级联删除箱内物品。

## 箱号规则

- 每次搬家从 1 号开始，新箱子取 `max(nextBoxNo, 当前最大箱号 + 1)`。
- 删除箱子不回收编号，`nextBoxNo` 不回退，所以后续新箱一定使用更大的编号。
- 箱号创建后不可修改；删除箱子会级联删除该箱物品（M3 起有数据）。

## 已知边界

- 单个存储 key 上限约 10MB。当前只存文字，量级可控；物品量增长后需要把明细迁到 `uni.getFileSystemManager()` 的 `USER_DATA_PATH`，届时按 `db.js` 注释补迁移。
- 照片、备份导出/恢复尚未实现（M5）。数据说明页已明确提示卸载或清理微信数据会丢失记录。
- 备份包不包含照片，这一点会在 M5 实现时同步写进说明。
- 搬家删除不在第一版范围内，本轮未实现。
- 没有网络请求、没有用户信息采集，因此暂不涉及隐私授权接口。

## 验证

```bash
npm test
```

测试覆盖：搬家创建/改名持久化、箱号连续分配、删除后不复用、跨“重启”继续递增、删除箱子级联清理物品、物品新增/编辑/删除与持久化、名称与数量校验、箱内清单归属、数据格式损坏保护、示例数据幂等、store 刷新、存储写入失败提示。
