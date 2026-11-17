/** 画面端からボタンを離す既定の余白（px） */
const DEFAULT_MARGIN = 40;

/** 座標生成に必要な画面サイズと余白 */
type RandomPositionOptions = {
  width: number;
  height: number;
  margin?: number;
};

/** 生成された座標（ボタンの左上を想定） */
type Position = {
  x: number;
  y: number;
};

/** 値を [min, max] の範囲に収める */
const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * ウィンドウサイズ内に収まるランダムな座標を生成する。
 * 「絶対に押せない」ボタンの配置先として使う。
 */
export function getRandomPosition({
  width,
  height,
  margin = DEFAULT_MARGIN,
}: RandomPositionOptions): Position {
  // ガード節: 数値として不正な入力は即座に拒否する
  if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(margin)) {
    throw new TypeError("width, height, margin は有限の数値でなければなりません。");
  }
  if (width <= 0 || height <= 0) {
    throw new RangeError("width と height は正の数でなければなりません。");
  }
  if (margin < 0) {
    throw new RangeError("margin は 0 以上でなければなりません。");
  }

  const minX = margin;
  const maxX = width - margin;
  const minY = margin;
  const maxY = height - margin;

  // 余白が大きすぎて有効範囲が逆転する場合は、中央を返して画面外への欠けを防ぐ
  if (minX > maxX || minY > maxY) {
    return { x: width / 2, y: height / 2 };
  }

  // 乱数を生成したうえで clamp し、確実に画面内へ収める
  return {
    x: clamp(Math.random() * width, minX, maxX),
    y: clamp(Math.random() * height, minY, maxY),
  };
}
