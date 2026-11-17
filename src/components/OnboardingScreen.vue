<script setup lang="ts">
/**
 * オンボード画面
 * 5ステップのチュートリアルに見せかけて、次へボタンは逃げ、
 * スキップは戻され、進捗バーまで勝手に巻き戻る。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import UnclickableButton from './UnclickableButton.vue'

/** 1ステップ分の表示情報 */
interface StepInfo {
  number: number
  label: string
  title: string
  description: string
}

interface Props {
  /** ヘッダーに出すサービス名 */
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'はじめてのセットアップ',
})

const emit = defineEmits<{
  /** 最終ステップを終えて次画面へ進む（仕様どおりのイベント名） */
  completed: []
  /** 親が @complete で購読している場合のための別名 */
  complete: []
}>()

// ステップ数と進捗の「故障」具合を一箇所で調整する
const STEP_COUNT = 5
const PROGRESS_TICK_MS = 900 // 進捗を更新する間隔
const PROGRESS_GLITCH_CHANCE = 0.18 // この確率で進捗が突然戻る
const PROGRESS_GLITCH_AMOUNT = 22 // 戻る幅（％）
const PROGRESS_RECOVER_STEP = 5 // ふだんは目標へ近づく幅（％）

// ダミーの説明文。実際の設定画面があるわけではない
const steps: readonly StepInfo[] = [
  {
    number: 1,
    label: 'はじめに',
    title: 'ようこそ',
    description: 'セットアップはたったの5ステップ。あっという間に終わりますので、安心して進んでください。',
  },
  {
    number: 2,
    label: 'アカウント',
    title: 'プロフィールの確認',
    description: 'お名前とアイコンが正しく表示されているか確認します。変更はあとからいつでもできます。',
  },
  {
    number: 3,
    label: '通知',
    title: '通知の設定',
    description: '大切なお知らせだけを受け取れるように調整できます。お好みで選んでください。',
  },
  {
    number: 4,
    label: 'セキュリティ',
    title: 'セキュリティの設定',
    description: '二段階認証をオンにすると、より安心してお使いいただけます。省略もできます。',
  },
  {
    number: 5,
    label: '完了',
    title: '準備はできました',
    description: '最後のボタンを押せば、すべての設定が完了します。あと少しです。',
  },
]

/** 現在のステップ（1〜5） */
const currentStep = ref(1)
/** 表示用の進捗。目標より下がることで「戻ってしまった」ように見える */
const displayProgress = ref(0)

let progressTimer: ReturnType<typeof setInterval> | undefined

const isFinalStep = computed(() => currentStep.value >= STEP_COUNT)
const targetProgress = computed(() => (currentStep.value / STEP_COUNT) * 100)

const currentStepData = computed<StepInfo>(() => {
  const step = steps[currentStep.value - 1]
  // ガード節: 想定外のステップ番号が来たら先頭に戻す
  if (!step) return steps[0]
  return step
})

/** 「次へ」または最終ステップの「完了」が押されたとき */
function handleAdvance(): void {
  if (isFinalStep.value) {
    emit('completed')
    emit('complete')
    return
  }

  currentStep.value += 1
  // 進んだ直後に進捗を少し削る。バーが戻るイライラを生む
  displayProgress.value = Math.max(0, targetProgress.value - 24)
}

/** スキップは前に進めない。先頭なら同じステップに留まり進捗だけ削れる */
function handleSkip(): void {
  if (currentStep.value <= 1) {
    displayProgress.value = 0
    return
  }

  currentStep.value -= 1
  displayProgress.value = Math.max(0, targetProgress.value - 12)
}

/** 進捗を少しずつ目標へ寄せつつ、たまに突然戻す */
function tickProgress(): void {
  if (Math.random() < PROGRESS_GLITCH_CHANCE) {
    displayProgress.value = Math.max(0, displayProgress.value - PROGRESS_GLITCH_AMOUNT)
    return
  }

  displayProgress.value = Math.min(targetProgress.value, displayProgress.value + PROGRESS_RECOVER_STEP)
}

