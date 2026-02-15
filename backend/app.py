"""
Voice-Reactive 3D AI Visualizer - Flask Backend
메인 앱 & 라우팅
"""
import os
import sys
import time
import logging
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import logging

try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except ImportError:
    logging.warning("static-ffmpeg not found.")

from config import Config

# 로깅 설정: stdout으로 출력 (PowerShell에서 빨간색 방지)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(name)s: %(message)s'))
logging.root.handlers = [handler]
logging.root.setLevel(logging.INFO)

# werkzeug 로그 레벨 조정 (불필요한 요청 로그 줄이기)
logging.getLogger('werkzeug').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# 시작 시간 기록
START_TIME = time.time()


def create_app(config_class=Config):
    """Flask 앱 팩토리"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

    # Blueprint 등록
    from routes.analyze import analyze_bp
    app.register_blueprint(analyze_bp)

    @app.route('/api/audio/<filename>')
    def serve_audio(filename):
        """TTS 오디오 파일 서빙"""
        # 보안: 경로 조작 방지 (flask.send_from_directory가 기본적으로 처리하지만 한번 더)
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """서버 상태 확인 엔드포인트"""
        from services.whisper_service import WhisperService
        from services.ollama_service import OllamaService

        whisper_status = 'loaded' if WhisperService.is_loaded() else 'not_loaded'
        ollama_status = 'connected' if OllamaService.is_connected() else 'disconnected'
        uptime = int(time.time() - START_TIME)

        return jsonify({
            'status': 'ok',
            'services': {
                'whisper': whisper_status,
                'ollama': ollama_status,
            },
            'uptime': uptime,
        })

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({
            'success': False,
            'error': {'code': 'BAD_REQUEST', 'message': str(e)},
        }), 400

    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f'Internal Server Error: {e}')
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': '서버 내부 오류입니다.'},
        }), 500

    return app


if __name__ == '__main__':
    # temp_audio 폴더 생성
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

    app = create_app()

    logger.info('='*50)
    logger.info('Voice-Reactive 3D AI Visualizer Backend 시작')
    logger.info(f'Whisper 모델: {Config.WHISPER_MODEL}')
    logger.info(f'Ollama 모델: {Config.OLLAMA_MODEL}')
    logger.info(f'서버: http://localhost:5000')
    logger.info('='*50)

    app.run(host='0.0.0.0', port=5000, debug=False)
