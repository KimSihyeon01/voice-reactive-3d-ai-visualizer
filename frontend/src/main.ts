/* ============================================
   Main Entry Point
   Voice-Reactive 3D AI Visualizer
   ============================================ */
import './style.css';
import { AudioHandler } from './modules/audioHandler';
import { Visualizer } from './modules/visualizer';
import { ApiClient } from './modules/apiClient';
import { MatrixBackground } from './modules/matrixBg';
import { UIController } from './modules/uiController';
import { AUDIO_CONFIG } from './utils/constants';

class App {
  private audioHandler = new AudioHandler();
  private visualizer = new Visualizer();
  private apiClient = new ApiClient();
  private matrixBg = new MatrixBackground();
  private ui = new UIController();
  private analyzeInterval: number | null = null;
  private isActive = false;

  async start(): Promise<void> {
    console.log('🎯 Voice-Reactive 3D AI Visualizer 시작');

    // 매트릭스 배경
    this.matrixBg.init();

    // Three.js 초기화
    this.ui.setLoading(true);
    try {
      await this.visualizer.init();
    } catch (e) {
      console.error('[App] Visualizer 초기화 실패:', e);
    }
    this.ui.setLoading(false);

    // 마이크 버튼 핸들러
    this.ui.onMicClick(() => this.toggleMic());

    // 애니메이션 루프 시작
    this.animate();

    // 백엔드 헬스 체크
    const healthy = await this.apiClient.checkHealth();
    if (!healthy) {
      console.warn('[App] 백엔드 서버에 연결할 수 없습니다.');
    }
  }

  /** 마이크 토글 */
  private async toggleMic(): Promise<void> {
    if (this.isActive) {
      this.stopListening();
    } else {
      await this.startListening();
    }
  }

  /** 마이크 시작 */
  private async startListening(): Promise<void> {
    try {
      await this.audioHandler.init();
      this.isActive = true;
      this.ui.setMicActive(true);

      // 5초마다 분석 요청
      this.startAnalyzeLoop();
    } catch (error: any) {
      if (error.message === 'MICROPHONE_DENIED') {
        this.ui.showError('🎤 마이크 접근 권한이 필요합니다. 브라우저 설정에서 허용해주세요.');
      } else {
        this.ui.showError('🎤 마이크를 시작할 수 없습니다. 다시 시도해주세요.');
      }
      console.error('[App] 마이크 시작 실패:', error);
    }
  }

  /** 마이크 중지 */
  private stopListening(): void {
    this.isActive = false;
    this.audioHandler.dispose();
    this.ui.setMicActive(false);

    if (this.analyzeInterval) {
      clearInterval(this.analyzeInterval);
      this.analyzeInterval = null;
    }
  }

  /** 5초마다 분석 요청 루프 */
  private async startAnalyzeLoop(): Promise<void> {
    const runAnalysis = async () => {
      if (!this.isActive) return;

      try {
        // 1. 듣기 모드 (Listening)
        this.visualizer.setInteractionState('listening');
        this.ui.setProcessing(true); // UI 상에서는 마이크 활성 표시

        // 5초 녹음
        const blob = await this.audioHandler.recordForDuration(AUDIO_CONFIG.BUFFER_INTERVAL);

        if (blob.size < 1000) {
          // 묵음: 다시 듣기로
          this.visualizer.setInteractionState('idle'); // 잠시 대기
          return;
        }

        // 2. 생각 모드 (Thinking)
        this.visualizer.setInteractionState('thinking');
        console.log('[App] 분석 요청 전송...');

        // 백엔드 분석 요청
        const result = await this.apiClient.analyze(blob);
        console.log('[App] 분석 결과 수신:', result);

        if (result.success && result.data) {
          this.visualizer.setEmotion(result.data);

          if (result.data.text && result.data.text.trim()) {
            console.log('[App] 대화 내역 추가:', result.data.text);
            this.ui.updateEmotion(result.data.emotion, result.data.intensity);
            this.ui.addMessage(result.data.text, result.data.emotion);

            if (result.data.responseText) {
              this.ui.addMessage(result.data.responseText, result.data.emotion, true);
            }

            // 3. 말하기 모드 (Speaking)
            if (result.data.audioUrl) {
              this.visualizer.setInteractionState('speaking');
              console.log('[App] 오디오 재생 시작:', result.data.audioUrl);

              // TTS 재생이 끝날 때까지 대기 (Promise)
              await new Promise<void>((resolve) => {
                const audio = new Audio(result.data.audioUrl);
                audio.volume = 1.0;
                audio.onended = () => {
                  console.log('[App] 오디오 재생 완료');
                  resolve();
                };
                audio.onerror = (e) => {
                  console.error('[App] 오디오 재생 에러:', e);
                  resolve(); // 에러 나도 진행
                };
                audio.play().catch(e => {
                  console.error('[App] 오디오 재생 실패:', e);
                  resolve();
                });
              });
            }
          }
        } else if (result.error) {
          console.warn('[App] 분석 에러:', result.error.code, result.error.message);
          this.ui.showError(`분석 오류: ${result.error.message}`);
        }
      } catch (error) {
        console.error('[App] 분석 루프 에러:', error);
      } finally {
        this.ui.setProcessing(false);
        // 루프가 끝나면 잠시 Idle (다음 턴 준비)
        this.visualizer.setInteractionState('idle');
      }
    };

    // 재귀 호출 방식으로 변경 (setInterval 대신)
    // 이유: await로 TTS 재생을 기다려야 하므로, 고정 간격(Interval)은 부적절함.
    // 하나 끝나면 다음 것 실행.
    const loop = async () => {
      if (!this.isActive) return;
      await runAnalysis();
      if (this.isActive) {
        setTimeout(loop, 500); // 0.5초 휴식 후 다음 턴
      }
    }
    loop();
  }

  /** 애니메이션 루프 (60fps) */
  private animate = (): void => {
    requestAnimationFrame(this.animate);

    // 오디오 데이터 가져오기
    const audioData = this.audioHandler.getFrequencyData();

    // 오디오 레벨 UI 업데이트
    if (this.isActive) {
      this.ui.updateAudioLevel(audioData.volume);
    }

    // Three.js 업데이트 & 렌더링
    this.visualizer.update(audioData);
    this.visualizer.render();
  };
}

// 앱 시작
const app = new App();
(window as any).app = app;
app.start();
