import { FastifyRequest, FastifyReply } from 'fastify'
import { AppContext } from '../types/context'
import { NewSleepRecord } from '../db/schema'
import { createSuccessResponse, createErrorResponse } from '../utils/response'
import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { sleepRecords } from '../db/schema'

export function createSleepController(context: AppContext) {
  const { sleepService, aiService } = context

  async function getAllSleepRecords(request: FastifyRequest, reply: FastifyReply) {
    try {
      const records = await sleepService.getAllSleepRecords()
      reply.send(createSuccessResponse(records))
    } catch (error) {
      console.error(error)
      reply.status(500).send(createErrorResponse('Failed to fetch sleep records'))
    }
  }

  async function createSleepRecord(
    request: FastifyRequest<{ Body: NewSleepRecord }>,
    reply: FastifyReply
  ) {
    try {
      const newRecord = await sleepService.createSleepRecord(request.body)
      reply.status(201).send(createSuccessResponse(newRecord))
    } catch (error) {
      console.error(error)
      reply.status(500).send(createErrorResponse('Failed to create sleep record'))
    }
  }

  async function updateSleepRecord(
    request: FastifyRequest<{ Params: { id: string }; Body: Partial<NewSleepRecord> }>,
    reply: FastifyReply
  ) {
    try {
      const id = parseInt(request.params.id, 10)
      const updatedRecord = await sleepService.updateSleepRecord(id, request.body)
      if (updatedRecord) {
        reply.send(createSuccessResponse(updatedRecord))
      } else {
        reply.status(404).send(createErrorResponse('Sleep record not found'))
      }
    } catch (error) {
      console.error(error)
      reply.status(500).send(createErrorResponse('Failed to update sleep record'))
    }
  }

  async function deleteSleepRecord(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const id = parseInt(request.params.id, 10)
      const success = await sleepService.deleteSleepRecord(id)
      if (success) {
        reply.status(204).send()
      } else {
        reply.status(404).send(createErrorResponse('Sleep record not found'))
      }
    } catch (error) {
      console.error(error)
      reply.status(500).send(createErrorResponse('Failed to delete sleep record'))
    }
  }

  async function getSleepStats(
    request: FastifyRequest<{ Querystring: { userId: string } }>,
    reply: FastifyReply
  ) {
    const { userId } = request.query
    if (!userId) {
      return reply.status(400).send(createErrorResponse('사용자 ID가 필요합니다.'))
    }

    try {
      const stats = await sleepService.getSleepStats(Number(userId))
      reply.send(createSuccessResponse(stats))
    } catch (error) {
      console.error('수면 통계 조회 중 오류 발생:', error)
      reply.status(500).send(createErrorResponse('수면 통계 조회 중 오류가 발생했습니다.'))
    }
  }

  
async function getSleepAdvice(
  request: FastifyRequest<{ Querystring: { userId: string } }>,
  reply: FastifyReply
) {
  const { userId } = request.query;
  if (!userId) {
    return reply.status(400).send(createErrorResponse('사용자 ID가 필요합니다.'));
  }

  try {
    const stats = await sleepService.getSleepStats(Number(userId));
    if (stats.weeklySleepData.length === 0) {
      return reply
        .status(200)
        .send(createSuccessResponse({ advice: '수면 데이터가 부족하여 조언을 생성할 수 없습니다.' }));
    }

    // SSE 헤더 설정
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    reply.raw.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    reply.hijack();

    // 연결 유지를 위한 heartbeat (30초마다)
    const heartbeat = setInterval(() => {
      if (!reply.raw.destroyed) {
        reply.raw.write(': heartbeat\n\n');
      }
    }, 30000);

    try {
      // 시작 메시지 전송
      reply.raw.write(`data: ${JSON.stringify({ 
        type: 'start', 
        message: '수면 패턴을 분석하고 있습니다...' 
      })}\n\n`);

      let fullAdvice = '';

      // AI 서비스에서 스트리밍 데이터 받기
      for await (const chunk of aiService.createAiService(stats)) {
        if (chunk.text && !reply.raw.destroyed) {
          fullAdvice += chunk.text;
          
          const data = JSON.stringify({
            type: 'chunk',
            text: chunk.text,
            fullText: fullAdvice,
            isComplete: chunk.isComplete
          });
          reply.raw.write(`data: ${data}\n\n`);
        }
        
        if (chunk.isComplete) {
          reply.raw.write(`data: ${JSON.stringify({ 
            type: 'complete',
            fullText: fullAdvice 
          })}\n\n`);
          break;
        }
      }
    } catch (aiError) {
      console.error('AI 서비스 에러:', aiError);
      if (!reply.raw.destroyed) {
        reply.raw.write(`data: ${JSON.stringify({ 
          type: 'error', 
          message: 'AI 서비스에서 문제가 발생했습니다.' 
        })}\n\n`);
      }
    } finally {
      clearInterval(heartbeat);
      if (!reply.raw.destroyed) {
        reply.raw.end();
      }
    }

  } catch (error) {
    console.error('수면 조언 생성 중 오류 발생:', error);
    
    // 이미 hijack된 경우와 그렇지 않은 경우 구분
    if (reply.raw.headersSent) {
      // 이미 SSE 헤더가 전송된 경우
      if (!reply.raw.destroyed) {
        reply.raw.write(`data: ${JSON.stringify({ 
          type: 'error', 
          message: '수면 조언 생성 중 오류가 발생했습니다.' 
        })}\n\n`);
        reply.raw.end();
      }
    } else {
      // 아직 응답이 시작되지 않은 경우
      reply.status(500).send(createErrorResponse('수면 조언 생성 중 오류가 발생했습니다.'));
    }
  }
}


  return {
    getAllSleepRecords,
    createSleepRecord,
    updateSleepRecord,
    deleteSleepRecord,
    getSleepStats,
    getSleepAdvice
  }
} 