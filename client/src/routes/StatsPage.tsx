import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { sleepService, userService } from '../services/api'
import { User } from '../types/user'

interface SleepData {
  date: string
  duration: number
}

interface SleepStats {
  weeklySleepData: SleepData[]
  dailyAverageSleep: number
}

export default function StatsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [stats, setStats] = useState<SleepStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await userService.getAll()
        setUsers(usersData)
      } catch (err) {
        setError('사용자 목록을 불러오는 데 실패했습니다.')
        console.error(err)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!selectedUserId) {
        setStats(null)
        return
    }

    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const statsData = await sleepService.getStats(selectedUserId)
        setStats(statsData)
      } catch (err) {
        setError('수면 통계 데이터를 불러오는 데 실패했습니다.')
        console.error(err)
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [selectedUserId])
  
  const formattedWeeklyData = stats?.weeklySleepData.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    })
  })).reverse()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">수면 통계</h1>

      <div className="mb-8 max-w-sm">
        <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">
          사용자 선택
        </label>
        <select
          id="user-select"
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
          value={selectedUserId ?? ''}
        >
          <option value="" disabled>사용자를 선택하세요</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="text-center p-8">로딩 중...</div>}
      {error && <div className="text-center p-8 text-red-500">{error}</div>}
      
      {!loading && !error && !stats && (
        <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
          <p className="text-lg">사용자를 선택하면 수면 통계 차트가 표시됩니다.</p>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">주간 수면 시간</h2>
              <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formattedWeeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: '시간', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="duration" name="수면 시간" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
              </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">일일 평균 수면</h2>
              <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[{ name: '평균', duration: stats.dailyAverageSleep }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: '시간', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="duration" name="평균 수면 시간" fill="#82ca9d" />
                  </BarChart>
              </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
} 