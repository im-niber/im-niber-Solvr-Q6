import { eq, desc, and, gte } from 'drizzle-orm'
import { sleepRecords, NewSleepRecord, SleepRecord } from '../db/schema'
import { Database } from '../types/database'

type SleepServiceDeps = {
  db: Database
}

export const createSleepService = ({ db }: SleepServiceDeps) => {
  const getAllSleepRecords = async () => {
    // Also join with the users table to get the user's email
    return db.query.sleepRecords.findMany({
      with: {
        user: {
          columns: {
            email: true,
          },
        },
      },
      orderBy: [desc(sleepRecords.sleep_time)],
    });
  }

  const createSleepRecord = async (recordData: NewSleepRecord): Promise<SleepRecord> => {
    const result = await db.insert(sleepRecords).values(recordData).returning()
    return result[0]
  }

  const updateSleepRecord = async (id: number, recordData: Partial<NewSleepRecord>): Promise<SleepRecord | undefined> => {
    const result = await db.update(sleepRecords).set(recordData).where(eq(sleepRecords.id, id)).returning()
    return result[0]
  }

  const deleteSleepRecord = async (id: number): Promise<boolean> => {
    const result = await db.delete(sleepRecords).where(eq(sleepRecords.id, id)).returning({ id: sleepRecords.id })
    return result.length > 0
  }

  const getSleepStats = async (userId: number) => {
    const now = new Date()
    const aWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const weeklySleepData = await db
      .select({
        date: sleepRecords.sleep_time,
        duration: sleepRecords.duration
      })
      .from(sleepRecords)
      .where(
        and(
          eq(sleepRecords.userId, userId),
          gte(sleepRecords.sleep_time, aWeekAgo.toISOString())
        )
      )
      .orderBy(desc(sleepRecords.sleep_time))

    const dailyAverageSleep =
      weeklySleepData.reduce((acc, record) => acc + record.duration, 0) / (weeklySleepData.length || 1)

    return {
      weeklySleepData,
      dailyAverageSleep: parseFloat(dailyAverageSleep.toFixed(2))
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

export type SleepService = ReturnType<typeof createSleepService> 