onMounted(() => {
  displayProgress.value = targetProgress.value
  progressTimer = setInterval(tickProgress, PROGRESS_TICK_MS)
})

onBeforeUnmount(() => {
  if (progressTimer !== undefined) clearInterval(progressTimer)
})
</script>

<template>
  <section class="onboarding" :aria-label="props.title">
    <!-- 背景の装飾：細かいグリッドと斜めの光。意味はないので読み上げから除外 -->
    <div class="onboarding__grid" aria-hidden="true"></div>
    <div class="onboarding__halo" aria-hidden="true"></div>

    <div class="onboarding__shell">
      <!-- ヘッダー -->
      <header class="onboarding__header">
        <div class="onboarding__brand">
          <span class="onboarding__brand-mark" aria-hidden="true">◈</span>
          <span class="onboarding__brand-name">{{ props.title }}</span>
        </div>
        <p class="onboarding__counter">
          STEP <strong>{{ String(currentStep).padStart(2, '0') }}</strong>
          <span>/ {{ String(STEP_COUNT).padStart(2, '0') }}</span>
        </p>
      </header>

      <!-- 進捗バー：表示値が勝手に下がることがある -->
      <div class="onboarding__progress">
        <div
          class="onboarding__progress-track"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="Math.round(displayProgress)"
          :aria-label="`セットアップの進捗 ${Math.round(displayProgress)}％`"
        >
          <div class="onboarding__progress-fill" :style="{ width: `${displayProgress}%` }">
            <span class="onboarding__progress-shine" aria-hidden="true"></span>
          </div>
        </div>
        <span class="onboarding__progress-value">{{ Math.round(displayProgress) }}%</span>
      </div>

      <!-- ステップインジケーター -->
      <ol class="onboarding__indicators">
        <li
          v-for="step in steps"
          :key="step.number"
          class="onboarding__indicator"
          :class="{
            'is-current': step.number === currentStep,
            'is-done': step.number < currentStep,
          }"
          :aria-current="step.number === currentStep ? 'step' : undefined"
        >
          <span class="onboarding__indicator-dot">
            {{ step.number < currentStep ? '✓' : step.number }}
          </span>
          <span class="onboarding__indicator-label">{{ step.label }}</span>
        </li>
      </ol>

      <!-- カード：ステップが変わるたびに作り直して入場演出をかける -->
      <article :key="currentStep" class="onboarding__card">
        <span class="onboarding__watermark" aria-hidden="true">
          {{ String(currentStep).padStart(2, '0') }}
        </span>

        <div class="onboarding__card-body">
          <p class="onboarding__eyebrow">STEP {{ String(currentStep).padStart(2, '0') }} — {{ currentStepData.label }}</p>
          <h1 class="onboarding__title">{{ currentStepData.title }}</h1>
          <p class="onboarding__description">{{ currentStepData.description }}</p>
        </div>

        <!-- 逃げるボタンの領域。UnclickableButton はこの中を動き回る -->
        <div class="onboarding__button-area">
          <UnclickableButton
            :label="isFinalStep ? 'セットアップを完了' : '次へ進む'"
            @clicked="handleAdvance"
          />
          <p class="onboarding__hint">※ ボタンが動いても、それは仕様です。</p>
        </div>
      </article>

      <!-- フッター：スキップは「戻る」方向にしか働かない -->
      <footer class="onboarding__footer">
        <button class="onboarding__skip" type="button" @click="handleSkip">
          セットアップをスキップ
          <span aria-hidden="true">↩</span>
        </button>
        <p class="onboarding__footnote">お急ぎの方はこちらから。きっとすぐ終わります。</p>
      </footer>
    </div>
  </section>
</template>

