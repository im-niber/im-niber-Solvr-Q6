import { FastifyRequest, FastifyReply } from 'fastify'
import { AppContext } from '../types/context'
import { NewSleepRecord } from '../db/schema'
import { createSuccessResponse, createErrorResponse } from '../utils/response'

export function createSleepController(context: AppContext) {
  async function getSleepRecords(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const records = await context.sleepService.getAllSleepRecords()
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
      const newRecord = await context.sleepService.createSleepRecord(request.body)
      reply.status(201).send(createSuccessResponse(newRecord, '수면 기록이 성공적으로 생성되었습니다.'))
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
      const updatedRecord = await context.sleepService.updateSleepRecord(id, request.body)
      if (!updatedRecord) {
        return reply.status(404).send(createErrorResponse('Record not found'))
      }
      reply.send(createSuccessResponse(updatedRecord, '수면 기록이 성공적으로 업데이트되었습니다.'))
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
      await context.sleepService.deleteSleepRecord(id)
      reply.status(204).send(createSuccessResponse(null, '수면 기록이 성공적으로 삭제되었습니다.'))
    } catch (error) {
      console.error(error)
      reply.status(500).send(createErrorResponse('Failed to delete sleep record'))
    }
  }

  return {
    getSleepRecords,
    createSleepRecord,
    updateSleepRecord,
    deleteSleepRecord
  }
} 