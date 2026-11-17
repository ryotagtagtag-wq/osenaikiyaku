<script setup lang="ts">
import { onMounted, ref } from 'vue'

// 末尾とみなす許容範囲（ピクセル）。端末の丸め誤差を吸収する。
const BOTTOM_THRESHOLD_PX = 10

// 見出しは任意で差し替えられるようにする。
const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  { title: '利用規約' },
)

const emit = defineEmits<{
  'scrolled-to-bottom': []
}>()

// 規約本体は構造化しておき、描画側は数据与えに徹する。
interface Clause {
  number: number
  heading: string
  body: string
}

const clauses: readonly Clause[] = [
  {
    number: 1,
    heading: '適用範囲',
    body: '本規約は、当サービスが提供するすべての機能および付随するコンテンツに適用されます。利用者は本規約に同意した時点で、当サービスが定める諸規定も併せて遵守するものとみなされます。',
  },
  {
    number: 2,
    heading: '会員登録',
    body: '登録を希望する方は、所定の手続きに従って必要事項を正確に入力してください。入力内容に虚偽または重大な誤りがあった場合、当サービスは登録を取り消すことができます。',
  },
  {
    number: 3,
    heading: '利用料金',
    body: '一部の有料機能については、別途定める料金表に従って料金が発生します。支払いが確認できない場合は、当該機能の利用を一時的に停止させていただく場合があります。',
  },
  {
    number: 4,
    heading: '禁止事項',
    body: '他の利用者への迷惑行為、不正なアクセス、コンテンツの無断複製、および法令に違反する行為は固く禁じます。違反が確認された場合、事前の通告なく利用を停止することがあります。',
  },
  {
    number: 5,
    heading: '知的財産権',
    body: '当サービスに含まれる文章、画像、プログラム、商標その他の知的財産権は、当サービスまたは正当な権利者に帰属します。利用者は許諾なくこれらを転載、改変、再配布できません。',
  },
  {
    number: 6,
    heading: '個人情報の取扱い',
    body: '取得した個人情報は、プライバシーポリシーに定める目的の範囲内でのみ利用します。法令に基づく開示請求がある場合を除き、本人の同意なく第三者へ提供することはありません。',
  },
  {
    number: 7,
    heading: '免責事項',
    body: '当サービスは、利用者が被った損害について、法令上必要とされる範囲を超えて責任を負いかねます。通信環境や端末に起因する不具合についても、同様に免責とさせていただきます。',
  },
  {
    number: 8,
    heading: 'サービスの停止',
    body: '保守点検、システム障害、天災その他のやむを得ない事由が生じた場合、当サービスは予告なく全部または一部の提供を停止することがあります。再開時期は速やかに告知します。',
  },
  {
    number: 9,
    heading: '規約の変更',
    body: '本規約は、社会的情勢やサービス内容の変化に伴い変更されることがあります。変更後の規約は、当サービス上に掲載した時点から効力を生じるものとします。',
  },
  {
    number: 10,
    heading: '準拠法・管轄裁判所',
    body: '本規約の解釈および適用は、日本法に準拠するものとします。本規約に関して紛争が生じた場合は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。',
  },
] as const

const scrollArea = ref<HTMLElement | null>(null)
const scrollProgress = ref(0)

// 末尾まで到達したかどうかは副作用のない判定として分離する。
function isAtBottom(element: HTMLElement, threshold: number): boolean {
  return element.scrollTop + element.clientHeight >= element.scrollHeight - threshold
}

// 進捗率は 0〜100 に収めてから表示へ渡す。
function updateProgress(element: HTMLElement): void {
  const scrollableDistance = element.scrollHeight - element.clientHeight
  if (scrollableDistance <= 0) {
    scrollProgress.value = 100
    return
  }

  const ratio = element.scrollTop / scrollableDistance
  scrollProgress.value = Math.min(100, Math.max(0, ratio * 100))
}

// 通知は一度きり。既に発火済みなら、以降のスクロールでは何もしない。
let hasNotified = false

function notifyReachedBottom(): void {
  if (hasNotified) return
  hasNotified = true
  emit('scrolled-to-bottom')
}

function handleScroll(): void {
  const element = scrollArea.value
  if (!element) return

  updateProgress(element)
  if (!isAtBottom(element, BOTTOM_THRESHOLD_PX)) return

  notifyReachedBottom()
}

onMounted(() => {
  const element = scrollArea.value
  if (!element) return

  updateProgress(element)
  // 画面に収まる短文でも「末尾まで読んだ」状態として扱い、操作不能を防ぐ。
  if (isAtBottom(element, BOTTOM_THRESHOLD_PX)) notifyReachedBottom()
})
</script>

