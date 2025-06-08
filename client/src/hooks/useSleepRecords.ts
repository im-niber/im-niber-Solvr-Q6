import { useState, useEffect, useCallback } from 'react'
import { sleepService, userService } from '../services/api'
import { SleepRecord, NewSleepRecord } from '../types/sleep'
import { User } from '../types/user'

export function useSleepRecords() {
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [recordsData, usersData] = await Promise.all([
        sleepService.getAll(),
        userService.getAll(),
      ])
      setSleepRecords(recordsData)
      setUsers(usersData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addRecord = useCallback(
    async (record: NewSleepRecord) => {
      try {
        const newRecord = await sleepService.create(record)
        // The server response from the join doesn't match the SleepRecord type perfectly.
        // We'll refetch to get the correctly joined data.
        await fetchData()
        return newRecord;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add record'
        setError(message)
        throw err;
      }
    }, [fetchData])

  const updateRecord = useCallback(
    async (id: number, record: Partial<NewSleepRecord>) => {
      try {
        const updatedRecord = await sleepService.update(id, record)
        await fetchData()
        return updatedRecord;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update record'
        setError(message)
        throw err;
      }
    }, [fetchData])

  const removeRecord = useCallback(
    async (id: number) => {
      try {
        await sleepService.delete(id)
        setSleepRecords((prev) => prev.filter((r) => r.id !== id))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete record'
        setError(message)
        throw err;
      }
    }, [])

  return {
    sleepRecords,
    users,
    loading,
    error,
    addRecord,
    updateRecord,
    removeRecord,
    refetch: fetchData,
  }
} 