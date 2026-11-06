<template>
  <view class="page">
    <view class="intro">
      <text class="intro__title">五分钟上手</text>
      <text class="intro__desc">全部内容都是本地静态文案，断网也能看。数据只保存在这台设备，不联网、不上传。</text>
    </view>

    <view class="card">
      <text class="card__title">使用说明</text>
      <view class="step">
        <text class="step__no">1</text>
        <text class="step__text">在「搬家」页新建一次搬家，每次搬家独立编号。</text>
      </view>
      <view class="step">
        <text class="step__no">2</text>
        <text class="step__text">进入搬家详情添加箱子，填写目标房间和备注。</text>
      </view>
      <view class="step">
        <text class="step__no">3</text>
        <text class="step__text">进入箱子详情添加物品，写清名称和数量，可连续添加。</text>
      </view>
      <view class="step">
        <text class="step__no">4</text>
        <text class="step__text">把「3 号箱」这样的编号写在纸箱上，按房间搬运。</text>
      </view>
      <view class="step">
        <text class="step__no">5</text>
        <text class="step__text">在搬家详情搜索物品名称或箱号，随时定位东西在哪；封箱、搬运、拆箱时切换箱子状态。</text>
      </view>
    </view>

    <view class="card">
      <text class="card__title">照片规则</text>
      <text class="line">· 每件物品最多 1 张照片，拍照或从相册选择。</text>
      <text class="line">· 照片会复制到小程序本地文件目录，关闭重进仍然可见。</text>
      <text class="line">· 照片不进入备份包，换手机或恢复备份后需要重新拍。</text>
      <text class="line">· 卸载小程序或清理微信数据，照片会一起丢失。</text>
    </view>

    <view class="card">
      <text class="card__title">备份规则</text>
      <text class="line">· 备份是一段 JSON 文本，只含搬运记录：搬家、箱子、物品的名称与数量。</text>
      <text class="line">· 备份不含照片，也不含昵称和头像；恢复时不会覆盖本机资料。</text>
      <text class="line">· 恢复前会完整校验结构，内容有误时不会改动现有数据。</text>
      <text class="line">· 恢复会整体替换当前全部文字数据，建议先导出当前备份。</text>
      <text class="line">· 备份文本可复制到备忘录或发给自己，换手机时粘贴恢复。</text>
    </view>

    <view class="card">
      <text class="card__title">常见问题</text>
      <view class="faq">
        <text class="faq__q">换手机后数据还在吗？</text>
        <text class="faq__a">不在。这一版是单人本地版，没有云同步；换手机、卸载或清理微信数据都会丢失，请先导出备份。</text>
      </view>
      <view class="faq">
        <text class="faq__q">照片会随备份恢复吗？</text>
        <text class="faq__a">不会。备份只有文字记录，恢复后物品还在，照片需要重新拍照或选图。</text>
      </view>
      <view class="faq">
        <text class="faq__q">头像为什么变回默认了？</text>
        <text class="faq__a">头像文件保存在本机，清理数据或文件被系统清理后会回默认头像。重新在「我的 → 编辑资料」里设置即可。</text>
      </view>
      <view class="faq">
        <text class="faq__q">删除箱子后，箱号会重复吗？</text>
        <text class="faq__a">不会。编号只增不减，删掉的箱号不会被新箱子复用。</text>
      </view>
      <view class="faq">
        <text class="faq__q">忘记东西放在几号箱怎么办？</text>
        <text class="faq__a">在搬家详情点搜索，输入物品名称或箱号；结果会显示「几号箱 · 目标房间」。</text>
      </view>
      <view class="faq">
        <text class="faq__q">示例数据会弄乱我的记录吗？</text>
        <text class="faq__a">不会。示例是单独的一次搬家，可以随时移除；移除时会连同你在示例里加的内容一起删除，其他搬家不受影响。</text>
      </view>
    </view>

    <text class="footer">搬家装箱助手 · 单人本地版</text>
  </view>
</template>

<script setup>
// 纯静态页：内容随包发布，不请求网络，离线可读。
</script>

<style scoped>
.intro {
  padding: 20rpx 4rpx 34rpx;
}

.intro__title {
  display: block;
  font-size: 42rpx;
  font-weight: 700;
  line-height: 1.35;
}

.intro__desc {
  display: block;
  margin-top: 16rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--c-ink-2);
}

.card {
  padding: 30rpx 28rpx;
  margin-bottom: 22rpx;
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: 24rpx;
}

.card__title {
  display: block;
  margin-bottom: 16rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.step {
  display: flex;
  align-items: flex-start;
  padding: 10rpx 0;
}

.step__no {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  margin-right: 16rpx;
  font-size: 20rpx;
  font-weight: 600;
  color: var(--c-accent);
  background: var(--c-accent-soft);
  border-radius: 50%;
}

.step__text {
  flex: 1;
  font-size: 25rpx;
  line-height: 1.6;
  color: var(--c-ink-2);
}

.line {
  display: block;
  font-size: 24rpx;
  line-height: 1.85;
  color: var(--c-ink-2);
}

.faq {
  padding: 14rpx 0;
  border-top: 1rpx solid var(--c-line);
}

.faq:first-of-type {
  border-top: none;
}

.faq__q {
  display: block;
  font-size: 25rpx;
  font-weight: 600;
  color: var(--c-ink);
}

.faq__a {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--c-ink-2);
}

.footer {
  display: block;
  padding: 20rpx 4rpx 60rpx;
  font-size: 22rpx;
  color: var(--c-ink-3);
  text-align: center;
}
</style>
