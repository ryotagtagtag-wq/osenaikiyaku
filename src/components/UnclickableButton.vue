<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { getRandomPosition } from '../utils/randomPosition'

// サイズと座標は px 数値で受け渡す（utils 側の実装と合わせるための形）
interface BoxSize {
  width: number
  height: number
}

interface BoxPosition {
  left: number
  top: number
}

const props = withDefaults(
  defineProps<{
    label?: string
    disabled?: boolean
    escapedCount?: number
  }>(),
  {
    label: '同意する',
    disabled: false,
    escapedCount: 0,
  },
)

const emit = defineEmits<{
  clicked: []
}>()

// 挙動を決める定数。数値を一箇所に集めて調整しやすくする
const NEARBY_DISTANCE = 140 // カーソルがこの距離まで来たら逃げる
const ESCAPE_COOLDOWN_MS = 220 // 連続で逃げすぎないための間隔
const MIN_SHIFT_DISTANCE = 90 // ワープ時に必ず離れる距離
const EVASIVE_STAGE_THRESHOLD = 4 // 縮小・透明化・回転を始める回数
const FINAL_STAGE_THRESHOLD = 9 // 慈悲の静止フェーズに入る回数
const FREEZE_DURATION_MS = 1400 // 静止している時間

const areaRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)
const position = ref<BoxPosition>({ left: 0, top: 0 })
const escapeCount = ref(props.escapedCount)
const rotation = ref(0)
const isFrozen = ref(false)

let lastEscapeAt = 0
let freezeTimer: ReturnType<typeof setTimeout> | undefined

// 親から逃げ回数が渡されたら追従させる。内部カウントは後戻りしない
watch(
  () => props.escapedCount,
  (count) => {
    escapeCount.value = Math.max(escapeCount.value, count)
  },
)

const isEvasive = computed(() => escapeCount.value >= EVASIVE_STAGE_THRESHOLD)
const isFinalStage = computed(() => escapeCount.value >= FINAL_STAGE_THRESHOLD)
const canPress = computed(() => !props.disabled && isFrozen.value)

// 段階が上がるほど小さく・薄く・傾く。静止中は不透明度だけ戻して押せる風に見せる
const scale = computed(() => (isEvasive.value ? (isFinalStage.value ? 0.72 : 0.88) : 1))
const opacity = computed(() => {
  if (isFrozen.value || !isEvasive.value) return 1
  return isFinalStage.value ? 0.78 : 0.9
})

const buttonStyle = computed<CSSProperties>(() => ({
  left: `${position.value.left}px`,
  top: `${position.value.top}px`,
  transform: `rotate(${rotation.value}deg) scale(${scale.value})`,
  opacity: opacity.value,
}))

// 配置領域とボタンの実寸を取得する。transform の影響を受けない offset 系を使う
function measureBoxes(): { area: BoxSize; button: BoxSize } | null {
  const area = areaRef.value
  const button = buttonRef.value
  if (!area || !button) return null

  return {
    area: { width: area.clientWidth, height: area.clientHeight },
    button: { width: button.offsetWidth, height: button.offsetHeight },
  }
}

// 数値を 0 〜 上限の範囲に収める
function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, 0), Math.max(max, 0))
}

// utils が返す x/y を left/top に読み替え、ボタン全体が領域に収まるよう調整する
function randomSpot(boxes: { area: BoxSize; button: BoxSize }): BoxPosition {
  const random = getRandomPosition({
    width: boxes.area.width,
    height: boxes.area.height,
    margin: Math.max(40, boxes.button.width / 2, boxes.button.height / 2),
  })

  return {
    left: clamp(random.x, boxes.area.width - boxes.button.width),
    top: clamp(random.y, boxes.area.height - boxes.button.height),
  }
}

// ランダム位置へ送り、現在地から離れすぎていなければ最低距離だけずらす
function warp(): void {
  if (props.disabled || isFrozen.value) return

  const now = Date.now()
  if (now - lastEscapeAt < ESCAPE_COOLDOWN_MS) return
  lastEscapeAt = now

  const boxes = measureBoxes()
  if (!boxes) return

  const maxLeft = boxes.area.width - boxes.button.width
  const maxTop = boxes.area.height - boxes.button.height
  const next = randomSpot(boxes)

  const dx = next.left - position.value.left
  const dy = next.top - position.value.top
  if (Math.hypot(dx, dy) < MIN_SHIFT_DISTANCE) {
    const pushX = dx >= 0 ? MIN_SHIFT_DISTANCE : -MIN_SHIFT_DISTANCE
    const pushY = dy >= 0 ? MIN_SHIFT_DISTANCE : -MIN_SHIFT_DISTANCE
    next.left = clamp(next.left + pushX, maxLeft)
    next.top = clamp(next.top + pushY, maxTop)
  }

  position.value = next
  if (isEvasive.value) {
    rotation.value += Math.random() > 0.5 ? 24 : -24
  }
  escapeCount.value += 1

  // 最終段階に到達したら、追いかけた人にだけ見える静止時間を作る
  if (isFinalStage.value) beginFreeze()
}

