/* ============================================
   Face Particles Module (GLTF 3D Model Version)
   GLTF 모델 → 파티클 좌표 변환
   ============================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PARTICLE_CONFIG } from '../utils/constants';

export interface FaceParticleData {
    positions: Float32Array;
    originalPositions: Float32Array;
    colors: Float32Array;
    sizes: Float32Array;
    count: number;
}

export class FaceParticles {
    private loader: GLTFLoader;

    constructor() {
        this.loader = new GLTFLoader();
    }

    /** GLTF 모델을 로드하고 파티클 데이터 생성 */
    async loadFromModel(modelUrl: string): Promise<FaceParticleData> {
        return new Promise((resolve, reject) => {
            this.loader.load(
                modelUrl,
                (gltf) => {
                    const particles = this.processModel(gltf.scene);
                    resolve(particles);
                },
                undefined,
                (error) => {
                    console.error('GLTF 로드 실패:', error);
                    reject(error);
                }
            );
        });
    }

    /** 2D 이미지 로드 (하위 호환성 유지용, 실제로는 안 씀) */
    async loadFromImage(imageUrl: string): Promise<FaceParticleData> {
        console.warn('loadFromImage is deprecated. Use loadFromModel.');
        // 빈 데이터 반환하여 에러 방지
        return {
            positions: new Float32Array(0),
            originalPositions: new Float32Array(0),
            colors: new Float32Array(0),
            sizes: new Float32Array(0),
            count: 0
        };
    }

    /** 모델에서 Mesh를 찾아 파티클 데이터 추출 */
    private processModel(scene: THREE.Group): FaceParticleData {
        let positions: number[] = [];
        let colors: number[] = [];

        console.log('[FaceParticles] 모델 구조 탐색 시작');

        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                const geometry = mesh.geometry;
                const posAttr = geometry.attributes.position;
                const uvAttr = geometry.attributes.uv;

                console.log(`[FaceParticles] Mesh 발견: ${mesh.name}, Vertex 수: ${posAttr.count}`);

                // 텍스처 색상 추출 준비
                let image: HTMLImageElement | undefined;
                let pixelData: Uint8ClampedArray | null = null;
                let width = 0, height = 0;

                if (mesh.material) {
                    const material = mesh.material as THREE.MeshStandardMaterial;
                    if (material.map && material.map.image) {
                        image = material.map.image;
                        console.log(`[FaceParticles] 텍스처 발견: ${image.src}`);

                        // 텍스처 캔버스 드로잉
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = image.width;
                            canvas.height = image.height;
                            const ctx = canvas.getContext('2d')!;
                            ctx.drawImage(image, 0, 0);
                            pixelData = ctx.getImageData(0, 0, image.width, image.height).data;
                            width = image.width;
                            height = image.height;
                        } catch (e) {
                            console.warn('[FaceParticles] 텍스처 데이터 접근 실패 (CORS?):', e);
                        }
                    }
                }

                // Vertex 순회
                const count = posAttr.count;
                mesh.updateMatrixWorld(); // 월드 좌표 변환 적용

                // 랜덤 샘플링 (너무 많으면 성능 저하되므로)
                // 만약 Vertex가 5만개 넘으면 줄이기
                const step = count > 50000 ? 2 : 1;

                for (let i = 0; i < count; i += step) {
                    const v = new THREE.Vector3();
                    v.fromBufferAttribute(posAttr, i);
                    v.applyMatrix4(mesh.matrixWorld); // 월드 좌표로 변환

                    // 스케일 및 위치 조정 (모델에 따라 다름, 일단 FacePractice.gltf 기준)
                    // 모델이 너무 작거나 클 수 있으므로 적절히 스케일링
                    // 일반적으로 얼굴 높이가 40~50 정도 되도록 맞춤
                    const scale = 50.0;
                    const x = v.x * scale;
                    const y = v.y * scale - 5; // 높이 보정
                    const z = v.z * scale;

                    positions.push(x, y, z);

                    // 색상 추출 (UV 매핑)
                    if (pixelData && uvAttr) {
                        const u = uvAttr.getX(i);
                        const v_coord = uvAttr.getY(i);

                        // UV -> Pixel Index
                        const tx = Math.floor(u * width);
                        const ty = Math.floor((1 - v_coord) * height); // UV v는 아래에서 위로 증가하므로 뒤집기

                        const pixelIndex = (ty * width + tx) * 4;
                        if (pixelIndex >= 0 && pixelIndex < pixelData.length) {
                            const r = pixelData[pixelIndex] / 255;
                            const g = pixelData[pixelIndex + 1] / 255;
                            const b = pixelData[pixelIndex + 2] / 255;
                            colors.push(r, g, b);
                        } else {
                            colors.push(0.5, 0.8, 0.9); // 기본 청록색
                        }
                    } else {
                        // 텍스처 없으면 살구색 또는 청록색
                        colors.push(0.5, 0.8, 1.0);
                    }
                }
            }
        });

        const particleCount = positions.length / 3;
        console.log(`[FaceParticles] GLTF 모델 로드 완료. 파티클 ${particleCount}개 생성.`);

        return {
            positions: new Float32Array(positions),
            originalPositions: new Float32Array(positions),
            colors: new Float32Array(colors),
            sizes: new Float32Array(particleCount).fill(PARTICLE_CONFIG.BASE_SIZE),
            count: particleCount
        };
    }
}

export default FaceParticles;
