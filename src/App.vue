<script>
export default {
  onLaunch() {
    console.log('[app] launch')
  },
}
</script>

<style>
page {
  /* 色板：陶土橙 + 纸箱米色，不新增主色 */
  --c-bg: #f6f1e7;
  --c-surface: #ffffff;
  --c-paper: #fffdf8;
  --c-ink: #241e18;
  --c-ink-2: #6b5f52;
  /* 辅助文字：原 #9c8e7d 调深，对 #f6f1e7 为 4.85:1 */
  --c-ink-3: #75675a;
  /* 装饰专用：图标、箭头、分隔线，不承载必须读清的正文 */
  --c-decor: #9c8e7d;
  --c-line: #e7ddcc;
  --c-line-strong: #d8cab4;
  --c-accent: #c2542f;
  --c-accent-soft: #f5e1d5;
  --c-green: #5c7a52;
  --c-green-soft: #e7efdf;
  --c-amber: #a9761f;
  --c-amber-soft: #f7ecd5;
  --c-plum: #6e5a72;
  --c-plum-soft: #eee7f0;

  /* 间距 4 档，8rpx 基准：三屏共用，不逐屏手调 */
  --sp-1: 8rpx;
  --sp-2: 16rpx;
  --sp-3: 24rpx;
  --sp-4: 32rpx;

  /* 圆角 */
  --r-card: 24rpx;
  --r-inner: 16rpx;
  --r-btn: 20rpx;
  --r-pill: 999rpx;

  /* 字号 5 级：页标题 / 分区标题 / 行主文 / 行次文 / 说明 */
  --fs-page: 44rpx;
  --fs-section: 30rpx;
  --fs-row: 30rpx;
  --fs-sub: 26rpx;
  --fs-note: 24rpx;

  background-color: var(--c-bg);
  color: var(--c-ink);
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 28rpx;
  line-height: 1.5;
}

view,
text,
input,
textarea,
button {
  box-sizing: border-box;
}

button {
  margin: 0;
  padding: 0;
  background: transparent;
  line-height: normal;
  font-size: inherit;
  color: inherit;
}

button::after {
  border: none;
}

.page {
  min-height: 100vh;
  padding: var(--sp-3) var(--sp-4) 0;
}

.page--with-bar {
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
}

/* tab 页：让出底部 tabBar，避免最后一张卡片被压住。 */
.page--tabbar {
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
}

.page--with-bar.page--tabbar {
  padding-bottom: calc(208rpx + env(safe-area-inset-bottom));
}

/* #ifdef H5 */
/* H5 的 tabBar 由 uni-app 渲染在页面内，额外让出约 100rpx（≈50px）。 */
.page--tabbar {
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
}

.page--with-bar.page--tabbar {
  padding-bottom: calc(308rpx + env(safe-area-inset-bottom));
}

/* 双类名提高优先级：本块在 .bottom-bar 之前，单类名会被后面的 bottom: 0 覆盖 */
.bottom-bar.bottom-bar--tabbar {
  bottom: calc(100rpx + env(safe-area-inset-bottom));
}
/* #endif */

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: var(--sp-2) 0 var(--sp-2);
}

.section-title {
  font-size: var(--fs-section);
  font-weight: 600;
  letter-spacing: 1rpx;
}

.section-count {
  font-size: var(--fs-note);
  color: var(--c-ink-3);
}

.section-action {
  display: flex;
  align-items: center;
  min-height: 88rpx;
  font-size: var(--fs-note);
  color: var(--c-ink-2);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  padding: 0 var(--sp-4);
  border-radius: var(--r-btn);
  font-size: var(--fs-row);
  font-weight: 600;
  letter-spacing: 1rpx;
}

/* 实心主按钮：不加投影，避免和细边卡片混用两种分隔方式 */
.btn--primary {
  background: var(--c-accent);
  /* 纯白对 #c2542f 为 4.56:1，纸白 #fffdf8 只有 4.49:1 */
  color: #ffffff;
}

.btn--ghost {
  background: var(--c-paper);
  color: var(--c-ink-2);
  border: 1rpx solid var(--c-line-strong);
}

.btn--danger {
  background: #fbeae4;
  color: #a83e21;
}

.btn--block {
  width: 100%;
}

.btn--disabled {
  opacity: 0.45;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  padding: var(--sp-3) var(--sp-4) calc(var(--sp-3) + env(safe-area-inset-bottom));
  background: var(--c-bg);
}

.field {
  margin-bottom: 28rpx;
}

.field__label {
  display: block;
  margin-bottom: 12rpx;
  font-size: var(--fs-note);
  color: var(--c-ink-3);
  letter-spacing: 1rpx;
}

/* 搜索图标：纯 CSS 绘制，避免新增图片资源 */
.icon-search {
  position: relative;
  flex-shrink: 0;
  width: 32rpx;
  height: 32rpx;
}

.icon-search__ring {
  position: absolute;
  top: 1rpx;
  left: 1rpx;
  width: 21rpx;
  height: 21rpx;
  border: 3rpx solid var(--c-decor);
  border-radius: 50%;
}

.icon-search__handle {
  position: absolute;
  right: 2rpx;
  bottom: 3rpx;
  width: 12rpx;
  height: 3rpx;
  background: var(--c-decor);
  border-radius: 2rpx;
  transform: rotate(45deg);
  transform-origin: right center;
}

.field__input,
.field__textarea {
  width: 100%;
  padding: 20rpx 24rpx;
  font-size: 30rpx;
  color: var(--c-ink);
  background: var(--c-paper);
  border: 1rpx solid var(--c-line-strong);
  border-radius: 16rpx;
}

.field__input {
  height: 92rpx;
}

.field__textarea {
  height: 160rpx;
  line-height: 1.5;
}

.field__placeholder {
  color: #b6a897;
}

.field__error {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #b24327;
}

.field__count {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--c-ink-3);
  text-align: right;
}
</style>
