import React, { useState } from 'react'
import { useSleepRecords } from '../hooks/useSleepRecords'
import SleepRecordList from '../components/SleepRecordList'
import SleepRecordForm from '../components/SleepRecordForm'
import { SleepRecord, NewSleepRecord } from '../types/sleep'

const SleepRecordsPage: React.FC = () => {
  const { 
    sleepRecords, 
    users, 
    loading, 
    error, 
    addRecord, 
    updateRecord, 
    removeRecord 
  } = useSleepRecords()

  const [editingRecord, setEditingRecord] = useState<SleepRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingIds, setDeletingIds] = useState<number[]>([])

  const handleSaveRecord = async (record: NewSleepRecord) => {
    setIsSaving(true)
    try {
      if (editingRecord) {
        await updateRecord(editingRecord.id, record)
      } else {
        await addRecord(record)
      }
      setEditingRecord(null)
      setShowForm(false)
    } catch (e) {
      console.error('Failed to save record', e)
      // Optionally show an error message to the user
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (record: SleepRecord) => {
    setEditingRecord(record)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('정말로 이 기록을 삭제하시겠습니까?')) {
      setDeletingIds(prev => [...prev, id])
      try {
        await removeRecord(id)
      } catch (e) {
        console.error('Failed to delete record', e)
      } finally {
        setDeletingIds(prev => prev.filter(deletingId => deletingId !== id))
      }
    }
  }

  const handleCancelForm = () => {
    setEditingRecord(null)
    setShowForm(false)
  }

  const isDeleting = (id: number) => deletingIds.includes(id)

  if (loading && sleepRecords.length === 0) return <div className="text-center py-8">데이터를 불러오는 중입니다...</div>
  if (error) return <div className="text-center py-8 text-red-500">오류: {error}</div>

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">수면 기록 관리</h1>
        {!showForm && (
          <button
            onClick={() => { setEditingRecord(null); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-md font-semibold"
          >
            새 기록 추가
          </button>
        )}
      </div>

      {showForm && (
        <SleepRecordForm
          users={users}
          initialRecord={editingRecord}
          onSave={handleSaveRecord}
          onCancel={handleCancelForm}
          isSaving={isSaving}
        />
      )}

      <SleepRecordList
        sleepRecords={sleepRecords}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default SleepRecordsPage 