<style scoped>
/* この画面だけの色設計：夜明け前の藍にコーラルの光 */
.onboarding {
  --ink: #0b1724;
  --ink-soft: #162c3d;
  --paper: #f6f4ee;
  --paper-ink: #142434;
  --coral: #e8553e;
  --mint: #4ac2ac;

  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  padding: clamp(1.25rem, 4vw, 3rem) 1rem;
  overflow: auto;
  isolation: isolate;
  color: var(--paper);
  background:
    radial-gradient(circle at 78% 8%, rgba(74, 194, 172, 0.14) 0%, transparent 38%),
    radial-gradient(circle at 8% 92%, rgba(232, 85, 62, 0.14) 0%, transparent 42%),
    linear-gradient(155deg, var(--ink-soft) 0%, var(--ink) 52%, #070f18 100%);
}

/* 本物のダッシュボード風の細かいグリッド */
.onboarding__grid {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.5;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom, #000 0%, transparent 92%);
  pointer-events: none;
}

/* カードの裏側に滲む斜めの光 */
.onboarding__halo {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: -1;
  width: min(90vw, 900px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 194, 172, 0.1) 0%, transparent 62%);
  filter: blur(18px);
  transform: translate(-50%, -46%) rotate(-12deg) scaleY(0.7);
  pointer-events: none;
}

.onboarding__shell {
  width: 100%;
  max-width: 780px;
  display: flex;
  flex-direction: column;
  gap: clamp(0.85rem, 2vw, 1.25rem);
  animation: shell-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* ヘッダー：ブランドとカウンタを両端に置く */
.onboarding__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.onboarding__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.onboarding__brand-mark {
  color: var(--mint);
  font-size: 1.25rem;
  line-height: 1;
  text-shadow: 0 0 18px rgba(74, 194, 172, 0.6);
}

.onboarding__brand-name {
  font-family: 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif;
  font-size: clamp(0.9rem, 2.4vw, 1.05rem);
  font-weight: 600;
  letter-spacing: 0.16em;
}

.onboarding__counter {
  flex: 0 0 auto;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: rgba(246, 244, 238, 0.55);
}

.onboarding__counter strong {
  color: var(--paper);
  font-size: 1.1rem;
}

.onboarding__counter span {
  margin-left: 0.15rem;
}

/* 進捗バー */
.onboarding__progress {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.onboarding__progress-track {
  position: relative;
  flex: 1;
  height: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.onboarding__progress-fill {
  position: relative;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--mint) 0%, #8fe3d3 55%, var(--coral) 100%);
  box-shadow: 0 0 16px rgba(74, 194, 172, 0.45);
  transition: width 720ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* 進捗バーの中を流れる光 */
.onboarding__progress-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 20%, rgba(255, 255, 255, 0.6) 50%, transparent 80%);
  transform: translateX(-100%);
  animation: shine-sweep 2.4s ease-in-out infinite;
}

.onboarding__progress-value {
  min-width: 3.2rem;
  text-align: right;
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
  color: var(--mint);
}

/* ステップインジケーター：現在だけ少し幅を広げる */
.onboarding__indicators {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem;
  list-style: none;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.035);
}

.onboarding__indicator {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.35rem 0.3rem;
  border-radius: 999px;
  color: rgba(246, 244, 238, 0.42);
  transition:
    flex-grow 420ms cubic-bezier(0.22, 1, 0.36, 1),
    color 420ms ease,
    background-color 420ms ease;
}

.onboarding__indicator.is-current {
  flex-grow: 1.7;
  color: var(--paper);
  background: rgba(74, 194, 172, 0.12);
}

.onboarding__indicator.is-done {
  color: rgba(74, 194, 172, 0.85);
}

