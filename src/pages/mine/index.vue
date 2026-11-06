<template>
  <view class="page page--tabbar">
    <!-- 身份卡：纯本地资料，不是账号 -->
    <view class="identity">
      <image class="identity__avatar" :src="avatarSrc" mode="aspectFill" />
      <view class="identity__body">
        <text class="identity__name">{{ profile.nickname || '未设置昵称' }}</text>
        <text class="identity__hint">资料只保存在本机</text>
      </view>
      <view class="identity__edit" hover-class="press" @tap="openEditor">编辑资料</view>
    </view>

    <!-- 数据概览：全部历史汇总 -->
    <view class="overview">
      <text class="overview__value">
        {{ overview.moves }} 次搬家 · {{ overview.boxes }} 个箱子 · {{ overview.items }} 件物品
      </text>
      <text class="overview__hint">含历史搬家</text>
    </view>

    <view class="section">
      <text class="section__title">数据</text>
      <view class="row row--action" hover-class="press" @tap="openExport">
        <text class="row__label">导出备份</text>
        <text class="row__action">打开</text>
      </view>
      <view class="row row--action" hover-class="press" @tap="openRestore">
        <text class="row__label">恢复备份</text>
        <text class="row__action">打开</text>
      </view>
      <view class="row">
        <text class="row__label">当前占用</text>
        <text class="row__value">{{ usageText }}</text>
      </view>
      <text class="row__hint">照片占空间，卸载或清理微信数据会一起丢失。</text>
      <view class="row row--action" hover-class="press" @tap="handleClear">
        <text class="row__label row__label--danger">清除本地数据</text>
        <text class="row__action row__action--danger">不可恢复</text>
      </view>
    </view>

    <view class="section">
      <text class="section__title">帮助</text>
      <view class="row row--action" hover-class="press" @tap="goGuide">
        <text class="row__label">使用说明</text>
        <text class="row__action">查看</text>
      </view>
      <view class="row row--action" hover-class="press" @tap="handleLoadDemo">
        <text class="row__label">载入示例数据</text>
        <text class="row__action">执行</text>
      </view>
      <view v-if="demoExists" class="row row--action" hover-class="press" @tap="handleRemoveDemo">
        <text class="row__label">移除示例数据</text>
        <text class="row__action row__action--danger">移除</text>
      </view>
    </view>

    <view class="section">
      <text class="section__title">关于</text>
      <view class="row row--action" hover-class="press" @tap="goPrivacy">
        <text class="row__label">隐私协议</text>
        <text class="row__action">查看</text>
      </view>
      <view class="row">
        <text class="row__label">版本</text>
        <text class="row__value">{{ appInfo.text }}</text>
      </view>
    </view>

    <text class="footer">搬家装箱助手 · 单人本地版</text>

    <!-- 编辑资料 -->
    <AppDialog
      v-model="editVisible"
      title="编辑资料"
      subtitle="资料只保存在本机，换手机或清理微信数据后会丢失"
      confirm-text="保存"
      @confirm="handleSaveProfile"
      @cancel="discardDraftAvatar"
    >
      <view class="profile-form">
        <button class="avatar-pick" open-type="chooseAvatar" hover-class="press" @chooseavatar="onChooseAvatar">
          <image class="avatar-pick__img" :src="draftAvatarPreview || defaultAvatar" mode="aspectFill" />
          <text class="avatar-pick__text">更换头像</text>
        </button>
        <view class="field">
          <text class="field__label">昵称</text>
          <input
            v-model="draftNickname"
            class="field__input"
            type="nickname"
            :maxlength="nicknameLimit"
            placeholder="填写 1–20 个字"
            placeholder-class="field__placeholder"
            @input="editError = ''"
          />
          <text class="field__hint">昵称和头像不会随备份导出或恢复。</text>
        </view>
        <text v-if="editError" class="form-error">{{ editError }}</text>
      </view>
    </AppDialog>

    <!-- 导出备份 -->
    <AppDialog
      v-model="exportVisible"
      title="导出备份"
      subtitle="复制下面的文本，保存到备忘录或发给自己"
      confirm-text="复制到剪贴板"
      @confirm="copyExport"
    >
      <view class="backup-box">
        <textarea class="backup-box__text" :value="exportText" disabled />
        <text class="backup-box__meta">{{ exportMeta }}</text>
      </view>
    </AppDialog>

    <!-- 恢复备份 -->
    <AppDialog
      v-model="restoreVisible"
      title="恢复备份"
      subtitle="先校验结构，通过后才会替换现有数据；昵称和头像不会随备份恢复"
      confirm-text="校验并恢复"
      @confirm="handleRestore"
    >
      <view class="backup-box">
        <textarea
          v-model="restoreText"
          class="backup-box__text backup-box__text--input"
          placeholder="把备份 JSON 粘贴到这里"
          placeholder-class="field__placeholder"
          :maxlength="-1"
          @input="restoreError = ''"
        />
      </view>
      <text class="backup-link" @tap="pasteFromClipboard">从剪贴板粘贴</text>
      <text v-if="restoreError" class="backup-error">{{ restoreError }}</text>
      <text class="backup-tip">恢复会替换当前全部文字数据，照片、昵称和头像不会随备份恢复。</text>
    </AppDialog>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppDialog from '../../components/AppDialog.vue'
