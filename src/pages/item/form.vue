<template>
  <view v-if="box && (!isEdit || item)" class="page page--with-bar">
    <view class="context">
      <view class="context__tag">
        <text class="context__num">{{ box.no }}</text>
        <text class="context__unit">号箱</text>
      </view>
      <view class="context__body">
        <text class="context__title">{{ isEdit ? '编辑物品' : '添加到 ' + box.no + ' 号箱' }}</text>
        <text class="context__room">目标房间：{{ box.room }}</text>
      </view>
    </view>

    <view class="field">
      <text class="field__label">物品名称 <text class="field__required">*</text></text>
      <input
        v-model="name"
        class="field__input"
        :maxlength="limits.itemName"
        :focus="nameFocused"
        placeholder="例如：充电器"
        placeholder-class="field__placeholder"
        @input="error = ''"
      />
    </view>

    <view class="field">
      <text class="field__label">数量</text>
      <view class="stepper">
        <view class="stepper__btn" :class="{ 'stepper__btn--off': displayQuantity <= 1 }" @tap="stepQuantity(-1)">−</view>
        <input
          v-model="quantityText"
          class="stepper__input"
          type="number"
          :maxlength="3"
          @blur="normalizeQuantityInput"
          @input="error = ''"
        />
        <view class="stepper__btn" :class="{ 'stepper__btn--off': displayQuantity >= limits.itemQuantity }" @tap="stepQuantity(1)">＋</view>
      </view>
      <text class="field__hint">默认 1 件，可填 1–999</text>
    </view>

    <view class="field">
      <text class="field__label">照片（选填，最多 1 张）</text>

      <view v-if="photoPath" class="photo-preview">
        <image class="photo-preview__img" :src="photoPath" mode="aspectFill" @tap="previewPhoto" />
        <view class="photo-preview__body">
          <text class="photo-preview__state">{{ photoHint }}</text>
          <view class="photo-preview__actions">
            <text class="photo-preview__action" @tap="chooseFrom('album')">更换</text>
            <text class="photo-preview__action photo-preview__action--danger" @tap="clearPhoto">移除</text>
          </view>
        </view>
      </view>

      <view v-else class="photo">
        <view class="photo__icon">▧</view>
        <view class="photo__body">
          <text class="photo__title">拍一张，或从相册选一张</text>
          <text class="photo__desc">照片会复制到小程序本地目录；卸载或清理微信数据会一起消失。</text>
        </view>
        <text class="photo__tag">选填</text>
      </view>

      <view class="photo-actions">
        <button class="btn btn--ghost photo-actions__btn" hover-class="none" @tap="chooseFrom('camera')">拍照</button>
        <button class="btn btn--ghost photo-actions__btn" hover-class="none" @tap="chooseFrom('album')">从相册选择</button>
      </view>
      <text class="field__hint">每件物品最多 1 张；照片不在备份包内。</text>
    </view>

    <text v-if="error" class="form-error">{{ error }}</text>

    <view v-if="isEdit" class="danger-zone">
      <button class="btn btn--danger btn--block" hover-class="none" @tap="confirmDelete">删除物品</button>
    </view>

    <view class="bottom-bar">
      <view class="form-actions">
        <button
          v-if="!isEdit"
          class="btn btn--ghost form-actions__btn"
          hover-class="none"
          :loading="saving"
          @tap="handleSave(true)"
        >
          保存并继续添加
        </button>
        <button class="btn btn--primary form-actions__btn" hover-class="none" :loading="saving" @tap="handleSave(false)">
          {{ isEdit ? '保存修改' : '保存' }}
        </button>
      </view>
    </view>
  </view>

  <view v-else class="page">
    <EmptyState :title="notFoundTitle" description="它可能已被删除，返回上一页重新选择。">
      <button class="btn btn--ghost" hover-class="none" @tap="goBack">返回</button>
    </EmptyState>
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { actions, refresh, store } from '../../store/index.js'
import { LIMITS } from '../../constants/index.js'
import { isManagedPhoto, persistPhoto, removePhoto } from '../../services/photos.js'
import { ensurePrivacyAuthorized } from '../../services/privacy.js'
import EmptyState from '../../components/EmptyState.vue'

const limits = LIMITS
const boxId = ref('')
const itemId = ref('')
const name = ref('')
const quantityText = ref('1')
const photoPath = ref('')
const originalPhotoPath = ref('')
const error = ref('')
const saving = ref(false)
const nameFocused = ref(false)

