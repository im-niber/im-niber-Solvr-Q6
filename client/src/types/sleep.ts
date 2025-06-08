export interface SleepRecord {
  id: number;
  userId: number;
  sleep_time: string;
  wake_time: string;
  duration: number;
  userEmail?: string;
}

export interface NewSleepRecord {
  userId: number;
  sleep_time: string;
  wake_time: string;
  duration: number;
} 