import { LIMITS } from '../../constants/index.js'
import { resolveAppInfo } from '../../services/appinfo.js'
import { parseBackup, serializeBackup } from '../../services/backup.js'
import { ensurePrivacyAuthorized } from '../../services/privacy.js'
import { loadProfile, persistAvatar, removeAvatar, saveProfile } from '../../services/profile.js'
import { isDemoMove } from '../../services/seed.js'
import { getStorageUsage } from '../../services/storage.js'
import { actions, refresh, store } from '../../store/index.js'

const DEFAULT_AVATAR = '/static/tabbar/avatar-default.png'

const profile = ref({ nickname: '', avatarPath: '', avatarMissing: false })
const usage = ref(getStorageUsage())
const appInfo = ref(resolveAppInfo())

// 「头像文件已丢失」只在本次启动提示一次，之后静默显示默认头像。
let avatarLostNotified = false

const nicknameLimit = LIMITS.nickname
const defaultAvatar = DEFAULT_AVATAR

const overview = computed(() => ({
  moves: store.db.moves.length,
  boxes: store.db.boxes.length,
  items: store.db.items.length,
}))

const avatarSrc = computed(() => profile.value.avatarPath || DEFAULT_AVATAR)
const demoExists = computed(() => store.db.moves.some(isDemoMove))
const usageText = computed(() => (usage.value.ok ? `${usage.value.currentSize} KB` : '—'))

onShow(() => {
  refresh()
  loadProfileState()
  usage.value = getStorageUsage()
  appInfo.value = resolveAppInfo()
})

function loadProfileState() {
  const next = loadProfile()
  profile.value = next
  if (next.avatarMissing && !avatarLostNotified) {
    avatarLostNotified = true
    uni.showToast({ title: '头像文件已丢失，请重新设置', icon: 'none' })
  }
}

/* ---------- 编辑资料 ---------- */

const editVisible = ref(false)
const draftNickname = ref('')
const draftAvatarPath = ref('')
const draftAvatarPreview = ref('')
const editError = ref('')

function openEditor() {
  draftNickname.value = profile.value.nickname
  draftAvatarPath.value = profile.value.avatarPath
  draftAvatarPreview.value = profile.value.avatarPath
  editError.value = ''
  editVisible.value = true
}

