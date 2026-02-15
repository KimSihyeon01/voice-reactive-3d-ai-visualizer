"""
TTS Service
텍스트 → 음성 변환 (edge-tts)
"""
import os
import asyncio
import logging
import uuid
from config import Config
import edge_tts

logger = logging.getLogger(__name__)

class TtsService:
    @staticmethod
    async def _generate_audio_async(text: str, output_path: str, voice: str = 'ko-KR-SunHiNeural'):
        """비동기 TTS 생성"""
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)

    @staticmethod
    def generate_audio(text: str) -> str:
        """
        텍스트를 음성 파일로 변환합니다.
        
        Args:
            text: 변환할 텍스트
            
        Returns:
            생성된 오디오 파일의 상대 경로 (예: /temp_audio/tts_xyz.mp3)
        """
        if not text or not text.strip():
            return ""

        try:
            filename = f"tts_{uuid.uuid4().hex[:8]}.mp3"
            output_path = os.path.join(Config.UPLOAD_FOLDER, filename)
            
            # 비동기 함수 실행 (Event Loop 처리)
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # 이미 루프가 돌고 있다면 (예: 이미 비동기 환경)
                    # 이 경우 별도 태스크로 돌려야 하지만, Flask는 보통 동기.
                    # 안전을 위해 new_event_loop 사용 고려
                    asyncio.run(TtsService._generate_audio_async(text, output_path))
                else:
                    loop.run_until_complete(TtsService._generate_audio_async(text, output_path))
            except RuntimeError:
                # "There is no current event loop" or similar
                asyncio.run(TtsService._generate_audio_async(text, output_path))

            logger.info(f"TTS 생성 완료: {filename}")
            
            # URL 경로 반환 (API에서 접근 가능하도록)
            # 실제로는 static 폴더나 send_file로 처리해야 함.
            # analyze.py에서 UPLOAD_FOLDER가 static으로 서빙되는지 확인 필요.
            # 일단 파일명만 반환.
            return filename

        except Exception as e:
            logger.error(f"TTS 생성 실패: {e}")
            return ""
