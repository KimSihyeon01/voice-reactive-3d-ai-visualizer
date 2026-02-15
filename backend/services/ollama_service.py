"""
Ollama Emotion Analysis Service
텍스트 → 감정 분석 (로컬 Ollama LLM)
"""
import json
import re
import logging
import ollama as ollama_client
from config import Config

logger = logging.getLogger(__name__)

# 감정 분석 프롬프트 템플릿
EMOTION_PROMPT = """당신은 전문 감정 분석 AI입니다.
사용자의 발화를 분석하여 감정 상태를 JSON 형식으로 출력하세요.

**감정 카테고리:**
- happy: 행복, 기쁨, 만족
- sad: 슬픔, 우울, 상실감
- angry: 분노, 짜증, 화남
- neutral: 중립적, 평범함
- excited: 흥분, 열정, 들뜸
- thinking: 고민, 사색, 집중
- calm: 평온, 안정, 차분함

**출력 형식 (JSON만 출력, 다른 텍스트 금지):**
{{"emotion": "감정 카테고리", "intensity": 0.0~1.0, "state": "listening|thinking|speaking", "keywords": ["핵심", "단어", "목록"]}}

**예시:**
입력: "오늘 정말 짜증나"
출력: {{"emotion": "angry", "intensity": 0.8, "state": "speaking", "keywords": ["오늘", "짜증"]}}

입력: "AGI 구현 방법을 고민 중이야"
출력: {{"emotion": "thinking", "intensity": 0.7, "state": "thinking", "keywords": ["AGI", "구현", "고민"]}}

입력: "와 드디어 됐다!"
출력: {{"emotion": "excited", "intensity": 0.95, "state": "speaking", "keywords": ["드디어"]}}

**이제 분석할 텍스트:**
{user_text}

**출력 (JSON만):**"""

VALID_EMOTIONS = {'happy', 'sad', 'angry', 'neutral', 'excited', 'thinking', 'calm'}
DEFAULT_RESULT = {'emotion': 'neutral', 'intensity': 0.5, 'state': 'speaking', 'keywords': []}


class OllamaService:
    @staticmethod
    def analyze_emotion(text: str) -> dict:
        """
        텍스트의 감정을 분석합니다.

        Args:
            text: 분석할 텍스트

        Returns:
            {"emotion": "happy", "intensity": 0.85, "state": "speaking", "keywords": ["기분", "좋아"]}
        """
        if not text or not text.strip():
            return DEFAULT_RESULT.copy()

        try:
            prompt = EMOTION_PROMPT.replace('{user_text}', text)

            response = ollama_client.chat(
                model=Config.OLLAMA_MODEL,
                messages=[{'role': 'user', 'content': prompt}],
                options={'temperature': 0.1, 'num_predict': 200},
            )

            response_text = response['message']['content'].strip()
            logger.debug(f'Ollama 원본 응답: {response_text}')

            # JSON 추출 및 파싱
            result = OllamaService._parse_json_response(response_text)
            return result

        except Exception as e:
            logger.error(f'Ollama 감정 분석 에러: {e}')
            return DEFAULT_RESULT.copy()

    @staticmethod
    def _parse_json_response(text: str) -> dict:
        """Ollama 응답에서 JSON 추출 및 검증"""
        # JSON 블록 추출 시도
        json_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
        if not json_match:
            logger.warning(f'JSON 파싱 실패, 기본값 반환: {text[:100]}')
            return DEFAULT_RESULT.copy()

        try:
            data = json.loads(json_match.group())
        except json.JSONDecodeError:
            logger.warning(f'JSON 디코드 실패: {json_match.group()[:100]}')
            return DEFAULT_RESULT.copy()

        # 필드 검증 및 정규화
        emotion = data.get('emotion', 'neutral')
        if emotion not in VALID_EMOTIONS:
            emotion = 'neutral'

        intensity = data.get('intensity', 0.5)
        if not isinstance(intensity, (int, float)):
            intensity = 0.5
        intensity = max(0.0, min(1.0, float(intensity)))

        state = data.get('state', 'speaking')
        if state not in ('listening', 'thinking', 'speaking'):
            state = 'speaking'

        keywords = data.get('keywords', [])
        if not isinstance(keywords, list):
            keywords = []

        return {
            'emotion': emotion,
            'intensity': round(intensity, 2),
            'state': state,
            'keywords': keywords[:5],  # 최대 5개
        }

    @staticmethod
    def generate_response(user_text: str, emotion: str = 'neutral') -> str:
        """
        사용자 입력에 대한 AI 응답을 생성합니다.
        
        Args:
            user_text: 사용자 입력
            emotion: 분석된 감정 (참고용)
            
        Returns:
            AI 응답 텍스트 (예: "네, 알겠습니다.")
        """
        if not user_text:
            return ""

        system_prompt = (
            "당신은 'MindCare'라는 이름의 공감형 AI 비서입니다. "
            "사용자의 감정과 맥락을 고려하여 짧고 명확하게, 그리고 따뜻하게 대답하세요. "
            "한국어로 자연스럽게 대화하세요. 2~3문장 이내로 답변하세요."
        )

        try:
            response = ollama_client.chat(
                model=Config.OLLAMA_MODEL,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_text}
                ],
                options={'temperature': 0.7, 'num_predict': 100},
            )
            
            answer = response['message']['content'].strip()
            logger.info(f"AI 응답 생성: {answer}")
            return answer

        except Exception as e:
            logger.error(f"Ollama 대화 생성 실패: {e}")
            return "죄송해요, 지금은 대답하기 어렵네요."

    @staticmethod
    def is_connected() -> bool:
        """Ollama 서버 연결 확인"""
        try:
            ollama_client.list()
            return True
        except Exception:
            return False
