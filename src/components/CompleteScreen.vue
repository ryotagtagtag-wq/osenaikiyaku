<script setup lang="ts">
/**
 * 完了画面
 * 「絶対に押せない」はずの同意ボタンを押せてしまった人だけが見られる、奇跡の結末。
 */
interface Props {
  /** 完了メッセージ */
  message?: string
  /** 「もう一度やる」ボタンを出すかどうか（任意表示） */
  showRestart?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  message: '同意が完了しました。おめでとうございます！',
  showRestart: true,
})

/** 「もう一度やる」が押されたら親にやり直しを通知する */
const emit = defineEmits<{
  restart: []
}>()
</script>

<template>
  <section class="complete" role="status" aria-live="polite">
    <!-- 背景の装飾：光の輪と微粒のノイズ。意味はないので読み上げから除外する -->
    <div class="complete__aura" aria-hidden="true"></div>
    <div class="complete__orbit" aria-hidden="true"></div>
    <div class="complete__grain" aria-hidden="true"></div>

    <div class="complete__inner">
      <p class="complete__eyebrow">✦ 奇跡が起きました ✦</p>

      <h1 class="complete__title">完了</h1>

      <p class="complete__message">{{ props.message }}</p>

      <!-- 任意で再挑戦ボタンを表示する -->
      <button
        v-if="props.showRestart"
        class="complete__restart"
        type="button"
        @click="emit('restart')"
      >
        <span>もう一度やる</span>
        <span class="complete__arrow" aria-hidden="true">↗</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
/* この画面だけ独自の色設計を使う：深い墨にゴールドの光 */
.complete {
  --ink: #0d0b14;
  --gold: #ffd166;
  --gold-deep: #c98a19;
  --paper: #fff8e7;

  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  isolation: isolate;
  color: var(--paper);
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 209, 102, 0.16) 0%, transparent 42%),
    radial-gradient(circle at 12% 88%, rgba(120, 80, 200, 0.16) 0%, transparent 46%),
    linear-gradient(165deg, #161021 0%, var(--ink) 55%, #08060d 100%);
  text-align: center;
}

/* 中央で呼吸する光 */
.complete__aura {
  position: absolute;
  top: 42%;
  left: 50%;
  z-index: -1;
  width: min(78vw, 620px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 209, 102, 0.22) 0%, transparent 68%);
  filter: blur(12px);
  transform: translate(-50%, -50%);
  animation: aura-breathe 4.5s ease-in-out infinite;
}

/* 斜めに回る細いリングで「到達した」Feel を出す */
.complete__orbit {
  position: absolute;
  top: 42%;
  left: 50%;
  z-index: -1;
  width: min(84vw, 700px);
  aspect-ratio: 1;
  border: 1px solid rgba(255, 209, 102, 0.28);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(-18deg) scaleY(0.38);
  animation: orbit-turn 14s linear infinite;
}

.complete__orbit::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 18px 4px rgba(255, 209, 102, 0.65);
  transform: translateY(-50%);
}

/* 紙の粒子感を出す極薄のストライプ */
.complete__grain {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.35;
  background: repeating-linear-gradient(
    115deg,
    rgba(255, 255, 255, 0.02) 0px,
    rgba(255, 255, 255, 0.02) 1px,
    transparent 1px,
    transparent 4px
  );
  pointer-events: none;
}

.complete__inner {
  position: relative;
  padding: 2rem 1.5rem 3rem;
}

/* 補助文言：小さめの文字で、主役の「完了」を邪魔しない */
.complete__eyebrow {
  margin-bottom: 1.25rem;
  color: var(--gold);
  font-family: 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif;
  font-size: clamp(0.75rem, 2vw, 0.95rem);
  letter-spacing: 0.42em;
  opacity: 0;
  animation: rise-in 0.8s ease-out 0.05s forwards;
}

/* 主役：明朝の大文字に金色のグローを重ねる */
.complete__title {
  font-family: 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif;
  font-size: clamp(6rem, 24vw, 13rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.14em;
  text-indent: 0.14em;
  background: linear-gradient(160deg, #fff7d6 0%, var(--gold) 48%, var(--gold-deep) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  filter: drop-shadow(0 8px 34px rgba(255, 209, 102, 0.35));
  opacity: 0;
  animation: title-reveal 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
}

.complete__message {
  margin: 1.5rem auto 2.75rem;
  max-width: 34ch;
  font-size: clamp(0.95rem, 2.6vw, 1.15rem);
  line-height: 2;
  letter-spacing: 0.06em;
  color: rgba(255, 248, 231, 0.88);
  opacity: 0;
  animation: rise-in 0.9s ease-out 0.5s forwards;
}

/* 再挑戦ボタン：通常は透明、ホバーで金に反転 */
.complete__restart {
  display: inline-flex;
  align-items: center;
  gap: 1.1rem;
  padding: 0.95rem 2rem;
  border: 1px solid rgba(255, 209, 102, 0.6);
  border-radius: 999px;
  background: transparent;
  color: var(--gold);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  cursor: pointer;
  opacity: 0;
  animation: rise-in 0.9s ease-out 0.72s forwards;
  transition:
    background-color 0.35s ease,
    color 0.35s ease,
    box-shadow 0.35s ease,
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.complete__restart:hover {
  background: var(--gold);
  color: var(--ink);
  box-shadow: 0 12px 38px rgba(255, 209, 102, 0.28);
  transform: translateY(-3px);
}

.complete__restart:active {
  transform: translateY(-1px) scale(0.98);
}

.complete__restart:focus-visible {
  outline: 2px solid var(--paper);
  outline-offset: 4px;
}

.complete__arrow {
  font-size: 1.15rem;
  line-height: 1;
  transition: transform 0.35s ease;
}

.complete__restart:hover .complete__arrow {
  transform: translate(3px, -3px);
}

/* 段階的に立ち上がる演出 */
@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes title-reveal {
  from {
    opacity: 0;
    transform: translateY(28px) scale(0.88);
    filter: blur(14px) drop-shadow(0 8px 34px rgba(255, 209, 102, 0));
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0) drop-shadow(0 8px 34px rgba(255, 209, 102, 0.35));
  }
}

@keyframes aura-breathe {
  0%,
  100% {
    opacity: 0.65;
    transform: translate(-50%, -50%) scale(0.94);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.06);
  }
}

@keyframes orbit-turn {
  from {
    transform: translate(-50%, -50%) rotate(-18deg) scaleY(0.38);
  }
  to {
    transform: translate(-50%, -50%) rotate(342deg) scaleY(0.38);
  }
}

/* 動きを抑えたい人には静的な完了画面を出す */
@media (prefers-reduced-motion: reduce) {
  .complete__eyebrow,
  .complete__title,
  .complete__message,
  .complete__restart {
    opacity: 1;
    animation: none;
  }

  .complete__aura,
  .complete__orbit {
    animation: none;
  }

  .complete__restart {
    transition: none;
  }
}
</style>
