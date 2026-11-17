<script setup lang="ts">
import { computed, ref } from 'vue'
import RegisterScreen from './components/RegisterScreen.vue'
import OnboardingScreen from './components/OnboardingScreen.vue'
import TermsOfService from './components/TermsOfService.vue'
import CompleteScreen from './components/CompleteScreen.vue'
import AgreeCheckbox from './components/AgreeCheckbox.vue'
import UnclickableButton from './components/UnclickableButton.vue'

// 画面を表す共用体。遷移はこの値だけを書き換えて進める。
type Screen = 'top' | 'register' | 'onboarding' | 'terms' | 'complete'

// 現在の画面（初期状態はトップ）
const currentScreen = ref<Screen>('top')

// 同意操作の前提となる二つの状態
const scrolledToBottom = ref(false) // 規約を末尾まで読んだか
const agreed = ref(false) // 同意チェックが入ったか

// 両方そろって初めてボタンが有効になる（実際は逃げるが）
const buttonEnabled = computed(() => scrolledToBottom.value && agreed.value)

// 子コンポーネントとの契約:
//   RegisterScreen  ... emits: registered（入力と登録確認を内部で完結させる）
//   OnboardingScreen ... emits: completed
//   TermsOfService  ... emits: scrolled-to-bottom
//   AgreeCheckbox   ... v-model(modelValue) / props: disabled, label
//   UnclickableButton ... props: label, disabled / emits: clicked
//   CompleteScreen  ... props: message, showRestart / emits: restart

// 登録が確定し、5ステップの案内へ
function handleRegistered(): void {
  currentScreen.value = 'onboarding'
}

// 5ステップを完了し、利用規約へ
function handleOnboardingComplete(): void {
  currentScreen.value = 'terms'
}

// 規約を最後までスクロールした
function handleScrolledToBottom(): void {
  scrolledToBottom.value = true
}

// 逃げるボタンを押せた → 完了画面へ
function handleClicked(): void {
  currentScreen.value = 'complete'
}

// もう一度やる：画面も同意状態も最初に戻す
function handleRestart(): void {
  scrolledToBottom.value = false
  agreed.value = false
  currentScreen.value = 'top'
}
</script>

<template>
  <div class="app">
    <!-- 一度に一つの画面だけを出し、次の画面がわずかに持ち上がって入る -->
    <Transition name="screen" mode="out-in">
      <!-- トップの入力と登録確認は RegisterScreen 内部で完結する -->
      <RegisterScreen
        v-if="currentScreen === 'top' || currentScreen === 'register'"
        @registered="handleRegistered"
      />

      <!-- 5ステップのオンボーディング -->
      <OnboardingScreen
        v-else-if="currentScreen === 'onboarding'"
        @completed="handleOnboardingComplete"
      />

      <!-- 利用規約＋同意操作。逃げるボタンには十分な運動領域を取る -->
      <section v-else-if="currentScreen === 'terms'" class="terms-screen">
        <TermsOfService @scrolled-to-bottom="handleScrolledToBottom" />

        <div class="terms-screen__controls">
          <AgreeCheckbox
            v-model="agreed"
            :disabled="!scrolledToBottom"
            label="上記の利用規約に同意します"
          />
          <UnclickableButton
            :label="buttonEnabled ? '同意する' : '規約を最後までお読みください'"
            :disabled="!buttonEnabled"
            :difficulty="5"
            @clicked="handleClicked"
          />
        </div>
      </section>

      <!-- 完了 -->
      <CompleteScreen
        v-else
        message="絶対に押せないボタンを、あなたは押しました。おめでとうございます！"
        :show-restart="true"
        @restart="handleRestart"
      />
    </Transition>
  </div>
</template>

<style scoped>
/* 画面いっぱいに広げ、中身を中央へ。単色にしないため淡い二方向の光を重ねる。 */
/* 各画面は自ら 100vh を持つため、ここでは余白を取らない（terms 側で取る）。 */
.app {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: auto;
  background:
    radial-gradient(circle at 16% 10%, rgba(158, 43, 35, 0.07), transparent 44%),
    radial-gradient(circle at 84% 90%, rgba(22, 42, 66, 0.09), transparent 46%),
    #f5f5f5;
}

.terms-screen {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: min(100%, 720px);
  margin: auto;
  /* 左端の赤い一本が、中央寄せの垂直線をわずかに崩す。 */
  padding: 24px 24px 24px 18px;
  border-left: 2px solid rgba(158, 43, 35, 0.45);
}

.terms-screen__controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* ボタンが逃げるための領域を確保する。 */
  min-height: 22rem;
}

/* このアプリの主な動き：退出は上へ消え、登場は下から現れる。 */
.screen-enter-active,
.screen-leave-active {
  transition:
    opacity 260ms ease,
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.screen-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.99);
}

.screen-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
}

@media (prefers-reduced-motion: reduce) {
  .screen-enter-active,
  .screen-leave-active {
    transition: none;
  }
}
</style>