/** chooseAvatar 给的是临时路径，先复制到 USER_DATA_PATH/profile/ 再记进草稿。 */
function onChooseAvatar(event) {
  const tempPath = event && event.detail ? event.detail.avatarUrl : ''
  if (!tempPath) return
  try {
    const saved = persistAvatar(tempPath)
    if (!saved.persisted) {
      editError.value = '当前环境无法保存头像文件'
      return
    }
    // 同一次编辑里换过几次头像时，删掉上一个尚未保存的草稿文件。
    if (draftAvatarPath.value && draftAvatarPath.value !== profile.value.avatarPath) {
      removeAvatar(draftAvatarPath.value)
    }
    draftAvatarPath.value = saved.path
    draftAvatarPreview.value = saved.path
    editError.value = ''
  } catch (error) {
    editError.value = error.message || '头像保存失败'
  }
}

function discardDraftAvatar() {
  if (draftAvatarPath.value && draftAvatarPath.value !== profile.value.avatarPath) {
    removeAvatar(draftAvatarPath.value)
  }
  draftAvatarPath.value = ''
  draftAvatarPreview.value = ''
}

function handleSaveProfile() {
  const nickname = String(draftNickname.value || '').trim()
  if (!nickname) {
    editError.value = '请填写昵称（1–20 字）'
    return
  }
  if (nickname.length > nicknameLimit) {
    editError.value = `昵称最多 ${nicknameLimit} 个字`
    return
  }

  const previousAvatar = profile.value.avatarPath
  try {
    const next = saveProfile({ nickname, avatarPath: draftAvatarPath.value })
    // 替换头像时删除旧受管文件，占用不会随每次更换单调增长。
    if (previousAvatar && previousAvatar !== next.avatarPath) {
      removeAvatar(previousAvatar)
    }
    profile.value = next
    editVisible.value = false
    uni.showToast({ title: '资料已保存', icon: 'none' })
  } catch (error) {
    editError.value = error.message || '保存失败，请重试'
  }
}

/* ---------- 备份与恢复 ---------- */

const exportVisible = ref(false)
const exportText = ref('')
const exportMeta = computed(() => {
  if (!exportText.value) return ''
  return `当前共 ${overview.value.moves} 次搬家、${overview.value.boxes} 个箱子、${overview.value.items} 件物品；照片、昵称和头像不在备份内。`
})

const restoreVisible = ref(false)
const restoreText = ref('')
const restoreError = ref('')

async function openExport() {
  const gate = await ensurePrivacyAuthorized()
  if (!gate.ok) {
    uni.showToast({ title: gate.message, icon: 'none' })
    return
  }
  refresh()
  exportText.value = serializeBackup(store.db)
  exportVisible.value = true
}

function copyExport() {
  uni.setClipboardData({
    data: exportText.value,
    success: () => {
      exportVisible.value = false
      uni.showToast({ title: '备份已复制', icon: 'none' })
    },
    fail: () => {
      uni.showToast({ title: '复制失败，请手动选择文本', icon: 'none' })
    },
  })
}

async function openRestore() {
  const gate = await ensurePrivacyAuthorized()
  if (!gate.ok) {
    uni.showToast({ title: gate.message, icon: 'none' })
    return
  }
  restoreText.value = ''
  restoreError.value = ''
  restoreVisible.value = true
}

function pasteFromClipboard() {
  uni.getClipboardData({
    success: (res) => {
      restoreText.value = (res && res.data) || ''
      restoreError.value = ''
    },
    fail: () => {
      restoreError.value = '读取剪贴板失败，请手动粘贴'
    },
  })
}

function handleRestore() {
  restoreError.value = ''
  let parsed
  try {
    // 先完整校验，用户确认前不写库；坏文件永远不会覆盖现有数据。
    parsed = parseBackup(restoreText.value)
  } catch (error) {
    restoreError.value = error.message || '备份内容有误'
    return
  }

  const counts = {
    moves: parsed.moves.length,
    boxes: parsed.boxes.length,
    items: parsed.items.length,
  }
  uni.showModal({
    title: '恢复备份',
    content: `将用备份中的 ${counts.moves} 次搬家、${counts.boxes} 个箱子、${counts.items} 件物品替换当前全部文字数据，照片、昵称和头像不会恢复。确定继续吗？`,
    confirmText: '恢复',
    confirmColor: '#c2542f',
    success: (res) => {
      if (!res.confirm) return
      try {
        const result = actions.restoreBackup(restoreText.value)
        restoreVisible.value = false
        usage.value = getStorageUsage()
        uni.showToast({ title: `已恢复 ${result.counts.items} 件物品`, icon: 'none' })
      } catch (error) {
        restoreError.value = error.message || '恢复失败'
      }
    },
  })
}

