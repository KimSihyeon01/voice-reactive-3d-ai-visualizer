/* ============================================
   Lerp & Easing Utilities
   ============================================ */

/** 선형 보간 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/** 값 클램핑 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/** easeInOutCubic 이징 함수 */
export function easeInOutCubic(t: number): number {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** easeOutExpo */
export function easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/** 부드러운 감속 (SmoothDamp) */
export function smoothDamp(
    current: number,
    target: number,
    velocityRef: { value: number },
    smoothTime: number,
    dt: number,
    maxSpeed: number = Infinity
): number {
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change = current - target;

    const maxChange = maxSpeed * smoothTime;
    change = clamp(change, -maxChange, maxChange);

    const temp = (velocityRef.value + omega * change) * dt;
    velocityRef.value = (velocityRef.value - omega * temp) * exp;
    let output = target + (change + temp) * exp;

    if (target - current > 0 === output > target) {
        output = target;
        velocityRef.value = (output - target) / dt;
    }

    return output;
}

/** 랜덤 범위 */
export function randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/** 심플 노이즈 (사인 기반) */
export function simpleNoise(x: number, y: number, time: number): number {
    return Math.sin(x * 2.7 + time) * Math.cos(y * 3.1 + time * 0.7) * 0.5 + 0.5;
}
