/**
 * 부드러운 값 보간 애니메이션 유틸리티
 */

type EasingFunction = (t: number) => number;

// easeInOutQuad - 부드러운 가감속
export const easeInOutQuad: EasingFunction = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// easeOutBack - 살짝 튀어오르는 효과
export const easeOutBack: EasingFunction = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// easeOutElastic - 탄성 효과
export const easeOutElastic: EasingFunction = (t) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

/**
 * 객체의 숫자 속성을 부드럽게 애니메이션
 * Three.js Vector3 등과 호환됨
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function animateValue(
  obj: any,
  key: string,
  target: number,
  duration: number,
  easing: EasingFunction = easeInOutQuad
): Promise<void> {
  return new Promise((resolve) => {
    const start = obj[key] as number;
    const delta = target - start;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      obj[key] = start + delta * easing(progress);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(step);
  });
}

/**
 * 여러 속성을 동시에 애니메이션
 */
export function animateMultiple(
  obj: { [key: string]: number },
  targets: { [key: string]: number },
  duration: number,
  easing: EasingFunction = easeInOutQuad
): Promise<void> {
  const keys = Object.keys(targets);
  const starts: { [key: string]: number } = {};
  const deltas: { [key: string]: number } = {};

  keys.forEach((key) => {
    starts[key] = obj[key];
    deltas[key] = targets[key] - starts[key];
  });

  return new Promise((resolve) => {
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      keys.forEach((key) => {
        obj[key] = starts[key] + deltas[key] * easedProgress;
      });

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(step);
  });
}
