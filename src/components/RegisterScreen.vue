<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import UnclickableButton from './UnclickableButton.vue'

interface Props {
  /** カードの見出し。省略時は「新規登録」 */
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '新規登録',
})

/** 登録が「成功」したら親へ通知する。実際の登録処理は行わない */
const emit = defineEmits<{
  registered: []
}>()

/** 入力を繰り返した回数の上限。超えると一時的にシステムエラーになる */
const INPUT_LIMIT = 6
/** システムエラーから復旧するまでの待ち時間 */
const RECOVERY_MS = 5000

// 入力値はエラーが出ても決してクリアしない。消えない入力値がイライラの主体になる
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const inputAttempts = ref(0)
const isSystemError = ref(false)

let recoveryTimer: ReturnType<typeof setTimeout> | undefined

/** メール欄に文字が入っている限り、@ の有無にかかわらずエラーを出し続ける */
const hasEmailError = computed(() => email.value.trim().length > 0)

/** 確認欄に文字が入っている限り、パスワードと一致していてもエラーを出し続ける */
const hasConfirmError = computed(() => confirmPassword.value.length > 0)

/** 入力のたびに試行回数を数え、上限に達したらフォームを凍結する */
function handleInput(): void {
  // 凍結中は fieldset の disabled と二重にガードし、カウントを進めない
  if (isSystemError.value) return

  inputAttempts.value += 1
  if (inputAttempts.value >= INPUT_LIMIT) beginSystemError()
}

/** フォームを無効化し、一定時間後に入力値を保ったまま復旧させる */
function beginSystemError(): void {
  isSystemError.value = true
  recoveryTimer = setTimeout(() => {
    isSystemError.value = false
    inputAttempts.value = 0
    recoveryTimer = undefined
  }, RECOVERY_MS)
}

/** 逃げるボタンが押されたら、登録完了として親へ通知する */
function handleRegistered(): void {
  emit('registered')
}

onBeforeUnmount(() => {
  if (recoveryTimer !== undefined) clearTimeout(recoveryTimer)
})
</script>

<template>
  <section class="register" aria-labelledby="register-title">
    <!-- 右端に回した大きな透かし。意味はないので読み上げから除外する -->
    <span class="register__watermark" aria-hidden="true">REGISTER</span>

    <div class="register__card">
      <header class="register__header">
        <p class="register__eyebrow">CREATE YOUR ACCOUNT</p>
        <h1 id="register-title" class="register__title">{{ props.title }}</h1>
        <p class="register__lead">以下の項目を入力して、アカウントを作成してください。</p>
      </header>

      <!-- 送信はさせない。Enter キーによる意図しない submit もここで塞ぐ -->
      <form class="register__form" novalidate @submit.prevent>
        <!-- システムエラー中は fieldset ごと無効化し、入力値は保持したまま凍結する -->
        <fieldset class="register__fields" :disabled="isSystemError">
          <div class="field">
            <label class="field__label" for="register-email">メールアドレス</label>
            <input
              id="register-email"
              v-model="email"
              class="field__input"
              :class="{ 'is-invalid': hasEmailError }"
              type="email"
              name="email"
              autocomplete="email"
              placeholder="you@example.com"
              :aria-invalid="hasEmailError ? 'true' : undefined"
              :aria-describedby="hasEmailError ? 'register-email-error' : undefined"
              @input="handleInput"
            />
            <p
              v-if="hasEmailError"
              id="register-email-error"
              class="field__error"
              role="alert"
            >
              無効なメールアドレスです
            </p>
          </div>

          <div class="field">
            <label class="field__label" for="register-password">パスワード</label>
            <input
              id="register-password"
              v-model="password"
              class="field__input"
              type="password"
              name="password"
              autocomplete="new-password"
              placeholder="6文字以上で入力"
              @input="handleInput"
            />
          </div>

          <div class="field">
            <label class="field__label" for="register-confirm">パスワード（確認）</label>
            <input
              id="register-confirm"
              v-model="confirmPassword"
              class="field__input"
              :class="{ 'is-invalid': hasConfirmError }"
              type="password"
              name="confirmPassword"
              autocomplete="new-password"
              placeholder="もう一度入力してください"
              :aria-invalid="hasConfirmError ? 'true' : undefined"
              :aria-describedby="hasConfirmError ? 'register-confirm-error' : undefined"
              @input="handleInput"
            />
            <p
              v-if="hasConfirmError"
              id="register-confirm-error"
              class="field__error"
              role="alert"
            >
              パスワードが一致しません
            </p>
          </div>
        </fieldset>

        <!-- 入力を繰り返したときだけ出る。5秒後に自分で消える -->
        <p v-if="isSystemError" class="register__system-error" role="alert">
          一時的にシステムエラーです。しばらくしてからもう一度お試しください。
        </p>

        <!-- エラーが残っているため、この逃げるボタンは常に押せない -->
        <div class="register__button-area">
          <p class="register__hint">登録ボタンを押して手続きを完了してください</p>
          <UnclickableButton label="登録する" disabled @clicked="handleRegistered" />
        </div>

        <p class="register__footer">登録することで、利用規約に同意したものとみなされます。</p>
      </form>
    </div>
  </section>