const isEdit = computed(() => Boolean(itemId.value))
const box = computed(() => store.db.boxes.find((entry) => entry.id === boxId.value) || null)
const item = computed(() => store.db.items.find((entry) => entry.id === itemId.value) || null)
const displayQuantity = computed(() => Number(quantityText.value) || 1)
const notFoundTitle = computed(() => (box.value ? '物品不存在' : '箱子不存在'))
const photoHint = computed(() => {
  if (!photoPath.value) return ''
  return isManagedPhoto(photoPath.value) ? '已保存到本机' : '当前环境无法写入持久目录，保存后不会保留'
})

onLoad((options) => {
  boxId.value = (options && options.boxId) || ''
  itemId.value = (options && options.id) || ''
  if (itemId.value) fillFromItem()
})

onShow(() => {
  refresh()
  if (itemId.value && !name.value) fillFromItem()
  uni.setNavigationBarTitle({ title: isEdit.value ? '编辑物品' : '添加物品' })
})

function fillFromItem() {
  const target = item.value
  if (!target) return
  name.value = target.name
  quantityText.value = String(target.quantity)
  photoPath.value = target.photoPath || ''
  originalPhotoPath.value = target.photoPath || ''
}

function previewPhoto() {
  if (!photoPath.value) return
  uni.previewImage({ urls: [photoPath.value] })
}

async function chooseFrom(source) {
  // 拍照/选图属于隐私接口：未同意《用户隐私保护指引》时不继续调用，给出可读提示。
  const gate = await ensurePrivacyAuthorized()
  if (!gate.ok) {
    error.value = gate.message
    return
  }

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: [source],
    success: (res) => {
      const tempPath = res && res.tempFilePaths && res.tempFilePaths[0]
      if (!tempPath) return
      try {
        // 换图前先清理本次会话里刚选、还没保存的临时照片。
        discardDraftPhoto()
        const saved = persistPhoto(tempPath)
        photoPath.value = saved.path
        error.value = ''
      } catch (err) {
        error.value = err.message || '照片保存失败'
      }
    },
    fail: (err) => {
      const message = (err && err.errMsg) || ''
      // 用户主动取消不算错误，不弹提示。
      if (message.includes('cancel')) return
      uni.showToast({ title: '未能选择照片', icon: 'none' })
    },
  })
}

function discardDraftPhoto() {
  if (photoPath.value && photoPath.value !== originalPhotoPath.value) {
    removePhoto(photoPath.value)
  }
}

function clearPhoto() {
  discardDraftPhoto()
  photoPath.value = ''
}

function stepQuantity(delta) {
  const next = Math.min(limits.itemQuantity, Math.max(1, displayQuantity.value + delta))
  quantityText.value = String(next)
  error.value = ''
}

function normalizeQuantityInput() {
  const value = Number(quantityText.value)
  if (quantityText.value === '' || !Number.isFinite(value)) {
    quantityText.value = '1'
    return
  }
  if (!Number.isInteger(value)) {
    quantityText.value = String(Math.round(value))
  } else if (value < 1) {
    quantityText.value = '1'
  } else if (value > limits.itemQuantity) {
    quantityText.value = String(limits.itemQuantity)
  }
}

function focusName() {
  nameFocused.value = false
  nextTick(() => {
    nameFocused.value = true
  })
}

function validate() {
  const cleanName = name.value.trim()
  if (!cleanName) {
    error.value = '请填写物品名称'
    focusName()
    return null
  }
  if (cleanName.length > limits.itemName) {
    error.value = `物品名称最多 ${limits.itemName} 个字`
    focusName()
    return null
  }
  const quantity = Number(quantityText.value)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > limits.itemQuantity) {
    error.value = `数量需要填写 1 到 ${limits.itemQuantity} 之间的整数`
    return null
  }
  // 临时路径（H5 blob、未复制成功的相机路径）不写进数据，避免重启后变成死链。
  const storedPhoto = isManagedPhoto(photoPath.value) ? photoPath.value : ''
  return { name: cleanName, quantity, photoPath: storedPhoto }
}

function cleanupReplacedPhoto(nextPhotoPath) {
  if (originalPhotoPath.value && originalPhotoPath.value !== nextPhotoPath) {
    removePhoto(originalPhotoPath.value)
  }
}

function handleSave(continueAdding) {
  if (saving.value) return
  const payload = validate()
  if (!payload) return

  saving.value = true
  try {
    if (isEdit.value) {
      actions.updateItem(itemId.value, payload)
      cleanupReplacedPhoto(payload.photoPath)
      uni.showToast({ title: '物品已更新', icon: 'none' })
      goBack()
      return
    }

    actions.createItem(boxId.value, payload)
    if (continueAdding) {
      uni.showToast({ title: `已添加到 ${box.value.no} 号箱`, icon: 'none' })
      name.value = ''
      quantityText.value = '1'
      error.value = ''
      focusName()
    } else {
      uni.showToast({ title: '物品已添加', icon: 'none' })
      goBack()
    }
  } catch (err) {
    error.value = err.message || '保存失败'
  } finally {
    saving.value = false
  }
}