/* ---------- 清除本地数据 ---------- */

function hasAnyData() {
  return (
    store.db.moves.length + store.db.boxes.length + store.db.items.length > 0 ||
    Boolean(profile.value.nickname) ||
    Boolean(profile.value.avatarPath)
  )
}

function handleClear() {
  if (!hasAnyData()) {
    uni.showToast({ title: '当前没有可清除的数据', icon: 'none' })
    return
  }

  uni.showModal({
    title: '清除本地数据',
    content: '将删除全部搬家记录、箱子、物品与照片文件，不可恢复。建议先导出备份。',
    cancelText: '取消',
    confirmText: '继续',
    confirmColor: '#c2542f',
    success: (res) => {
      if (!res.confirm) return
      confirmClear()
    },
  })
}

function confirmClear() {
  uni.showModal({
    title: '清除本地数据',
    content: '确认删除？删除后无法找回。',
    cancelText: '取消',
    confirmText: '确认删除',
    confirmColor: '#a83e21',
    success: (res) => {
      if (!res.confirm) return
      try {
        actions.clearAllData()
        loadProfileState()
        usage.value = getStorageUsage()
        uni.showToast({ title: '已清除', icon: 'none' })
      } catch (error) {
        uni.showToast({ title: error.message || '清除失败', icon: 'none' })
      }
    },
  })
}

/* ---------- 示例数据 ---------- */

function handleLoadDemo() {
  if (demoExists.value) {
    uni.showToast({ title: '示例数据已存在', icon: 'none' })
    return
  }
  uni.showModal({
    title: '载入示例数据',
    content: '会创建 1 个示例搬家和 3 个箱子，不影响已有记录。',
    success: (res) => {
      if (!res.confirm) return
      try {
        const result = actions.seedDemo()
        usage.value = getStorageUsage()
        uni.showToast({
          title: result.created ? `已创建 ${result.boxes} 个示例箱子` : '示例数据已存在',
          icon: 'none',
        })
      } catch (error) {
        uni.showToast({ title: error.message || '操作失败', icon: 'none' })
      }
    },
  })
}

function handleRemoveDemo() {
  uni.showModal({
    title: '移除示例数据',
    content: '将删除示例搬家，包括你在示例搬家里加的内容（箱子、物品与照片）。其他搬家不受影响。',
    cancelText: '取消',
    confirmText: '移除',
    confirmColor: '#a83e21',
    success: (res) => {
      if (!res.confirm) return
      try {
        const result = actions.removeDemo()
        usage.value = getStorageUsage()
        uni.showToast({ title: result.removed ? '示例数据已移除' : '示例数据不存在', icon: 'none' })
      } catch (error) {
        uni.showToast({ title: error.message || '移除失败', icon: 'none' })
      }
    },
  })
}

/* ---------- 导航 ---------- */

function goGuide() {
  uni.navigateTo({ url: '/pages/guide/index' })
}

function goPrivacy() {
  uni.navigateTo({ url: '/pages/privacy/index' })
}
</script>

<style scoped>
.identity {
  display: flex;
  align-items: center;
  padding: 30rpx 28rpx;
  margin: 20rpx 0 22rpx;
  background: #fffaf0;
  border: 2rpx dashed #c9a87c;
  border-radius: 24rpx;
}

.identity__avatar {
  flex-shrink: 0;
  width: 120rpx;
  height: 120rpx;
  margin-right: 24rpx;
  background: #f3ece0;
  border-radius: 50%;
}

