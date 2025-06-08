import { useState, useEffect, useRef } from 'react'
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
  const [advice, setAdvice] = useState<string | null>(null)
  const [isAdviceLoading, setIsAdviceLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  
  // EventSource 참조를 위한 ref
  const eventSourceRef = useRef<EventSource | null>(null)

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
        setAdvice(null)
        return
    }

    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const statsData = await sleepService.getStats(selectedUserId)
        setStats(statsData)
        setAdvice(null)
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

  // 스트리밍 정리 함수
  const cleanupEventSource = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanupEventSource()
    }
  }, [])

  const handleGetAdvice = async () => {
    if (!selectedUserId) return
    
    // 기존 연결이 있다면 정리
    cleanupEventSource()
    
    setIsAdviceLoading(true)
    setAdvice('')
    setStreamingMessage('AI가 당신의 수면 패턴을 분석하고 있습니다...')
    setError(null)

    try {
      // Server-Sent Events 연결 생성
      const eventSource = new EventSource(`/api/sleep/advice?userId=${selectedUserId}`)
      eventSourceRef.current = eventSource
      
      let fullAdvice = ''

      eventSource.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case 'start':
              setStreamingMessage(data.message)
              break
              
            case 'chunk':
              if (data.text) {
                fullAdvice += data.text
                setAdvice(fullAdvice)
              }
              
              // 전체 텍스트가 있으면 사용 (서버에서 제공하는 경우)
              if (data.fullText) {
                setAdvice(data.fullText)
              }
              
              if (data.isComplete) {
                setStreamingMessage('')
                setIsAdviceLoading(false)
                eventSource.close()
                eventSourceRef.current = null
              }
              break
              
            case 'complete':
              if (data.fullText) {
                setAdvice(data.fullText)
              }
              setStreamingMessage('')
              setIsAdviceLoading(false)
              eventSource.close()
              eventSourceRef.current = null
              break
              
            case 'error':
              console.error('서버 에러:', data.message)
              setError(`AI 조언 생성 실패: ${data.message}`)
              setStreamingMessage('')
              setIsAdviceLoading(false)
              eventSource.close()
              eventSourceRef.current = null
              break
          }
        } catch (parseError) {
          console.error('JSON 파싱 에러:', parseError)
        }
      }
      
      eventSource.onerror = function(error) {
        console.error('SSE 연결 에러:', error)
        setError('AI 조언을 받아오는 데 실패했습니다. 네트워크 연결을 확인해주세요.')
        setStreamingMessage('')
        setIsAdviceLoading(false)
        eventSource.close()
        eventSourceRef.current = null
      }
      
      // 타임아웃 설정 (2분)
      setTimeout(() => {
        if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
          setError('AI 조언 생성 시간이 초과되었습니다. 다시 시도해주세요.')
          setStreamingMessage('')
          setIsAdviceLoading(false)
          eventSource.close()
          eventSourceRef.current = null
        }
      }, 120000)
      
    } catch (err) {
      setError('AI 조언을 받아오는 데 실패했습니다.')
      setStreamingMessage('')
      setIsAdviceLoading(false)
      console.error(err)
    }
  }

  // 스트리밍 중단 함수
  const handleStopAdvice = () => {
    cleanupEventSource()
    setIsAdviceLoading(false)
    setStreamingMessage('')
  }
  
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
        <>
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

          <div className="mt-8">
            <div className="flex gap-4 items-center">
              <button
                onClick={handleGetAdvice}
                disabled={isAdviceLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isAdviceLoading ? 'AI 조언 생성 중...' : 'AI 수면 조언 보기'}
              </button>
              
              {isAdviceLoading && (
                <button
                  onClick={handleStopAdvice}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  중단
                </button>
              )}
            </div>

            {streamingMessage && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-blue-800">{streamingMessage}</span>
                </div>
              </div>
            )}
            
            {advice && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">AI 수면 조언</h3>
                <div className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {advice}
                  {isAdviceLoading && (
                    <span className="inline-block w-2 h-5 bg-gray-400 animate-pulse ml-1"></span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}