function confirmDelete() {
  const target = item.value
  if (!target) return
  uni.showModal({
    title: '删除物品',
    content: `确定删除「${target.name}」吗？`,
    confirmText: '删除',
    confirmColor: '#a83e21',
    success: (res) => {
      if (!res.confirm) return
      try {
        actions.deleteItem(target.id)
        removePhoto(target.photoPath)
        uni.showToast({ title: '物品已删除', icon: 'none' })
        goBack()
      } catch (err) {
        uni.showToast({ title: err.message || '删除失败', icon: 'none' })
      }
    },
  })
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style scoped>
.context {
  display: flex;
  align-items: center;
  padding: 24rpx 26rpx;
  margin: 8rpx 0 32rpx;
  background: #fffaf0;
  border: 2rpx dashed #c9a87c;
  border-radius: 22rpx;
}

.context__tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100rpx;
  height: 108rpx;
  margin-right: 24rpx;
  background: #fdf3e0;
  border: 2rpx dashed #d8b98a;
  border-radius: 12rpx;
}

.context__num {
  font-size: 50rpx;
  font-weight: 700;
  line-height: 1;
  color: #8a5a2b;
}

.context__unit {
  margin-top: 6rpx;
  font-size: 19rpx;
  color: #a98c63;
}

.context__body {
  flex: 1;
  min-width: 0;
}

.context__title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
}

.context__room {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--c-ink-3);
}

.field__required {
  color: var(--c-accent);
}

.field__hint {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--c-ink-3);
}

.stepper {
  display: flex;
  align-items: center;
  height: 92rpx;
  overflow: hidden;
  background: var(--c-paper);
  border: 1rpx solid var(--c-line-strong);
  border-radius: 16rpx;
}

.stepper__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 104rpx;
  height: 100%;
  font-size: 40rpx;
  color: var(--c-accent);
}

.stepper__btn--off {
  color: #cbbfae;
}

.stepper__input {
  flex: 1;
  height: 100%;
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
  background: transparent;
  border-right: 1rpx solid var(--c-line);
  border-left: 1rpx solid var(--c-line);
}

.photo-actions {
  display: flex;
  margin-top: 14rpx;
}

.photo-actions__btn {
  flex: 1;
  height: 76rpx;
  font-size: 25rpx;
}

.photo-actions__btn + .photo-actions__btn {
  margin-left: 16rpx;
}

.photo-preview {
  display: flex;
  align-items: center;
  padding: 18rpx 20rpx;
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: 18rpx;
}

.photo-preview__img {
  width: 150rpx;
  height: 150rpx;
  margin-right: 20rpx;
  border-radius: 14rpx;
}

.photo-preview__body {
  flex: 1;
  min-width: 0;
}

.photo-preview__state {
  display: block;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--c-ink-2);
}

.photo-preview__actions {
  display: flex;
  margin-top: 14rpx;
}

.photo-preview__action {
  padding: 8rpx 20rpx;
  margin-right: 12rpx;
  font-size: 23rpx;
  color: var(--c-accent);
  background: var(--c-accent-soft);
  border-radius: 999rpx;
}

.photo-preview__action--danger {
  color: #a83e21;
  background: #fbeae4;
}

.photo {
  display: flex;
  align-items: center;
  padding: 22rpx 24rpx;
  background: rgba(255, 253, 248, 0.7);
  border: 2rpx dashed var(--c-line-strong);
  border-radius: 18rpx;
}

.photo__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  margin-right: 20rpx;
  font-size: 34rpx;
  color: #b6a184;
  background: #f8f2e7;
  border-radius: 14rpx;
}

.photo__body {
  flex: 1;
  min-width: 0;
}

.photo__title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--c-ink-2);
}

.photo__desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  line-height: 1.5;
  color: var(--c-ink-3);
}

.photo__tag {
  flex-shrink: 0;
  margin-left: 14rpx;
  font-size: 20rpx;
  color: #a98c63;
}

.form-error {
  display: block;
  padding: 16rpx 20rpx;
  margin-bottom: 20rpx;
  font-size: 24rpx;
  color: #a83e21;
  background: #fbeae4;
  border-radius: 14rpx;
}

.danger-zone {
  padding-top: 12rpx;
  margin-top: 12rpx;
}

.form-actions {
  display: flex;
}

.form-actions__btn {
  flex: 1;
  height: 84rpx;
  font-size: 28rpx;
}

.form-actions__btn + .form-actions__btn {
  margin-left: 20rpx;
}
</style>