// 一定時間だけ逃げるのを止め、クリックとタップを受け付ける
function beginFreeze(): void {
  isFrozen.value = true
  if (freezeTimer !== undefined) clearTimeout(freezeTimer)
  freezeTimer = setTimeout(() => {
    isFrozen.value = false
    freezeTimer = undefined
  }, FREEZE_DURATION_MS)
}

// 押されたら静止状態を即座に終えて、また逃げられるようにする
function endFreeze(): void {
  if (freezeTimer !== undefined) clearTimeout(freezeTimer)
  freezeTimer = undefined
  isFrozen.value = false
}

// ウィンドウ全体のマウス移動を見て、近づいてきたら逃げる
function handleMouseMove(event: MouseEvent): void {
  const button = buttonRef.value
  if (props.disabled || isFrozen.value || !button) return

  const rect = button.getBoundingClientRect()
  const distance = Math.hypot(
    event.clientX - (rect.left + rect.width / 2),
    event.clientY - (rect.top + rect.height / 2),
  )
  if (distance <= NEARBY_DISTANCE) warp()
}

function handleClick(event: MouseEvent): void {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  if (canPress.value) {
    emit('clicked')
    endFreeze()
    return
  }
  // 通常時は押させない。デフォルト動作を止めて位置をずらす
  event.preventDefault()
  event.stopPropagation()
  warp()
}

// touchstart では preventDefault しない（touchend も逃げさせるため）
function handleTouchStart(): void {
  if (props.disabled || isFrozen.value) return
  warp()
}

function handleTouchEnd(event: TouchEvent): void {
  if (props.disabled) return
  if (canPress.value) {
    emit('clicked')
    endFreeze()
    return
  }
  // タップ後の click 発火も塞ぐ
  event.preventDefault()
  warp()
}

onMounted(() => {
  const boxes = measureBoxes()
  if (boxes) position.value = randomSpot(boxes)
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  if (freezeTimer !== undefined) clearTimeout(freezeTimer)
})
</script>

<template>
  <div ref="areaRef" class="escape-area">
    <button
      ref="buttonRef"
      type="button"
      class="escape-button"
      :class="{
        'is-evasive': isEvasive,
        'is-final': isFinalStage,
        'is-frozen': isFrozen,
      }"
      :style="buttonStyle"
      :disabled="disabled"
      @click="handleClick"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <span class="escape-button__label">{{ label }}</span>
      <span class="escape-button__glint" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.escape-area {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 20rem;
  overflow: hidden;
}

.escape-button {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 9.5rem;
  padding: 0.85rem 1.6rem;
  overflow: hidden;
  color: #fff8f2;
  font-family: 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  white-space: nowrap;
  cursor: default;
  background: linear-gradient(145deg, #ff5252 0%, #cc2233 55%, #8c0f1c 100%);
  border: 1px solid rgba(255, 232, 220, 0.55);
  border-radius: 3px;
  box-shadow:
    0 18px 36px rgba(78, 4, 12, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transform-origin: center center;
  transition:
    left 260ms cubic-bezier(0.2, 0.9, 0.2, 1),
    top 260ms cubic-bezier(0.2, 0.9, 0.2, 1),
    transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 420ms ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.escape-button:disabled {
  cursor: not-allowed;
  filter: grayscale(0.7);
}

.escape-button__label {
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 6px rgba(70, 0, 8, 0.6);
}

/* 表面の斜めの光。押せない存在感を出すための装飾 */
.escape-button__glint {
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  background: radial-gradient(circle at 28% 0%, rgba(255, 255, 255, 0.3), transparent 58%);
  pointer-events: none;
}

/* 逃げる回数が増えると、小さく・薄く・カクカクと傾く */
.escape-button.is-evasive {
  letter-spacing: 0.12em;
}

.escape-button.is-final {
  box-shadow:
    0 24px 44px rgba(78, 4, 12, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

/* 慈悲の静止中だけ、鼓動とポインタで「今なら押せる」と示す */
.escape-button.is-frozen {
  cursor: pointer;
  animation: mercy-pulse 1.4s ease-in-out infinite;
}

@keyframes mercy-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 0 rgba(255, 82, 82, 0.55),
      0 18px 36px rgba(78, 4, 12, 0.45);
  }
  50% {
    box-shadow:
      0 0 0 14px rgba(255, 82, 82, 0),
      0 18px 36px rgba(78, 4, 12, 0.35);
  }
}

@media (prefers-reduced-motion: reduce) {
  .escape-button {
    transition-duration: 1ms;
  }

  .escape-button.is-frozen {
    animation: none;
  }
}
</style>
