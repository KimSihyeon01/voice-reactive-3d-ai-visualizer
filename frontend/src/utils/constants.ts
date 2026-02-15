/* ============================================
   Constants & Type Definitions
   ============================================ */

// 감정 색상 팔레트
export const EMOTION_COLORS: Record<string, string> = {
    neutral: '#00ffff',
    happy: '#ffff00',
    excited: '#ff6600',
    sad: '#0066ff',
    angry: '#ff0033',
    thinking: '#aa00ff',
    calm: '#00ff88',
};

// 감정별 파티클 속도 멀티플라이어
export const EMOTION_SPEEDS: Record<string, number> = {
    neutral: 1.0,
    happy: 1.5,
    excited: 2.0,
    sad: 0.5,
    angry: 1.8,
    thinking: 1.2,
    calm: 0.3,
};

// 감정별 파티클 스케일
export const EMOTION_SCALES: Record<string, number> = {
    neutral: 1.0,
    happy: 1.2,
    excited: 1.6,
    sad: 0.7,
    angry: 1.3,
    thinking: 0.9,
    calm: 0.8,
};

// 오디오 설정
export const AUDIO_CONFIG = {
    FFT_SIZE: 2048,
    BUFFER_INTERVAL: 5000,       // 5초마다 분석 요청
    SAMPLE_RATE: 44100,
    BASS_RANGE: [0, 10],         // FFT bin 인덱스
    MID_RANGE: [10, 100],
    TREBLE_RANGE: [100, 512],
};

// Three.js 설정
export const SCENE_CONFIG = {
    CAMERA_FOV: 75,
    CAMERA_NEAR: 0.1,
    CAMERA_FAR: 1000,
    CAMERA_Z: 50,
    BLOOM_STRENGTH: 0.4,
    BLOOM_RADIUS: 0.3,
    BLOOM_THRESHOLD: 0.7,
    FOG_NEAR: 80,
    FOG_FAR: 250,
    AUTO_ROTATE_SPEED: 0.3,
};

// 파티클 설정
export const PARTICLE_CONFIG = {
    MODEL_URL: '/assets/models/face/FacePractice.gltf', // GLTF 모델 경로
    IMAGE_STEP: 3,               // 픽셀 스텝 (조절하여 파티클 수 제어)
    BRIGHTNESS_THRESHOLD: 80,    // 밝기 임계값 (face_clean.png 전처리 완료)
    POSITION_SCALE: 0.08,        // 위치 스케일
    DEPTH_SCALE: 0.03,           // Z축 깊이 스케일 (형상 납작하게)
    BASE_SIZE: 1.2,              // 기본 파티클 크기 (디테일 보존)
    NOISE_AMPLITUDE: 0.015,      // 노이즈 진폭 (은은하게)
    // 이미지 크롭 영역
    CROP_LEFT: 0.0,
    CROP_RIGHT: 1.0,
    CROP_TOP: 0.0,
    CROP_BOTTOM: 1.0,
};

// API 설정
export const API_CONFIG = {
    BASE_URL: '/api',
    ANALYZE_ENDPOINT: '/api/analyze',
    HEALTH_ENDPOINT: '/api/health',
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000,           // ms
};

// 전환 애니메이션 설정
export const TRANSITION_CONFIG = {
    EMOTION_DURATION: 1000,      // ms
    COLOR_LERP_SPEED: 0.05,
};

// 감정 데이터 타입
export interface EmotionData {
    text: string;
    emotion: string;
    intensity: number;
    state: string;
    keywords: string[];
    confidence?: number;
    language?: string;
    responseText?: string;
    audioUrl?: string;
}

// 주파수 데이터 타입
export interface AudioFrequencyData {
    bass: number;      // 0.0 ~ 1.0
    mid: number;       // 0.0 ~ 1.0
    treble: number;    // 0.0 ~ 1.0
    volume: number;    // 0.0 ~ 1.0
    raw: Uint8Array;
}

// API 응답 타입
export interface AnalyzeResponse {
    success: boolean;
    data?: EmotionData;
    error?: {
        code: string;
        message: string;
    };
    processing_time?: number;
}
