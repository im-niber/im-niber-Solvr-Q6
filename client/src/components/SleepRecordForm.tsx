import React, { useState, useEffect, useMemo } from 'react'
import { NewSleepRecord, SleepRecord } from '../types/sleep'
import { User } from '../types/user'

interface SleepRecordFormProps {
  users: User[];
  initialRecord?: SleepRecord | null;
  onSave: (record: NewSleepRecord) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const SleepRecordForm: React.FC<SleepRecordFormProps> = ({
  users,
  initialRecord,
  onSave,
  onCancel,
  isSaving
}) => {
  const [userId, setUserId] = useState<number | string>('');
  const [sleepTime, setSleepTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');

  const duration = useMemo(() => {
    if (!sleepTime || !wakeTime) return 0;
    const sleep = new Date(sleepTime);
    const wake = new Date(wakeTime);
    const diff = wake.getTime() - sleep.getTime();
    if (diff <= 0) return 0;
    return Math.round((diff / (1000 * 60 * 60)) * 10) / 10; // in hours, 1 decimal place
  }, [sleepTime, wakeTime]);

  useEffect(() => {
    if (initialRecord) {
      setUserId(initialRecord.userId);
      setSleepTime(new Date(initialRecord.sleep_time).toISOString().slice(0, 16));
      setWakeTime(new Date(initialRecord.wake_time).toISOString().slice(0, 16));
    } else {
      // Reset form for new record
      setUserId('');
      setSleepTime('');
      setWakeTime('');
    }
  }, [initialRecord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !sleepTime || !wakeTime || duration <= 0) {
      alert('사용자, 취침 시간, 기상 시간을 올바르게 입력해주세요.');
      return;
    }
    const newRecord: NewSleepRecord = {
      userId: Number(userId),
      sleep_time: new Date(sleepTime).toISOString(),
      wake_time: new Date(wakeTime).toISOString(),
      duration: duration,
    };
    onSave(newRecord);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">
        {initialRecord ? '수면 기록 수정' : '새 수면 기록 추가'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="user" className="block text-sm font-medium text-gray-700">
            사용자
          </label>
          <select
            id="user"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="" disabled>사용자를 선택하세요</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sleepTime" className="block text-sm font-medium text-gray-700">
            취침 시간
          </label>
          <input
            type="datetime-local"
            id="sleepTime"
            value={sleepTime}
            onChange={(e) => setSleepTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="wakeTime" className="block text-sm font-medium text-gray-700">
            기상 시간
          </label>
          <input
            type="datetime-local"
            id="wakeTime"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        {duration > 0 && (
          <p className="text-sm text-gray-600">계산된 수면 시간: {duration} 시간</p>
        )}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isSaving}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
            disabled={isSaving || duration <= 0}
          >
            {isSaving ? '저장 중...' : (initialRecord ? '수정하기' : '추가하기')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SleepRecordForm; 