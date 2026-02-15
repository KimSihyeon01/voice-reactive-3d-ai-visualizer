"""
Backend API 테스트
"""
import json
import os
import sys
import unittest

# 프로젝트 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app


class TestHealthEndpoint(unittest.TestCase):
    """헬스 체크 엔드포인트 테스트"""

    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_health_check(self):
        """GET /api/health 200 반환 확인"""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'ok')


class TestAnalyzeEndpoint(unittest.TestCase):
    """분석 엔드포인트 테스트"""

    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_no_file_returns_400(self):
        """POST /api/analyze 파일 없이 요청 시 400"""
        response = self.client.post('/api/analyze')
        self.assertEqual(response.status_code, 400)

    def test_empty_file_returns_400(self):
        """POST /api/analyze 빈 파일 전송 시 400"""
        from io import BytesIO
        data = {'audio': (BytesIO(b''), 'test.webm')}
        response = self.client.post(
            '/api/analyze',
            data=data,
            content_type='multipart/form-data'
        )
        self.assertEqual(response.status_code, 400)


if __name__ == '__main__':
    unittest.main()
