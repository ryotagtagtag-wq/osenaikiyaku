<script setup lang="ts">
import { ref, computed } from 'vue'
import TermsOfService from './components/TermsOfService.vue'
import AgreeCheckbox from './components/AgreeCheckbox.vue'
import UnclickableButton from './components/UnclickableButton.vue'
import CompleteScreen from './components/CompleteScreen.vue'

// 画面状態
const scrolledToBottom = ref(false)      // 規約を最後までスクロールしたか
const agreed = ref(false)                // チェックボックスの状態
const completed = ref(false)             // 同意完了か
const escapeCount = ref(0)               // ボタンが逃げた回数

// ボタンが有効か：規約を最後まで読み、チェック済みであること
const buttonEnabled = computed(() => scrolledToBottom.value && agreed.value)

// 規約を最後までスクロールした
const handleScrolledToBottom = () => {
  scrolledToBottom.value = true
}

// チェック状態変更
const handleUpdateModelValue = (value: boolean) => {
  agreed.value = value
}

// ボタンが押された（clicked は静止フェーズでのみ発火）
const handleClicked = () => {
  completed.value = true
}

// ボタンが逃げた回数を親から受け取るため、子からは escpedCount を sync しない設計。
// ここでは親側で escapeCount を保持し、子に props として渡す。
// ただし子内部でもカウントしているため、親の escapeCount は表示用のみ。

// もう一度やる（リセット）
const handleRestart = () => {
  scrolledToBottom.value = false
  agreed.value = false
  completed.value = false
  escapeCount.value = 0
}
</script>

<template>
  <div class="app">
    <!-- 規約・同意エリア -->
    <section v-if="!completed" class="terms-section">
      <TermsOfService @scrolled-to-bottom="handleScrolledToBottom" />

      <div class="controls">
        <AgreeCheckbox
          v-model:model-value="agreed"
          :disabled="!scrolledToBottom"
          label="上記の利用規約に同意します"
        />
        <UnclickableButton
          :label="buttonEnabled ? '同意する' : '規約を最後までお読みください'"
          :disabled="!buttonEnabled"
          :escaped-count="escapeCount"
          @clicked="handleClicked"
        />
      </div>
    </section>

    <!-- 同意完了画面 -->
    <CompleteScreen
      v-else
      :message="'絶対に押せないボタンを、あなたは押しました。' + '\n' + 'おめでとうございます！'"
      :show-restart="true"
      @restart="handleRestart"
    />
  </div>
</template>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #222;
  padding: 24px;
  gap: 24px;
  overflow: auto;
}

.terms-section {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: stretch;
}
</style>
