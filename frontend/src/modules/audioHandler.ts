/* ============================================
   Audio Handler Module
   마이크 입력 & Web Audio API 주파수 분석
   ============================================ */
import { AUDIO_CONFIG, type AudioFrequencyData } from '../utils/constants';

export class AudioHandler {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private mediaStream: MediaStream | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(0);
    private _isRecording = false;
    private _isInitialized = false;

    get isRecording(): boolean {
        return this._isRecording;
    }

    get isInitialized(): boolean {
        return this._isInitialized;
    }

    /** 마이크 권한 요청 및 AudioContext 초기화 */
    async init(): Promise<void> {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
                },
            });

            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = AUDIO_CONFIG.FFT_SIZE;
            this.analyser.smoothingTimeConstant = 0.8;

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);

            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this._isInitialized = true;

            console.log('[AudioHandler] 초기화 완료. FFT size:', AUDIO_CONFIG.FFT_SIZE);
        } catch (error: any) {
            if (error.name === 'NotAllowedError') {
                throw new Error('MICROPHONE_DENIED');
            }
            throw new Error('MICROPHONE_ERROR');
        }
    }

    /** 실시간 주파수 데이터 반환 (매 프레임 호출) */
    getFrequencyData(): AudioFrequencyData {
        if (!this.analyser) {
            return { bass: 0, mid: 0, treble: 0, volume: 0, raw: new Uint8Array(0) };
        }

        this.analyser.getByteFrequencyData(this.frequencyData);

        const bass = this.getAverageFrequency(
            AUDIO_CONFIG.BASS_RANGE[0],
            AUDIO_CONFIG.BASS_RANGE[1]
        );
        const mid = this.getAverageFrequency(
            AUDIO_CONFIG.MID_RANGE[0],
            AUDIO_CONFIG.MID_RANGE[1]
        );
        const treble = this.getAverageFrequency(
            AUDIO_CONFIG.TREBLE_RANGE[0],
            AUDIO_CONFIG.TREBLE_RANGE[1]
        );

        let volume = 0;
        for (let i = 0; i < this.frequencyData.length; i++) {
            volume += this.frequencyData[i];
        }
        volume = (volume / this.frequencyData.length) / 255;

        return { bass, mid, treble, volume, raw: this.frequencyData };
    }

    /** 특정 주파수 대역의 평균값 (0.0 ~ 1.0) */
    private getAverageFrequency(startBin: number, endBin: number): number {
        let sum = 0;
        const count = endBin - startBin;
        for (let i = startBin; i < endBin && i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i];
        }
        return count > 0 ? (sum / count) / 255 : 0;
    }

    /** 녹음 시작 */
    startRecording(): void {
        if (!this.mediaStream || this._isRecording) return;

        this.recordedChunks = [];

        this.mediaRecorder = new MediaRecorder(this.mediaStream, {
            mimeType: this.getSupportedMimeType(),
        });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.start();
        this._isRecording = true;
        console.log('[AudioHandler] 녹음 시작');
    }

    /** 녹음 중지 및 Blob 반환 */
    stopRecording(): Promise<Blob> {
        return new Promise((resolve) => {
            if (!this.mediaRecorder || !this._isRecording) {
                resolve(new Blob());
                return;
            }

            this.mediaRecorder.onstop = () => {
                const mimeType = this.getSupportedMimeType();
                const blob = new Blob(this.recordedChunks, { type: mimeType });
                this.recordedChunks = [];
                this._isRecording = false;
                console.log('[AudioHandler] 녹음 완료. 크기:', (blob.size / 1024).toFixed(1), 'KB');
                resolve(blob);
            };

            this.mediaRecorder.stop();
        });
    }

    /** 5초 녹음 후 Blob 반환 (자동) */
    async recordForDuration(durationMs: number = AUDIO_CONFIG.BUFFER_INTERVAL): Promise<Blob> {
        this.startRecording();
        await new Promise((r) => setTimeout(r, durationMs));
        return this.stopRecording();
    }

    /** 지원되는 MIME 타입 확인 */
    private getSupportedMimeType(): string {
        const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) return type;
        }
        return 'audio/webm';
    }

    /** 리소스 해제 */
    dispose(): void {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((t) => t.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this._isInitialized = false;
        this._isRecording = false;
    }
}

export default AudioHandler;
