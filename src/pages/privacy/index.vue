<template>
  <view class="page">
    <view v-if="loadError" class="error">
      <text class="error__text">隐私协议加载失败</text>
      <button class="btn btn--ghost" hover-class="none" @tap="load">加载失败，重试</button>
    </view>

    <template v-else>
      <view class="intro">
        <text class="intro__title">封箱之前隐私协议</text>
        <text class="intro__meta">生效日期：2026-11-06</text>
        <text class="intro__meta">更新说明：新增「用户信息（头像、昵称）」声明。</text>
      </view>

      <view v-for="section in sections" :key="section.title" class="card">
        <text class="card__title">{{ section.title }}</text>
        <text v-for="(paragraph, index) in section.paragraphs" :key="index" class="para">
          {{ paragraph }}
        </text>
      </view>

      <text class="footer">封箱之前 · 单人本地版</text>
    </template>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const sections = ref([])
const loadError = ref(false)

/**
 * 协议全文内置在包里，断网可读，不引任何外链。
 * 文案与 docs/privacy.md、公众平台「用户隐私保护指引」同源，改动时必须三处一起改。
 */
function buildSections() {
  return [
    {
      title: '一、我们是谁',
      paragraphs: [
        '封箱之前是一款本地记录工具，用于登记搬家箱子编号、目标房间与箱内物品。本小程序不提供账号体系，不需要登录。',
      ],
    },
    {
      title: '二、我们收集与使用的信息',
      paragraphs: [
        '1. 摄像头：仅当你主动点「拍照」时为物品拍照；不拍照则不调用。',
        '2. 相册（仅读取）：仅当你主动点「从相册选择」时读取你选中的那一张图片，不读取其他照片。',
        '3. 剪贴板：仅当你主动点「导出备份 → 复制」或「恢复备份 → 从剪贴板粘贴」时，读写你要复制或粘贴的备份文本。',
        '4. 用户信息（头像、昵称）：你主动选择的头像会复制到小程序本地文件目录，你填写的昵称保存在微信本地存储，仅用于在本机「我的」页展示个人资料。这些信息不上传、不共享、不用于广告或用户画像；不会随备份导出或恢复。你可以随时在「我的 → 编辑资料」修改，或通过「我的 → 清除本地数据」删除。',
      ],
    },
    {
      title: '三、信息如何保存',
      paragraphs: [
        '照片复制到小程序本地文件目录（USER_DATA_PATH），文字记录、昵称保存在微信本地存储。以上信息都只在本机使用，不上传、不共享、不用于广告或用户画像。',
        '本小程序不接入第三方统计或广告 SDK，不向任何服务器发送你的记录、照片与资料。',
      ],
    },
    {
      title: '四、我们不做的事',
      paragraphs: [
        '我们不请求登录，不采集手机号、位置、通讯录、麦克风、微信运动等信息，不向他人出售或提供你的数据。',
      ],
    },
    {
      title: '五、备份与删除',
      paragraphs: [
        '你可以随时在「我的 → 导出备份」导出文字记录。备份只含文字（搬家、箱子、物品的名称与数量），不含照片、昵称和头像。',
        '删除途径：在「我的 → 编辑资料」修改头像昵称；在「我的 → 清除本地数据」删除全部记录、照片与头像；卸载小程序或在微信里清理数据同样会删除本机数据。',
      ],
    },
    {
      title: '六、你的权利',
      paragraphs: [
        '你可以查看、修改、复制（导出）和删除自己的数据。以上操作全部在本机完成，无需向开发者申请。',
      ],
    },
    {
      title: '七、协议变更',
      paragraphs: [
        '本协议更新时会在小程序内展示新版本并更新「生效日期」。继续使用即表示你接受更新后的内容。',
      ],
    },
    {
      title: '八、联系方式',
      paragraphs: ['如对本协议或个人信息处理有疑问，请联系：572752189@qq.com。'],
    },
  ]
}

function load() {
  try {
    const next = buildSections()
    if (!Array.isArray(next) || next.length === 0) throw new Error('empty sections')
    sections.value = next
    loadError.value = false
  } catch (error) {
    console.error('[privacy] render failed:', error)
    loadError.value = true
  }
}

onLoad(load)
</script>

<style scoped>
.intro {
  padding: 20rpx 4rpx 30rpx;
}

.intro__title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1.35;
}

.intro__meta {
  display: block;
  margin-top: 10rpx;
  font-size: 23rpx;
  color: var(--c-ink-3);
}

.card {
  padding: 28rpx;
  margin-bottom: 20rpx;
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: 24rpx;
}

.card__title {
  display: block;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.para {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.8;
  color: var(--c-ink-2);
}

.footer {
  display: block;
  padding: 20rpx 4rpx 60rpx;
  font-size: 22rpx;
  color: var(--c-ink-3);
  text-align: center;
}

.error {
  padding: 120rpx 40rpx;
  text-align: center;
}

.error__text {
  display: block;
  margin-bottom: 28rpx;
  font-size: 28rpx;
  color: var(--c-ink-2);
}
</style>
