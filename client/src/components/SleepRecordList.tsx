import React from 'react'
import { SleepRecord } from '../types/sleep'

interface SleepRecordListProps {
  sleepRecords: (SleepRecord & { userEmail?: string })[];
  onEdit: (record: SleepRecord) => void;
  onDelete: (id: number) => void;
  isDeleting: (id: number) => boolean;
}

const SleepRecordList: React.FC<SleepRecordListProps> = ({
  sleepRecords,
  onEdit,
  onDelete,
  isDeleting
}) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleString('ko-KR', options);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <h2 className="text-xl font-bold p-4 border-b">수면 기록 목록</h2>
      {sleepRecords.length === 0 ? (
        <p className="p-4 text-gray-600">아직 기록된 수면 데이터가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">취침 시간</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기상 시간</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수면 시간</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sleepRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.userEmail || `User ID: ${record.userId}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(record.sleep_time)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(record.wake_time)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.duration.toFixed(1)} 시간</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => onEdit(record)}
                      className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400"
                      disabled={isDeleting(record.id)}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => onDelete(record.id)}
                      className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                      disabled={isDeleting(record.id)}
                    >
                      {isDeleting(record.id) ? '삭제 중...' : '삭제'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SleepRecordList; 