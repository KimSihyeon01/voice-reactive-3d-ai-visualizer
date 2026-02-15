"""
Analyze Route - /api/analyze
오디오 파일 → STT → 감정 분석 파이프라인
"""
import os
import time
import logging
import tempfile
from flask import Blueprint, request, jsonify
from config import Config

logger = logging.getLogger(__name__)
analyze_bp = Blueprint('analyze', __name__)


@analyze_bp.route('/api/analyze', methods=['POST'])
def analyze():
    """음성 분석 엔드포인트"""
    start_time = time.time()

    # 1. 오디오 파일 검증
    if 'audio' not in request.files:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_AUDIO', 'message': '오디오 파일이 없습니다.'},
        }), 400

    audio_file = request.files['audio']

    if audio_file.content_length and audio_file.content_length > Config.MAX_AUDIO_SIZE:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_AUDIO', 'message': '오디오 파일이 너무 큽니다. (최대 10MB)'},
        }), 400

    temp_webm = None
    temp_wav = None

    try:
        # 2. 임시 파일로 저장
        temp_webm = tempfile.NamedTemporaryFile(
            suffix='.webm', dir=Config.UPLOAD_FOLDER, delete=False
        )
        audio_file.save(temp_webm.name)
        temp_webm.close()

        logger.info(f'오디오 수신: {os.path.getsize(temp_webm.name)} bytes')

        # 3. webm → wav 변환
        from services.audio_converter import AudioConverter
        temp_wav_path = temp_webm.name.replace('.webm', '.wav')
        AudioConverter.convert_webm_to_wav(temp_webm.name, temp_wav_path)
        temp_wav = temp_wav_path

        # 4. Whisper STT
        from services.whisper_service import WhisperService
        stt_result = WhisperService.transcribe(temp_wav)
        text = stt_result.get('text', '').strip()

        if not text:
            return jsonify({
                'success': True,
                'data': {
                    'text': '',
                    'responseText': '',
                    'audioUrl': '',
                    'emotion': 'neutral',
                    'intensity': 0.0,
                    'state': 'listening',
                    'keywords': [],
                    'confidence': 0.0,
                    'language': 'ko',
                },
                'processing_time': round(time.time() - start_time, 2),
            })

        logger.info(f'STT 결과: "{text}"')

        # 5. Ollama 감정 분석 & 대화 생성
        from services.ollama_service import OllamaService
        emotion_result = OllamaService.analyze_emotion(text)
        
        # AI 답변 생성 (Chat)
        ai_response_text = OllamaService.generate_response(
            text, 
            emotion=emotion_result.get('emotion', 'neutral')
        )

        # 6. TTS 음성 합성
        from services.tts_service import TtsService
        # 텍스트가 있을 때만 TTS 생성
        audio_filename = ""
        if ai_response_text:
            audio_filename = TtsService.generate_audio(ai_response_text)

        processing_time = round(time.time() - start_time, 2)
        logger.info(f'분석 완료: {emotion_result["emotion"]} / 응답: "{ai_response_text}" / 오디오: {audio_filename}')

        # 오디오 URL 생성 (static serve 필요 없음, temp_audio가 static 폴더가 아니라면 send_file 엔드포인트 필요)
        # 현재 구조상 프론트엔드에서 접근할 수 있는 URL이어야 함. 
        # 임시로 /api/audio/<filename> 엔드포인트를 만들거나, static으로 서빙해야 함.
        # 일단은 상대 경로만 넘겨주고, 추가 라우트 구현 필요.
        
        return jsonify({
            'success': True,
            'data': {
                'text': text,
                'responseText': ai_response_text,
                'audioUrl': f"/api/audio/{audio_filename}" if audio_filename else "",
                'emotion': emotion_result.get('emotion', 'neutral'),
                'intensity': emotion_result.get('intensity', 0.5),
                'state': emotion_result.get('state', 'speaking'),
                'keywords': emotion_result.get('keywords', []),
                'confidence': stt_result.get('confidence', 0.0),
                'language': stt_result.get('language', 'ko'),
            },
            'processing_time': processing_time,
        })

    except Exception as e:
        logger.error(f'분석 파이프라인 에러: {e}', exc_info=True)
        error_code = 'WHISPER_FAILED' if 'whisper' in str(e).lower() else 'PARSE_ERROR'
        return jsonify({
            'success': False,
            'error': {
                'code': error_code,
                'message': '음성 인식에 실패했습니다. 다시 시도해주세요.',
                'details': str(e),
            },
        }), 500

    finally:
        # 6. 임시 파일 정리
        for path in [temp_webm and temp_webm.name, temp_wav]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except OSError:
                    pass
