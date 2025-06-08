import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from '../db/schema'
import { UserService } from '../services/userService'
import { SleepService } from '../services/sleepService'
import { AiService } from '../services/aiService'

export type AppDb = BetterSQLite3Database<typeof schema>

export interface AppContext {
  userService: UserService
  sleepService: SleepService
  aiService: AiService
}
