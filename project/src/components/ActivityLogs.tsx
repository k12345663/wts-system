import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import { Search, Filter } from 'lucide-react';

const ActivityLogs: React.FC = () => {
  const { activityLogs } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sort logs by timestamp (newest first)
  const sortedLogs = [...activityLogs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Apply filters
  const filteredLogs = sortedLogs.filter(log => {
    const matchesSearch = 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction ? log.action === filterAction : true;
    
    const logDate = new Date(log.timestamp);
    const matchesStartDate = startDate ? logDate >= new Date(startDate) : true;
    const matchesEndDate = endDate ? logDate <= new Date(`${endDate}T23:59:59`) : true;
    
    return matchesSearch && matchesAction && matchesStartDate && matchesEndDate;
  });

  // Get unique actions for filter dropdown
  const uniqueActions = Array.from(new Set(activityLogs.map(log => log.action)));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Activity Logs</h2>
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>
          
          <div className="w-full md:w-64">
            <div className="relative">
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
              <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">Timestamp</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">Action</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">Details</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">User ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 border-b">
                  <td className="py-3 px-4 text-sm">
                    {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      log.action.includes('Entry') ? 'bg-green-100 text-green-800' :
                      log.action.includes('Exit') ? 'bg-blue-100 text-blue-800' :
                      log.action.includes('Refund') ? 'bg-purple-100 text-purple-800' :
                      log.action.includes('Print') ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{log.details}</td>
                  <td className="py-3 px-4 text-sm">{log.userId}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                  No activity logs found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredLogs.length} of {activityLogs.length} logs
      </div>
    </div>
  );
};

export default ActivityLogs;