<template>
  <section class="terms" :aria-label="props.title">
    <header class="terms__header">
      <p class="terms__eyebrow">AGREEMENT / 2026</p>
      <h2 class="terms__title">{{ props.title }}</h2>
      <p class="terms__lead">ご利用にあたっては、以下のすべての条項を最後までご確認ください。</p>
    </header>

    <div class="terms__frame">
      <!-- キーボードでもスクロールできるよう、スクロール領域へフォーカスを当てられるようにする。 -->
      <div
        ref="scrollArea"
        class="terms__scroll"
        role="region"
        tabindex="0"
        :aria-label="`${props.title}本文`"
        @scroll.passive="handleScroll"
      >
        <article v-for="clause in clauses" :key="clause.number" class="clause">
          <span class="clause__number">{{ String(clause.number).padStart(2, '0') }}</span>
          <div class="clause__content">
            <h3 class="clause__heading">第{{ clause.number }}条（{{ clause.heading }}）</h3>
            <p class="clause__body">{{ clause.body }}</p>
          </div>
        </article>
        <p class="terms__end">— 以上 —</p>
      </div>

      <!-- スクロールの進み具合を一本の線で示す。 -->
      <div class="terms__progress" aria-hidden="true">
        <div class="terms__progress-fill" :style="{ width: `${scrollProgress}%` }" />
      </div>
    </div>

    <p class="terms__hint">本文を末尾までスクロールすると、同意操作が可能になります。</p>
  </section>
</template>

<style scoped>
/* 用紙のような落ち着いた塊として、周囲のグレーから浮かせる。 */
.terms {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: min(100%, 660px);
}

.terms__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.terms__eyebrow {
  color: #9e2b23;
  font-family: 'Courier New', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.32em;
}

.terms__title {
  color: #162a42;
  font-family: 'Yu Mincho', 'Hiragino Mincho ProN', serif;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.terms__lead {
  color: #5d6672;
  font-size: 0.72rem;
  line-height: 1.7;
}

.terms__frame {
  position: relative;
  border: 1px solid rgba(22, 42, 66, 0.22);
  background:
    repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent 26px,
      rgba(22, 42, 66, 0.04) 26px,
      rgba(22, 42, 66, 0.04) 27px
    ),
    linear-gradient(155deg, #fffdf6 0%, #f2eee1 100%);
  box-shadow:
    0 24px 48px -30px rgba(22, 42, 66, 0.65),
    inset 0 0 0 1px rgba(255, 255, 255, 0.75);
}

/* あえて小さめの文字組みにし、最後まで読ませるギミックにする。 */
.terms__scroll {
  max-height: 300px;
  overflow-y: auto;
  padding: 24px 28px 30px;
  color: #2b3441;
  font-size: 11px;
  line-height: 1.85;
  scrollbar-color: #9e2b23 rgba(22, 42, 66, 0.08);
  scrollbar-width: thin;
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 16px,
    #000 calc(100% - 22px),
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 16px,
    #000 calc(100% - 22px),
    transparent 100%
  );
}

.terms__scroll:focus-visible {
  outline: 2px solid #9e2b23;
  outline-offset: -3px;
}

.terms__scroll::-webkit-scrollbar {
  width: 6px;
}

.terms__scroll::-webkit-scrollbar-thumb {
  background: #9e2b23;
  border-radius: 3px;
}

.clause {
  display: grid;
  grid-template-columns: 2.75rem 1fr;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(22, 42, 66, 0.12);
}

.clause:first-child {
  padding-top: 0;
}

.clause__number {
  color: #9e2b23;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.45rem;
  line-height: 1;
  opacity: 0.72;
}

.clause__heading {
  margin-bottom: 5px;
  color: #162a42;
  font-family: 'Yu Mincho', 'Hiragino Mincho ProN', serif;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.clause__body {
  font-size: 11px;
  line-height: 1.9;
}

.terms__end {
  padding-top: 18px;
  color: #8b8272;
  font-family: 'Yu Mincho', 'Hiragino Mincho ProN', serif;
  font-size: 0.72rem;
  letter-spacing: 0.3em;
  text-align: center;
}

/* スクロールに応じて伸びる一本線が、この画面の主な動きになる。 */
.terms__progress {
  height: 3px;
  background: rgba(22, 42, 66, 0.12);
}

.terms__progress-fill {
  width: 0;
  height: 100%;
  background: linear-gradient(90deg, #9e2b23, #d08a3c);
  transition: width 120ms linear;
}

.terms__hint {
  color: #6b7280;
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  text-align: right;
}

@media (prefers-reduced-motion: reduce) {
  .terms__progress-fill {
    transition: none;
  }
}
</style>
