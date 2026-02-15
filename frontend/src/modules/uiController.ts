/* ============================================
   UI Controller Module
   UI 상태 관리 (대화 내역, 상태 인디케이터, 에러 표시)
   ============================================ */
import { EMOTION_COLORS } from '../utils/constants';

export class UIController {
    private statusDot: HTMLElement;
    private statusText: HTMLElement;
    private btnMic: HTMLButtonElement;
    private btnLabel: HTMLElement;
    private audioLevelContainer: HTMLElement;
    private audioLevelBar: HTMLElement;
    private emotionDisplay: HTMLElement;
    private emotionBadge: HTMLElement;
    private emotionIntensity: HTMLElement;
    private chatMessages: HTMLElement;
    private loadingOverlay: HTMLElement;
    private errorToast: HTMLElement;
    private maxMessages = 5;

    constructor() {
        this.statusDot = document.getElementById('status-dot')!;
        this.statusText = document.getElementById('status-text')!;
        this.btnMic = document.getElementById('btn-mic') as HTMLButtonElement;
        this.btnLabel = this.btnMic.querySelector('.btn-label')!;
        this.audioLevelContainer = document.getElementById('audio-level-container')!;
        this.audioLevelBar = document.getElementById('audio-level-bar')!;
        this.emotionDisplay = document.getElementById('emotion-display')!;
        this.emotionBadge = document.getElementById('emotion-badge')!;
        this.emotionIntensity = document.getElementById('emotion-intensity')!;
        this.chatMessages = document.getElementById('chat-messages')!;
        this.loadingOverlay = document.getElementById('loading-overlay')!;
        this.errorToast = document.getElementById('error-toast')!;
    }

    /** 마이크 버튼 클릭 핸들러 등록 */
    onMicClick(callback: () => void): void {
        this.btnMic.addEventListener('click', callback);
    }

    /** 마이크 활성 상태 UI */
    setMicActive(active: boolean): void {
        if (active) {
            this.btnMic.classList.add('recording');
            this.btnLabel.textContent = '마이크 중지';
            this.statusDot.classList.add('active');
            this.statusDot.classList.remove('error');
            this.statusText.textContent = '듣는 중...';
            this.audioLevelContainer.style.display = 'flex';
            this.emotionDisplay.style.display = 'flex';
        } else {
            this.btnMic.classList.remove('recording');
            this.btnLabel.textContent = '마이크 시작';
            this.statusDot.classList.remove('active', 'processing');
            this.statusText.textContent = '대기 중';
            this.audioLevelContainer.style.display = 'none';
        }
    }

    /** 오디오 레벨 업데이트 (0.0 ~ 1.0) */
    updateAudioLevel(level: number): void {
        const bar = this.audioLevelBar;
        bar.style.setProperty('--level', `${level * 100}%`);
        (bar as any).style.background = `linear-gradient(90deg, 
      rgba(0,255,255,0.6) 0%, 
      rgba(0,255,255,0.6) ${level * 100}%, 
      rgba(255,255,255,0.1) ${level * 100}%)`;
    }

    /** 감정 상태 업데이트 */
    updateEmotion(emotion: string, intensity: number): void {
        const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;
        this.emotionBadge.textContent = emotion;
        this.emotionBadge.style.color = color;
        this.emotionBadge.style.borderColor = color;
        this.emotionBadge.style.background = color + '22';
        this.emotionIntensity.textContent = intensity.toFixed(2);
    }

    /** 분석 중 상태 표시 */
    setProcessing(processing: boolean): void {
        if (processing) {
            this.statusDot.classList.add('processing');
            this.statusText.textContent = '분석 중...';
        } else {
            this.statusDot.classList.remove('processing');
            this.statusText.textContent = '듣는 중...';
        }
    }

    /** 대화 내역에 메시지 추가 */
    addMessage(text: string, emotion: string, isAi: boolean = false): void {
        // placeholder 제거
        const placeholder = this.chatMessages.querySelector('.chat-placeholder');
        if (placeholder) placeholder.remove();

        const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;
        const now = new Date();
        const time = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const msgEl = document.createElement('div');
        msgEl.className = `chat-message ${isAi ? 'ai-message' : 'user-message'}`;
        msgEl.style.borderLeftColor = isAi ? 'transparent' : color;
        msgEl.style.borderRightColor = isAi ? color : 'transparent';

        if (isAi) {
            msgEl.style.borderLeft = 'none';
            msgEl.style.borderRight = `3px solid ${color}`;
            msgEl.style.textAlign = 'right';
            msgEl.style.alignSelf = 'flex-end';
            msgEl.style.maxWidth = '85%';      // 최대 너비 제한
            msgEl.style.width = 'fit-content'; // 콘텐츠 크기만큼만
        } else {
            msgEl.style.maxWidth = '85%';
            msgEl.style.width = 'fit-content';
        }

        msgEl.innerHTML = `
      <div class="msg-text">${this.escapeHtml(text)}</div>
      <div class="msg-meta" style="justify-content: ${isAi ? 'flex-end' : 'flex-start'}">
        <span class="msg-emotion" style="color:${color}; border: 1px solid ${color}33; background: ${color}11;">${emotion}</span>
        <span>${time}</span>
      </div>
    `;

        this.chatMessages.appendChild(msgEl);

        // 최대 메시지 수 초과 시 오래된 것 제거
        const messages = this.chatMessages.querySelectorAll('.chat-message');
        while (messages.length > this.maxMessages) {
            messages[0].remove();
        }

        // 스크롤 하단으로
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    /** 에러 토스트 표시 */
    showError(message: string, duration: number = 4000): void {
        this.errorToast.textContent = message;
        this.errorToast.className = 'toast';
        this.errorToast.style.display = 'block';

        this.statusDot.classList.add('error');

        setTimeout(() => {
            this.errorToast.style.display = 'none';
            this.statusDot.classList.remove('error');
        }, duration);
    }

    /** 로딩 오버레이 */
    setLoading(loading: boolean): void {
        this.loadingOverlay.style.display = loading ? 'flex' : 'none';
    }

    /** HTML 이스케이프 */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export default UIController;
