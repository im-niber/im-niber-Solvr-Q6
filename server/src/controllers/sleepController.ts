import { FastifyRequest, FastifyReply } from 'fastify'
import { AppContext } from '../types/context'
import { NewSleepRecord } from '../db/schema'
import { createSuccessResponse, createErrorResponse } from '../utils/response'
import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '../db'
import { sleepRecords } from '../db/schema'

export function createSleepController(context: AppContext) {
  const { sleepService } = context

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

  return {
    getAllSleepRecords,
    createSleepRecord,
    updateSleepRecord,
    deleteSleepRecord,
    getSleepStats
  }
} 