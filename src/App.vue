<script>
export default {
  onLaunch() {
    console.log('[app] launch')
  },
}
</script>

<style>
page {
  --c-bg: #f6f1e7;
  --c-surface: #ffffff;
  --c-paper: #fffdf8;
  --c-ink: #241e18;
  --c-ink-2: #6b5f52;
  --c-ink-3: #9c8e7d;
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
  padding: 20rpx 32rpx 0;
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

.bottom-bar--tabbar {
  bottom: calc(100rpx + env(safe-area-inset-bottom));
}
/* #endif */

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8rpx 4rpx 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.section-count {
  font-size: 24rpx;
  color: var(--c-ink-3);
}

.section-action {
  font-size: 24rpx;
  color: var(--c-accent);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  padding: 0 36rpx;
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}

.btn--primary {
  background: var(--c-accent);
  color: #fffdf8;
  box-shadow: 0 12rpx 24rpx rgba(194, 84, 47, 0.18);
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
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(246, 241, 231, 0) 0%, rgba(246, 241, 231, 0.94) 26%, #f6f1e7 100%);
}

.field {
  margin-bottom: 28rpx;
}

.field__label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: var(--c-ink-3);
  letter-spacing: 1rpx;
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
