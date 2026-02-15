"""
Whisper STT Service
음성 → 텍스트 변환 (로컬 Whisper 모델)
"""
import logging
from config import Config

logger = logging.getLogger(__name__)

# 싱글턴 모델 인스턴스
_model = None
_model_loaded = False


class WhisperService:
    @staticmethod
    def _load_model():
        """모델 로드 (최초 1회)"""
        global _model, _model_loaded
        if _model_loaded:
            return

        logger.info(f'Whisper 모델 로딩 중... (모델: {Config.WHISPER_MODEL})')
        import whisper
        _model = whisper.load_model(Config.WHISPER_MODEL)
        _model_loaded = True
        logger.info('Whisper 모델 로딩 완료')

    @staticmethod
    def transcribe(audio_path: str) -> dict:
        """
        음성 파일 → 텍스트 변환

        Args:
            audio_path: .wav 파일 경로

        Returns:
            {"text": "인식된 텍스트", "language": "ko", "confidence": 0.95}
        """
        WhisperService._load_model()

        try:
            result = _model.transcribe(
                audio_path,
                language='ko',
                fp16=False,  # CPU 호환성
            )

            text = result.get('text', '').strip()

            # 평균 confidence 계산
            segments = result.get('segments', [])
            avg_confidence = 0.0
            if segments:
                confidences = [s.get('no_speech_prob', 0) for s in segments]
                avg_confidence = 1.0 - (sum(confidences) / len(confidences))

            return {
                'text': text,
                'language': result.get('language', 'ko'),
                'confidence': round(avg_confidence, 2),
            }

        except Exception as e:
            logger.error(f'Whisper STT 에러: {e}')
            raise RuntimeError(f'Whisper 음성 인식 실패: {e}')

    @staticmethod
    def is_loaded() -> bool:
        """모델 로드 상태 확인"""
        return _model_loaded
