import { GoogleGenAI } from '@google/genai';

// 수면 데이터 타입 정의
export interface SleepRecord {
  id: number;
  userId: number;
  sleep_time: string;
  wake_time: string;
  duration: number;
  userEmail?: string;
}

export interface SleepStats {
  weeklySleepData: Array<{
    date: string;
    duration: number;
  }>;
  dailyAverageSleep: number;
}

// 스트리밍 응답을 위한 타입 정의
export interface StreamChunk {
  text: string;
  isComplete: boolean;
}

// AI 서비스 생성 함수
export function createAiService() {
  // API 키 검증
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY가 환경변수에 설정되지 않았습니다.');
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  // 스트리밍 버전
  async function* createAiServiceGenerator(sleepStats: SleepStats): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      const config = {
        responseMimeType: 'text/plain',
        temperature: 0.7,
        maxOutputTokens: 1000,
      };

      const model = 'gemma-3-1b-it';

      // 수면 데이터 분석을 위한 상세한 프롬프트
      const prompt = `
다음 수면 데이터를 바탕으로 수면 건강에 대한 전문적이고 실용적인 조언을 제공해주세요.

수면 통계:
- 일일 평균 수면 시간: ${sleepStats.dailyAverageSleep.toFixed(1)}시간
- 최근 7일 수면 기록:
${sleepStats.weeklySleepData.map((day, index) => 
  `  ${index + 1}일차 (${day.date}): ${day.duration}시간`
).join('\n')}

다음 요소들을 고려하여 조언해주세요:
1. 수면 시간의 일관성
2. 권장 수면 시간(성인 기준 7-9시간)과의 비교
3. 수면 패턴의 변화 트렌드
4. 구체적이고 실행 가능한 개선 방안

조언은 친근하면서도 전문적인 톤으로 작성해주세요.
`;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];

      // 스트리밍 요청
      const response = await ai.models.generateContentStream({
        model,
        config,
        contents,
      });

      // 청크별로 데이터 yield
      for await (const chunk of response) {
        if (chunk.text) {
          yield {
            text: chunk.text,
            isComplete: false,
          };
        }
      }

      // 완료 신호
      yield {
        text: '',
        isComplete: true,
      };

    } catch (error) {
      console.error('AI 서비스 에러:', error);
      yield {
        text: `\n\n[오류: ${error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.'}]`,
        isComplete: true,
      };
    }
  }

  // 비스트리밍 버전 (기존 API 호환성을 위해 유지)
  async function getSleepAdvice(sleepStats: SleepStats): Promise<string> {
    try {
      const config = {
        responseMimeType: 'text/plain',
        temperature: 0.7,
        maxOutputTokens: 1000,
      };

      const model = 'gemma-3-1b-it';

      const prompt = `
다음 수면 데이터를 바탕으로 수면 건강에 대한 전문적이고 실용적인 조언을 제공해주세요.

수면 통계:
- 일일 평균 수면 시간: ${sleepStats.dailyAverageSleep.toFixed(1)}시간
- 최근 7일 수면 기록:
${sleepStats.weeklySleepData.map((day, index) => 
  `  ${index + 1}일차 (${day.date}): ${day.duration}시간`
).join('\n')}

다음 요소들을 고려하여 조언해주세요:
1. 수면 시간의 일관성
2. 권장 수면 시간(성인 기준 7-9시간)과의 비교
3. 수면 패턴의 변화 트렌드
4. 구체적이고 실행 가능한 개선 방안

조언은 친근하면서도 전문적인 톤으로 작성해주세요.
`;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model,
        config,
        contents,
      });

      return response.text || '응답을 생성할 수 없습니다.';

    } catch (error) {
      console.error('AI 서비스 에러:', error);
      throw new Error(`AI 서비스 에러: ${error instanceof Error ? error.message : '알 수 없는 에러'}`);
    }
  }

  return {
    createAiService: createAiServiceGenerator,
    getSleepAdvice,
  };
}

export type AiService = ReturnType<typeof createAiService>;