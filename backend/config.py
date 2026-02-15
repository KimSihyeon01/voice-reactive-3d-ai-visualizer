"""설정 파일"""
import os


class Config:
    WHISPER_MODEL = os.environ.get('WHISPER_MODEL', 'small')
    OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'llama3:8b')
    OLLAMA_HOST = os.environ.get('OLLAMA_HOST', 'http://localhost:11434')
    MAX_AUDIO_SIZE = 10 * 1024 * 1024  # 10MB
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'temp_audio')
    OLLAMA_TIMEOUT = 10  # seconds