</template>

<style scoped>
/* この画面は深い藍の背景に、紙の白いカードを浮かべる */
.register {
  --ink: #171d2b;
  --muted: #6b7280;
  --paper: #fffdf9;
  --line: #e7e0d5;
  --accent: #b3261e;
  --accent-dark: #8c1d17;

  position: relative;
  display: grid;
  place-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: clamp(2rem, 5vw, 4.5rem) 1.25rem;
  overflow: hidden;
  isolation: isolate;
  color: var(--ink);
  background:
    radial-gradient(circle at 78% 14%, rgb(179 38 30 / 22%) 0%, transparent 42%),
    radial-gradient(circle at 8% 92%, rgb(40 64 110 / 30%) 0%, transparent 48%),
    linear-gradient(155deg, #1b2231 0%, #101622 55%, #080c14 100%);
  font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
}

/* 背景に紙の粒子のような極薄のストライプを重ねる */
.register::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: repeating-linear-gradient(
    115deg,
    rgb(255 255 255 / 1.8%) 0px,
    rgb(255 255 255 / 1.8%) 1px,
    transparent 1px,
    transparent 5px
  );
  content: '';
  pointer-events: none;
}

/* カードの右で縦に伸びる透かし。非対称な余白を作る */
.register__watermark {
  position: absolute;
  top: 50%;
  right: -0.12em;
  z-index: -1;
  color: rgb(255 253 249 / 4.5%);
  font-family: 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif;
  font-size: clamp(7rem, 22vw, 21rem);
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 0.85;
  white-space: nowrap;
  user-select: none;
  transform: translateY(-50%) rotate(-90deg);
}

.register__card {
  position: relative;
  width: min(100%, 30rem);
  padding: clamp(1.75rem, 4vw, 2.75rem);
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 6px;
  background:
    repeating-linear-gradient(
      0deg,
      rgb(23 29 43 / 1.6%) 0px,
      rgb(23 29 43 / 1.6%) 1px,
      transparent 1px,
      transparent 4px
    ),
    var(--paper);
  box-shadow:
    0 40px 80px rgb(3 6 12 / 55%),
    inset 0 2px 0 rgb(255 255 255 / 70%);
  animation: card-enter 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.register__header {
  margin-bottom: 1.75rem;
}

.register__eyebrow {
  color: var(--accent);
  font-family: 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.34em;
}

.register__title {
  margin: 0.4rem 0 0.65rem;
  font-family: 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif;
  font-size: clamp(2rem, 6vw, 2.75rem);
  font-weight: 600;
  letter-spacing: 0.12em;
  line-height: 1.2;
}

.register__lead {
  margin: 0;
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.8;
}

.register__form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.register__fields {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

/* 凍結中は薄くして、まだ入力できないことを示す */
.register__fields:disabled {
  opacity: 0.62;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.field__label {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.field__input {
  box-sizing: border-box;
  width: 100%;
  padding: 0.82rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 3px;
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-size: 0.95rem;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.field__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgb(179 38 30 / 12%);
}

/* エラーが出た入力欄は朱色の枠に変える。入力値そのものは残す */
.field__input.is-invalid {
  border-color: var(--accent);
  background: #fffafa;
}

.field__error {
  margin: 0;
  padding-left: 0.6rem;
  border-left: 2px solid var(--accent);
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.5;
  animation: error-in 260ms ease-out both;
}

.register__system-error {
  margin: 0;
  padding: 0.85rem 1rem;
  border-left: 3px solid var(--accent);
  background: #fff1ef;
  color: var(--accent-dark);
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.6;
  animation: system-shake 420ms ease-in-out both;
}

/* UnclickableButton の配置領域。20rem のなかでボタンがランダムに置かれる */
.register__button-area {
  position: relative;
  height: 20rem;
  margin-top: 0.4rem;
  overflow: hidden;
  border-top: 1px dashed var(--line);
  background: repeating-linear-gradient(
    135deg,
    rgb(23 29 43 / 1.8%) 0px,
    rgb(23 29 43 / 1.8%) 1px,
    transparent 1px,
    transparent 6px
  );
}

.register__hint {
  position: absolute;
  top: 1.1rem;
  right: 0;
  left: 0;
  margin: 0;
  color: var(--muted);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-align: center;
  pointer-events: none;
}

.register__footer {
  margin: 0;
  color: var(--muted);
  font-size: 0.74rem;
  line-height: 1.7;
  text-align: center;
}

/* カードが奥から浮き上がる。この画面の主役の動き */
@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes error-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* システムエラーが出た瞬間だけガタつく */
@keyframes system-shake {
  0%,
  100% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(-4px);
  }

  40% {
    transform: translateX(4px);
  }

  60% {
    transform: translateX(-2px);
  }

  80% {
    transform: translateX(2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .register__card,
  .field__error,
  .register__system-error {
    animation: none;
  }
}
</style>