.onboarding__indicator-dot {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border: 1px solid currentColor;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.onboarding__indicator.is-current .onboarding__indicator-dot {
  border-color: var(--mint);
  color: var(--ink);
  background: var(--mint);
  box-shadow: 0 0 0 5px rgba(74, 194, 172, 0.14);
  animation: dot-pulse 2.2s ease-in-out infinite;
}

.onboarding__indicator-label {
  overflow: hidden;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* カード */
.onboarding__card {
  position: relative;
  overflow: hidden;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 14px;
  background:
    linear-gradient(150deg, rgba(255, 255, 255, 0.96), rgba(246, 244, 238, 0.98));
  box-shadow:
    0 34px 70px rgba(0, 0, 0, 0.42),
    0 4px 12px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  color: var(--paper-ink);
  animation: card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* 左端のコーラルの縦線：カードにリズムを与える */
.onboarding__card::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 5px;
  background: linear-gradient(180deg, var(--coral), #ff8a6b 55%, var(--mint));
}

/* 右上に置いた巨大な透かし数字 */
.onboarding__watermark {
  position: absolute;
  top: -1.4rem;
  right: 0.5rem;
  font-family: 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif;
  font-size: clamp(7rem, 20vw, 11rem);
  font-weight: 600;
  line-height: 1;
  color: rgba(20, 36, 52, 0.045);
  pointer-events: none;
  user-select: none;
}

.onboarding__card-body {
  position: relative;
  z-index: 1;
  /* 透かしと重ならないよう左に寄せる */
  max-width: 78%;
}

.onboarding__eyebrow {
  margin-bottom: 0.85rem;
  color: var(--coral);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.22em;
}

.onboarding__title {
  font-family: 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif;
  font-size: clamp(1.9rem, 5.5vw, 2.9rem);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: 0.06em;
  color: #0e1c29;
}

.onboarding__description {
  margin-top: 0.9rem;
  max-width: 36ch;
  font-size: clamp(0.85rem, 2.4vw, 0.98rem);
  line-height: 1.9;
  letter-spacing: 0.04em;
  color: rgba(20, 36, 52, 0.72);
}

/* 逃げるボタン専用の領域。UnclickableButton の min-height と高さを揃える */
.onboarding__button-area {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 20rem;
  margin-top: 0.5rem;
  border-top: 1px dashed rgba(20, 36, 52, 0.16);
}

.onboarding__hint {
  position: absolute;
  right: 0;
  bottom: 0;
  /* 逃げるボタンが重なってもクリックを邪魔しない */
  pointer-events: none;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  color: rgba(20, 36, 52, 0.38);
}

/* フッター：リンク風のボタンと、わざとらしい安心の一言 */
.onboarding__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.onboarding__skip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border: 0;
  border-bottom: 1px solid rgba(246, 244, 238, 0.35);
  background: transparent;
  color: rgba(246, 244, 238, 0.72);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition:
    color 240ms ease,
    border-color 240ms ease,
    transform 240ms ease;
}

.onboarding__skip:hover {
  color: var(--coral);
  border-color: var(--coral);
  transform: translateX(-3px);
}

.onboarding__skip:focus-visible {
  outline: 2px solid var(--mint);
  outline-offset: 4px;
}

.onboarding__footnote {
  font-size: 0.7rem;
  color: rgba(246, 244, 238, 0.38);
}

/* 段階的に立ち上がる演出 */
@keyframes shell-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes shine-sweep {
  0%,
  25% {
    transform: translateX(-100%);
  }
  70%,
  100% {
    transform: translateX(100%);
  }
}

@keyframes dot-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 5px rgba(74, 194, 172, 0.14);
  }
  50% {
    box-shadow: 0 0 0 9px rgba(74, 194, 172, 0.04);
  }
}

/* 動きを抑えたい人には静的なオンボードを出す */
@media (prefers-reduced-motion: reduce) {
  .onboarding__shell,
  .onboarding__card {
    animation: none;
  }

  .onboarding__progress-shine,
  .onboarding__indicator.is-current .onboarding__indicator-dot {
    animation: none;
  }

  .onboarding__progress-fill,
  .onboarding__indicator,
  .onboarding__skip {
    transition: none;
  }
}
</style>
