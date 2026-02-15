/* ============================================
   Emotion Presets Module
   감정별 비주얼 파라미터 프리셋
   ============================================ */
import * as THREE from 'three';
import { EMOTION_COLORS, EMOTION_SPEEDS, EMOTION_SCALES } from '../utils/constants';

export interface EmotionPreset {
    color: THREE.Color;
    speed: number;
    scale: number;
    morphForehead: { offsetY: number; rotation: number; scatter: number };
    morphEyes: { offsetY: number; scale: number };
    morphMouth: { offsetY: number; curve: number };
    morphEyebrows: { offsetY: number; angle: number };
    specialEffect: 'sparkle' | 'lightning' | 'trail' | 'orbit' | 'breath' | 'rain' | 'explode' | null;
    noiseAmplitude: number;
    pulseSpeed: number;      // 펄스 속도
    bloomIntensity: number;  // 블룸 강도 보정
}

export const PRESETS: Record<string, EmotionPreset> = {
    neutral: {
        color: new THREE.Color(EMOTION_COLORS.neutral),
        speed: EMOTION_SPEEDS.neutral,
        scale: EMOTION_SCALES.neutral,
        morphForehead: { offsetY: 0, rotation: 0, scatter: 0 },
        morphEyes: { offsetY: 0, scale: 1 },
        morphMouth: { offsetY: 0, curve: 0 },
        morphEyebrows: { offsetY: 0, angle: 0 },
        specialEffect: 'breath',
        noiseAmplitude: 0.02,
        pulseSpeed: 1.0,
        bloomIntensity: 1.0,
    },

    happy: {
        color: new THREE.Color(EMOTION_COLORS.happy),
        speed: EMOTION_SPEEDS.happy,
        scale: EMOTION_SCALES.happy,
        morphForehead: { offsetY: 0, rotation: 0, scatter: 0 },
        morphEyes: { offsetY: 0.02, scale: 1.1 },
        morphMouth: { offsetY: 0.05, curve: 0.3 },       // 입 꼬리 올라감
        morphEyebrows: { offsetY: 0.03, angle: 0.1 },
        specialEffect: 'sparkle',
        noiseAmplitude: 0.03,
        pulseSpeed: 1.5,
        bloomIntensity: 1.5,
    },

    excited: {
        color: new THREE.Color(EMOTION_COLORS.excited),
        speed: EMOTION_SPEEDS.excited,
        scale: EMOTION_SCALES.excited,
        morphForehead: { offsetY: 0, rotation: 0, scatter: 0.1 },
        morphEyes: { offsetY: 0.03, scale: 1.2 },
        morphMouth: { offsetY: 0.08, curve: 0.5 },
        morphEyebrows: { offsetY: 0.05, angle: 0.2 },
        specialEffect: 'explode',
        noiseAmplitude: 0.08,
        pulseSpeed: 2.5,
        bloomIntensity: 2.0,
    },

    sad: {
        color: new THREE.Color(EMOTION_COLORS.sad),
        speed: EMOTION_SPEEDS.sad,
        scale: EMOTION_SCALES.sad,
        morphForehead: { offsetY: 0, rotation: 0, scatter: 0 },
        morphEyes: { offsetY: -0.02, scale: 0.9 },
        morphMouth: { offsetY: -0.05, curve: -0.3 },     // 입 꼬리 내려감
        morphEyebrows: { offsetY: -0.02, angle: -0.15 },
        specialEffect: 'rain',
        noiseAmplitude: 0.01,
        pulseSpeed: 0.5,
        bloomIntensity: 0.6,
    },

    angry: {
        color: new THREE.Color(EMOTION_COLORS.angry),
        speed: EMOTION_SPEEDS.angry,
        scale: EMOTION_SCALES.angry,
        morphForehead: { offsetY: -0.02, rotation: 0, scatter: 0.05 },
        morphEyes: { offsetY: -0.01, scale: 1.15 },
        morphMouth: { offsetY: -0.02, curve: -0.1 },
        morphEyebrows: { offsetY: -0.04, angle: -0.3 },  // 눈썹 뾰족하게
        specialEffect: 'lightning',
        noiseAmplitude: 0.06,
        pulseSpeed: 3.0,
        bloomIntensity: 1.8,
    },

    thinking: {
        color: new THREE.Color(EMOTION_COLORS.thinking),
        speed: EMOTION_SPEEDS.thinking,
        scale: EMOTION_SCALES.thinking,
        morphForehead: { offsetY: 0.03, rotation: 0.5, scatter: 0.15 }, // 이마 파편화 + 회전
        morphEyes: { offsetY: 0, scale: 0.95 },
        morphMouth: { offsetY: 0, curve: 0 },
        morphEyebrows: { offsetY: 0.02, angle: 0.05 },
        specialEffect: 'orbit',
        noiseAmplitude: 0.04,
        pulseSpeed: 1.2,
        bloomIntensity: 1.3,
    },

    calm: {
        color: new THREE.Color(EMOTION_COLORS.calm),
        speed: EMOTION_SPEEDS.calm,
        scale: EMOTION_SCALES.calm,
        morphForehead: { offsetY: 0, rotation: 0, scatter: 0 },
        morphEyes: { offsetY: -0.01, scale: 0.95 },      // 약간 감은 눈
        morphMouth: { offsetY: 0.01, curve: 0.1 },        // 살짝 미소
        morphEyebrows: { offsetY: 0, angle: 0 },
        specialEffect: 'breath',
        noiseAmplitude: 0.015,
        pulseSpeed: 0.4,
        bloomIntensity: 0.8,
    },
};

/** 감정 프리셋 가져오기 (없으면 neutral 반환) */
export function getPreset(emotion: string): EmotionPreset {
    return PRESETS[emotion] || PRESETS.neutral;
}

/** 두 프리셋 간 보간된 프리셋 생성 */
export function lerpPreset(a: EmotionPreset, b: EmotionPreset, t: number): EmotionPreset {
    const lerp = (x: number, y: number) => x + (y - x) * t;

    return {
        color: a.color.clone().lerp(b.color, t),
        speed: lerp(a.speed, b.speed),
        scale: lerp(a.scale, b.scale),
        morphForehead: {
            offsetY: lerp(a.morphForehead.offsetY, b.morphForehead.offsetY),
            rotation: lerp(a.morphForehead.rotation, b.morphForehead.rotation),
            scatter: lerp(a.morphForehead.scatter, b.morphForehead.scatter),
        },
        morphEyes: {
            offsetY: lerp(a.morphEyes.offsetY, b.morphEyes.offsetY),
            scale: lerp(a.morphEyes.scale, b.morphEyes.scale),
        },
        morphMouth: {
            offsetY: lerp(a.morphMouth.offsetY, b.morphMouth.offsetY),
            curve: lerp(a.morphMouth.curve, b.morphMouth.curve),
        },
        morphEyebrows: {
            offsetY: lerp(a.morphEyebrows.offsetY, b.morphEyebrows.offsetY),
            angle: lerp(a.morphEyebrows.angle, b.morphEyebrows.angle),
        },
        specialEffect: t < 0.5 ? a.specialEffect : b.specialEffect,
        noiseAmplitude: lerp(a.noiseAmplitude, b.noiseAmplitude),
        pulseSpeed: lerp(a.pulseSpeed, b.pulseSpeed),
        bloomIntensity: lerp(a.bloomIntensity, b.bloomIntensity),
    };
}

export default PRESETS;