.identity__body {
  flex: 1;
  min-width: 0;
}

.identity__name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  line-height: 1.3;
}

.identity__hint {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--c-ink-3);
}

.identity__edit {
  flex-shrink: 0;
  padding: 10rpx 22rpx;
  margin-left: 16rpx;
  font-size: 23rpx;
  color: var(--c-accent);
  background: var(--c-accent-soft);
  border-radius: 999rpx;
}

.overview {
  padding: 0 8rpx 24rpx;
}

.overview__value {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--c-ink-2);
}

.overview__hint {
  display: block;
  margin-top: 6rpx;
  font-size: 21rpx;
  color: var(--c-ink-3);
}

.section {
  padding: 8rpx 28rpx 4rpx;
  margin-bottom: 22rpx;
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: 24rpx;
}

.section__title {
  display: block;
  padding: 22rpx 0 6rpx;
  font-size: 24rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  color: var(--c-ink-3);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-top: 1rpx solid var(--c-line);
}

.section__title + .row {
  border-top: none;
}

.row__label {
  font-size: 28rpx;
  color: var(--c-ink);
}

.row__label--danger {
  color: #a83e21;
}

.row__value {
  font-size: 25rpx;
  color: var(--c-ink-3);
}

.row__action {
  padding: 4rpx 16rpx;
  font-size: 21rpx;
  color: var(--c-accent);
  background: var(--c-accent-soft);
  border-radius: 999rpx;
}

.row__action--danger {
  color: #a83e21;
  background: #fbeae4;
}

.row__hint {
  display: block;
  padding-bottom: 18rpx;
  margin-top: -8rpx;
  font-size: 21rpx;
  line-height: 1.5;
  color: var(--c-ink-3);
}

.row--action {
  cursor: pointer;
}

.press {
  opacity: 0.6;
}

.footer {
  display: block;
  padding: 24rpx 4rpx 40rpx;
  font-size: 22rpx;
  color: var(--c-ink-3);
  text-align: center;
}

/* ---------- 编辑资料 ---------- */

.profile-form {
  padding-bottom: 8rpx;
}

.avatar-pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28rpx;
}

.avatar-pick__img {
  width: 150rpx;
  height: 150rpx;
  background: #f3ece0;
  border-radius: 50%;
}

.avatar-pick__text {
  margin-top: 12rpx;
  font-size: 23rpx;
  color: var(--c-accent);
}

.field__hint {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--c-ink-3);
}

.form-error {
  display: block;
  padding: 14rpx 18rpx;
  font-size: 23rpx;
  line-height: 1.5;
  color: #a83e21;
  background: #fbeae4;
  border-radius: 12rpx;
}

/* ---------- 备份对话框 ---------- */

.backup-box {
  padding: 16rpx;
  background: var(--c-paper);
  border: 1rpx solid var(--c-line-strong);
  border-radius: 16rpx;
}

.backup-box__text {
  width: 100%;
  height: 320rpx;
  font-size: 20rpx;
  line-height: 1.5;
  color: var(--c-ink-2);
  background: transparent;
}

.backup-box__text--input {
  height: 360rpx;
  color: var(--c-ink);
}

.backup-box__meta {
  display: block;
  margin-top: 10rpx;
  font-size: 21rpx;
  line-height: 1.5;
  color: var(--c-ink-3);
}

.backup-link {
  display: inline-block;
  padding: 10rpx 0;
  margin-top: 6rpx;
  font-size: 23rpx;
  color: var(--c-accent);
}

.backup-error {
  display: block;
  padding: 12rpx 16rpx;
  margin-top: 10rpx;
  font-size: 22rpx;
  line-height: 1.5;
  color: #a83e21;
  background: #fbeae4;
  border-radius: 12rpx;
}

.backup-tip {
  display: block;
  margin-top: 12rpx;
  font-size: 21rpx;
  line-height: 1.5;
  color: var(--c-ink-3);
}
</style>
