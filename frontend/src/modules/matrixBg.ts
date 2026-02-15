/* ============================================
   Matrix Background Module
   매트릭스 스타일 숫자 비 효과
   ============================================ */

export class MatrixBackground {
    private container: HTMLElement;
    private chars: HTMLSpanElement[] = [];
    private charCount = 80;

    constructor(containerId: string = 'matrix-bg') {
        this.container = document.getElementById(containerId)!;
    }

    /** 매트릭스 배경 초기화 */
    init(): void {
        if (!this.container) return;

        const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト';

        for (let i = 0; i < this.charCount; i++) {
            const span = document.createElement('span');
            span.className = 'matrix-char';
            span.textContent = characters[Math.floor(Math.random() * characters.length)];

            // 랜덤 위치 & 속도
            span.style.left = Math.random() * 100 + '%';
            span.style.fontSize = (10 + Math.random() * 8) + 'px';
            span.style.animationDuration = (5 + Math.random() * 15) + 's';
            span.style.animationDelay = Math.random() * 10 + 's';
            span.style.opacity = (0.05 + Math.random() * 0.15).toString();

            this.container.appendChild(span);
            this.chars.push(span);
        }

        // 주기적으로 문자 변경 (살아있는 느낌)
        setInterval(() => {
            const randomChar = this.chars[Math.floor(Math.random() * this.chars.length)];
            if (randomChar) {
                randomChar.textContent = characters[Math.floor(Math.random() * characters.length)];
            }
        }, 200);

        console.log('[MatrixBg] 초기화 완료.', this.charCount, '개 문자');
    }

    /** 리소스 해제 */
    dispose(): void {
        this.chars.forEach((c) => c.remove());
        this.chars = [];
    }
}

export default MatrixBackground;
