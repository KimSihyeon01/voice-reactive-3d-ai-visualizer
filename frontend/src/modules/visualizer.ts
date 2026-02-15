/* ============================================
   Visualizer Module
   Three.js 파티클 시스템 + 감정 반응 (Advanced Shader)
   ============================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SCENE_CONFIG, PARTICLE_CONFIG, type AudioFrequencyData, type EmotionData } from '../utils/constants';
import { easeInOutCubic } from '../utils/lerp';
import { FaceParticles, type FaceParticleData } from './faceParticles';
import { getPreset, lerpPreset, type EmotionPreset } from './emotionPresets';

// ==========================================
// GLSL Shaders (Simplex Noise + Audio Reaction)
// ==========================================

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uAudioLow;
  uniform float uAudioMid;
  uniform float uAudioHigh;
  uniform float uSpeedScale;   // 속도 배율
  uniform float uNoiseAmp;     // 노이즈 강도
  uniform float uExpand;       // 전체 확산 (말할 때)
  uniform float uColorShift;   // 색상 변조 (생각할 때)
  
  attribute float size;
  attribute vec3 customColor;
  varying vec3 vColor;
  varying float vDist;

  // Simplex 3D Noise (축약)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) { 
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute( 
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vColor = customColor;
    vec3 pos = position;
    
    // 1. 기본 유동 (Flow)
    float flow = snoise(pos * 0.05 + vec3(0.0, uTime * 0.3 * uSpeedScale, 0.0));
    pos += vec3(flow) * (0.2 * uNoiseAmp);

    // 2. 오디오 반응 (Speaking일 때 극대화)
    float beat = uAudioLow * 2.5 * (1.0 + uExpand * 2.0); 
    
    // 말할 때 입 주변(Y축 중앙 하단)이나 전체적으로 튀어나오게
    vec3 center = vec3(0.0, -5.0, 0.0); // 대략적인 얼굴 중심
    vec3 dir = normalize(pos - center);
    
    // 말할 때(uExpand > 0) 확산 효과 강화
    pos += dir * beat * (1.0 + uExpand * 3.0);
    
    // 고음 반응 (Thinking일 때 지지직거림)
    float jitter = snoise(pos * 2.0 + uTime * 15.0) * uAudioHigh * (0.1 + uColorShift * 0.5);
    pos.y += jitter;

    // 3. Thinking 모드: 파티클이 위로 솟구치는 효과
    if (uColorShift > 0.1) {
        float thinkFlow = snoise(vec3(pos.x * 0.1, pos.y * 0.1 + uTime * 2.0, pos.z));
        pos.y += thinkFlow * uColorShift * 2.0;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // 거리에 따른 크기 조절
    gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + uAudioMid * 0.5);
    gl_Position = projectionMatrix * mvPosition;
    
    // Thinking: 보라색/파란색 틴트
    if (uColorShift > 0.0) {
        vec3 thinkColor = vec3(0.2, 0.4, 1.0); // Electric Blue
        vColor = mix(vColor, thinkColor, uColorShift * (0.5 + 0.5 * sin(uTime * 10.0)));
    }
    
    // Speaking: 밝기 증가
    vColor += vec3(uExpand * 0.3 * uAudioMid);
    vDist = mvPosition.z;
  }
`;

const FRAGMENT_SHADER = `
  varying vec3 vColor;
  
  void main() {
    // 부드러운 원형 파티클
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // 가장자리 페이드 아웃
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    
    // 중심부 글로우
    float glow = exp(-dist * 4.0) * 0.3;
    
    gl_FragColor = vec4(vColor + glow, alpha * 0.8);
  }
`;

export class Visualizer {
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private controls!: OrbitControls;
    private composer!: EffectComposer;
    private bloomPass!: UnrealBloomPass;
    private particles!: THREE.Points;
    private geometry!: THREE.BufferGeometry;
    private material!: THREE.ShaderMaterial;

    private faceData: FaceParticleData | null = null;
    private container!: HTMLElement;
    private clock = new THREE.Clock();

    // 감정 상태
    private currentPreset: EmotionPreset;
    private targetPreset: EmotionPreset;
    private transitionProgress = 1;
    private transitionStartTime = 0;
    private transitionDuration = 1000;

    // 오디오 반응 보정값
    private audioInfluence = { bass: 0, mid: 0, treble: 0, volume: 0 };

    // 상태 관리
    private interactionState: 'idle' | 'listening' | 'thinking' | 'speaking' = 'idle';
    private stateUniforms = {
        speedScale: 1.0,
        noiseAmp: 1.0,
        expand: 0.0,
        colorShift: 0.0
    };

    constructor() {
        this.currentPreset = getPreset('neutral');
        this.targetPreset = getPreset('neutral');
    }

    /** Three.js 씬 초기화 */
    async init(containerId: string = 'scene-container'): Promise<void> {
        this.container = document.getElementById(containerId)!;

        // 씬
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, SCENE_CONFIG.FOG_NEAR, SCENE_CONFIG.FOG_FAR);

        // 카메라
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            SCENE_CONFIG.CAMERA_FOV, aspect,
            SCENE_CONFIG.CAMERA_NEAR, SCENE_CONFIG.CAMERA_FAR
        );
        this.camera.position.set(0, 0, SCENE_CONFIG.CAMERA_Z);

        // 렌더러
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 1);
        this.container.appendChild(this.renderer.domElement);

        // 후처리: Bloom
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            SCENE_CONFIG.BLOOM_STRENGTH,
            SCENE_CONFIG.BLOOM_RADIUS,
            SCENE_CONFIG.BLOOM_THRESHOLD
        );
        this.composer.addPass(this.bloomPass);

        // 컨트롤
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = SCENE_CONFIG.AUTO_ROTATE_SPEED;

        // 조명
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // 파티클 로드
        await this.loadFaceParticles();

        // 리사이즈 핸들러
        window.addEventListener('resize', () => this.onResize());

        console.log('[Visualizer] 초기화 완료');
    }

    private async loadFaceParticles(): Promise<void> {
        const faceLoader = new FaceParticles();
        try {
            // GLTF 모델 로드 (상수 경로 사용)
            this.faceData = await faceLoader.loadFromModel(PARTICLE_CONFIG.MODEL_URL);
        } catch (e) {
            console.error('[Visualizer] 모델 로드 실패:', e);
            // 에러 발생 시 사용자에게 알림 필요
            return;
        }
        this.createParticleSystem();
    }

    private createParticleSystem(): void {
        if (!this.faceData) return;

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.faceData.positions, 3));
        this.geometry.setAttribute('customColor', new THREE.BufferAttribute(this.faceData.colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this.faceData.sizes, 1));

        // GLTF 모델용 머티리얼 설정
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uAudioLow: { value: 0 },
                uAudioMid: { value: 0 },
                uAudioHigh: { value: 0 },
                uSpeedScale: { value: 1.0 },
                uNoiseAmp: { value: 1.0 },
                uExpand: { value: 0.0 },
                uColorShift: { value: 0.0 }
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            transparent: true,
            depthWrite: true,
            blending: THREE.NormalBlending,
        });

        this.particles = new THREE.Points(this.geometry, this.material);

        // 모델이 너무 크거나 작으면 여기서 스케일 조정 (FaceParticles에서 이미 했지만 추가 보정)
        // this.particles.scale.set(0.1, 0.1, 0.1); 

        this.scene.add(this.particles);
    }

    update(audioData: AudioFrequencyData): void {
        if (!this.faceData || !this.material) return;

        const time = this.clock.getElapsedTime();

        // 오디오 스무딩
        const smoothing = 0.15;
        this.audioInfluence.bass += (audioData.bass - this.audioInfluence.bass) * smoothing;
        this.audioInfluence.mid += (audioData.mid - this.audioInfluence.mid) * smoothing;
        this.audioInfluence.treble += (audioData.treble - this.audioInfluence.treble) * smoothing;
        this.audioInfluence.volume += (audioData.volume - this.audioInfluence.volume) * smoothing;

        // 감정 전환
        let activePreset = this.currentPreset;
        if (this.transitionProgress < 1) {
            const elapsed = Date.now() - this.transitionStartTime;
            this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1);
            activePreset = lerpPreset(this.currentPreset, this.targetPreset, easeInOutCubic(this.transitionProgress));
            if (this.transitionProgress >= 1) this.currentPreset = this.targetPreset;
        }

        // 쉐이더 Uniform 업데이트
        this.material.uniforms.uTime.value = time * activePreset.speed;
        this.material.uniforms.uAudioLow.value = this.audioInfluence.bass * activePreset.scale;
        this.material.uniforms.uAudioMid.value = this.audioInfluence.mid;
        this.material.uniforms.uAudioHigh.value = this.audioInfluence.treble;

        // 상태별 목표값 설정
        const dt = 0.05;
        let targetSpeed = 1.0;
        let targetNoise = 1.0;
        let targetExpand = 0.0;
        let targetColorShift = 0.0;

        switch (this.interactionState) {
            case 'idle':
                targetSpeed = 0.5;
                targetNoise = 0.5;
                break;
            case 'listening':
                targetSpeed = 1.0;
                targetNoise = 1.2;
                targetColorShift = 0.1;
                break;
            case 'thinking':
                targetSpeed = 3.0;
                targetNoise = 2.0;
                targetColorShift = 1.0;
                break;
            case 'speaking':
                targetSpeed = 1.5;
                targetNoise = 1.5;
                targetExpand = 1.0;
                break;
        }

        this.stateUniforms.speedScale += (targetSpeed - this.stateUniforms.speedScale) * dt;
        this.stateUniforms.noiseAmp += (targetNoise - this.stateUniforms.noiseAmp) * dt;
        this.stateUniforms.expand += (targetExpand - this.stateUniforms.expand) * dt;
        this.stateUniforms.colorShift += (targetColorShift - this.stateUniforms.colorShift) * dt;

        this.material.uniforms.uSpeedScale.value = this.stateUniforms.speedScale;
        this.material.uniforms.uNoiseAmp.value = this.stateUniforms.noiseAmp;
        this.material.uniforms.uExpand.value = this.stateUniforms.expand;
        this.material.uniforms.uColorShift.value = this.stateUniforms.colorShift;

        // Bloom 강도 (상태에 따라 변화)
        let bloomBoost = 1.0;
        if (this.interactionState === 'thinking') bloomBoost = 2.0;
        if (this.interactionState === 'speaking') bloomBoost = 1.5;

        this.bloomPass.strength = Math.min(
            SCENE_CONFIG.BLOOM_STRENGTH * activePreset.bloomIntensity * (1 + this.audioInfluence.volume * 0.2) * bloomBoost,
            1.5
        );

        this.controls.update();
    }

    /** 상태 설정 (외부 호출용) */
    setInteractionState(state: 'idle' | 'listening' | 'thinking' | 'speaking'): void {
        this.interactionState = state;
        console.log(`[Visualizer] State changed to: ${state}`);
    }

    setEmotion(data: EmotionData): void {
        const targetPreset = getPreset(data.emotion);
        if (targetPreset === this.targetPreset && this.transitionProgress >= 1) return;

        this.targetPreset = targetPreset;
        this.transitionProgress = 0;
        this.transitionStartTime = Date.now();
        console.log(`[Visualizer] 감정 전환: ${data.emotion}`);
    }

    render(): void {
        this.composer.render();
    }

    private onResize(): void {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);
    }

    dispose(): void {
        this.geometry?.dispose();
        this.material?.dispose();
        this.renderer?.dispose();
        window.removeEventListener('resize', () => this.onResize());
    }
}

export default Visualizer;
