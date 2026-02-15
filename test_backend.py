
import sys
import os
import asyncio

# 경로 설정
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.config import Config
from backend.services.ollama_service import OllamaService
from backend.services.tts_service import TtsService

# 로깅 설정
import logging
logging.basicConfig(level=logging.INFO)

def test_pipeline():
    print("="*50)
    print("Ollama & TTS Integration Test")
    print("="*50)

    # 1. Ollama Test
    user_input = "안녕하세요! 자기소개 좀 해주세요."
    print(f"[Input] {user_input}")
    
    try:
        if not OllamaService.is_connected():
            print("[Error] Ollama is not connected!")
            return

        ai_response = OllamaService.generate_response(user_input, "neutral")
        print(f"[AI Response] {ai_response}")
        
        if not ai_response:
            print("[Fail] No response from AI")
            return

    except Exception as e:
        print(f"[Error] Ollama failed: {e}")
        return

    # 2. TTS Test
    print("-" * 30)
    print("Generating TTS Audio...")
    
    try:
        # temp_audio 폴더 확보
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        
        filename = TtsService.generate_audio(ai_response)
        print(f"[TTS Filename] {filename}")
        
        filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
        if filename and os.path.exists(filepath):
            file_size = os.path.getsize(filepath)
            print(f"[Success] Audio file created at {filepath} ({file_size} bytes)")
        else:
            print("[Fail] Audio file creation failed")

    except Exception as e:
        print(f"[Error] TTS failed: {e}")

if __name__ == "__main__":
    test_pipeline()
