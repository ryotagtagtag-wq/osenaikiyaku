<script setup lang="ts">
// 親と v-model で同期する同意状態と、表示・操作の制御フラグ
withDefaults(
  defineProps<{
    modelValue?: boolean
    disabled?: boolean
    label?: string
  }>(),
  {
    modelValue: false,
    disabled: false,
    label: '上記の利用規約に同意します',
  },
)

// チェック状態の変更を親へ通知する（v-model の更新用）
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// ネイティブの change イベントからチェック状態を取り出して発火
function onChange(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<template>
  <label
    class="agree-checkbox"
    :class="{ 'is-checked': modelValue, 'is-disabled': disabled }"
  >
    <!-- 実体の checkbox はレイアウトに影響しないよう視覚的に隠し、label で操作する -->
    <input
      class="agree-checkbox__input"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="onChange"
    />

    <!-- 見た目のチェックボックス（装飾のみ、支援技術には実体を伝える） -->
    <span class="agree-checkbox__box" aria-hidden="true">
      <span class="agree-checkbox__mark"></span>
    </span>

    <span class="agree-checkbox__label">{{ label }}</span>
  </label>
</template>

<style scoped>
/* クリック領域全体をラベルとして扱い、意図しない余白の誤爆を防ぐ */
.agree-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem 0.5rem 0.25rem;
  cursor: pointer;
  user-select: none;
}

/* 実体の入力は視覚的に隠すが、フォーカスとキーボード操作は維持する */
.agree-checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  opacity: 0;
}

/* やや小さめのボックスに警告色の枠を重ね、奥行きを持たせる */
.agree-checkbox__box {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 2px solid #b3261e;
  border-radius: 3px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(179 38 30 / 18%);
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

/* チェックマークは2本の線を回転させて構成し、出現をアニメーションする */
.agree-checkbox__mark {
  width: 5px;
  height: 9px;
  margin-top: -2px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) scale(0);
  transform-origin: center;
  transition: transform 160ms ease-out;
}

/* チェック時: 背景を警告色で塗り、マークを素早く出現させる */
.agree-checkbox.is-checked .agree-checkbox__box {
  background: #b3261e;
  border-color: #8c1d17;
  box-shadow: 0 2px 6px rgb(179 38 30 / 35%);
}

.agree-checkbox.is-checked .agree-checkbox__mark {
  transform: rotate(45deg) scale(1);
}

/* キーボード操作時だけ枠の外側にフォーカスリングを描く */
.agree-checkbox__input:focus-visible + .agree-checkbox__box {
  outline: 2px solid #8c1d17;
  outline-offset: 2px;
}

/* 文言は既存の日本語フォントを継承し、読みやすさと存在感を両立 */
.agree-checkbox__label {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.5;
  color: #222;
}

/* 無効時は操作不可を明示し、装飾のアニメーションも止める */
.agree-checkbox.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.agree-checkbox.is-disabled .agree-checkbox__box,
.agree-checkbox.is-disabled .agree-checkbox__mark {
  transition: none;
}

/* ホバー時はわずかに枠を濃くして操作可能を示す（無効時は除く） */
.agree-checkbox:not(.is-disabled):hover .agree-checkbox__box {
  border-color: #8c1d17;
}
</style>
