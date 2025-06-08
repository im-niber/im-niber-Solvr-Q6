import { eq, desc } from 'drizzle-orm'
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

  return {
    getAllSleepRecords,
    createSleepRecord,
    updateSleepRecord,
    deleteSleepRecord
  }
}

export type SleepService = ReturnType<typeof createSleepService> 