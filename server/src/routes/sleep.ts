import { FastifyInstance } from 'fastify'
import { AppContext } from '../types/context'
import { createSleepController } from '../controllers/sleepController'

export function createSleepRoutes(context: AppContext) {
  const sleepController = createSleepController(context)

  return async function (fastify: FastifyInstance) {
    fastify.get('/', sleepController.getSleepRecords)
    fastify.post('/', sleepController.createSleepRecord)
    fastify.put('/:id', sleepController.updateSleepRecord)
    fastify.delete('/:id', sleepController.deleteSleepRecord)
  }
} 