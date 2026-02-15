/* ============================================
   API Client Module
   백엔드 통신 (Fetch API)
   ============================================ */
import { API_CONFIG, type AnalyzeResponse } from '../utils/constants';

export class ApiClient {
    /** 오디오 분석 요청 */
    async analyze(audioBlob: Blob): Promise<AnalyzeResponse> {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        for (let attempt = 0; attempt < API_CONFIG.RETRY_COUNT; attempt++) {
            try {
                const response = await fetch(API_CONFIG.ANALYZE_ENDPOINT, {
                    method: 'POST',
                    body: formData,
                });

                const json = await response.json();

                if (!response.ok) {
                    console.warn(`[API] 서버 에러 (${response.status}):`, json);
                    return {
                        success: false,
                        error: json.error || { code: 'SERVER_ERROR', message: '서버 에러' },
                    };
                }

                return json as AnalyzeResponse;
            } catch (error) {
                console.warn(`[API] 요청 실패 (시도 ${attempt + 1}/${API_CONFIG.RETRY_COUNT}):`, error);

                if (attempt < API_CONFIG.RETRY_COUNT - 1) {
                    await this.delay(API_CONFIG.RETRY_DELAY * Math.pow(2, attempt));
                }
            }
        }

        return {
            success: false,
            error: {
                code: 'NETWORK_ERROR',
                message: '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
            },
        };
    }

    /** 서버 헬스 체크 */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(API_CONFIG.HEALTH_ENDPOINT);
            const json = await response.json();
            return json.status === 'ok';
        } catch {
            return false;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((r) => setTimeout(r, ms));
    }
}

export default ApiClient;
