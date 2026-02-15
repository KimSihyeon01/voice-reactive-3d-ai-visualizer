"""
Audio Converter Service
webm → wav 포맷 변환
"""
import os
import logging
import subprocess
import shutil

logger = logging.getLogger(__name__)


class AudioConverter:
    @staticmethod
    def convert_webm_to_wav(input_path: str, output_path: str) -> str:
        """
        webm → wav 변환 (ffmpeg 또는 pydub 사용)

        Args:
            input_path: .webm 파일 경로
            output_path: .wav 출력 경로

        Returns:
            출력 파일 경로
        """
        # 방법 1: ffmpeg 직접 사용 (설치된 경우)
        if shutil.which('ffmpeg'):
            return AudioConverter._convert_with_ffmpeg(input_path, output_path)

        # 방법 2: pydub 사용 (ffmpeg가 없어도 일부 작동)
        return AudioConverter._convert_with_pydub(input_path, output_path)

    @staticmethod
    def _convert_with_ffmpeg(input_path: str, output_path: str) -> str:
        """ffmpeg로 변환"""
        try:
            cmd = [
                'ffmpeg', '-y',
                '-i', input_path,
                '-ar', '16000',      # 16kHz
                '-ac', '1',          # 모노
                '-acodec', 'pcm_s16le',
                output_path,
            ]
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=30
            )
            if result.returncode != 0:
                raise RuntimeError(f'ffmpeg 에러: {result.stderr[:200]}')

            logger.info(f'오디오 변환 완료 (ffmpeg): {output_path}')
            return output_path

        except subprocess.TimeoutExpired:
            raise RuntimeError('ffmpeg 변환 타임아웃 (30초)')
        except FileNotFoundError:
            raise RuntimeError('ffmpeg가 설치되지 않았습니다.')

    @staticmethod
    def _convert_with_pydub(input_path: str, output_path: str) -> str:
        """pydub으로 변환"""
        try:
            from pydub import AudioSegment

            audio = AudioSegment.from_file(input_path, format='webm')
            audio = audio.set_frame_rate(16000).set_channels(1)
            audio.export(output_path, format='wav')

            logger.info(f'오디오 변환 완료 (pydub): {output_path}')
            return output_path

        except Exception as e:
            raise RuntimeError(
                f'오디오 변환 실패: {e}. ffmpeg를 설치해주세요: '
                'https://ffmpeg.org/download.html'
            )

    @staticmethod
    def validate_audio(file_path: str) -> bool:
        """오디오 파일 유효성 검증"""
        if not os.path.exists(file_path):
            return False
        if os.path.getsize(file_path) < 100:  # 100 bytes 미만은 무효
            return False
        return True
