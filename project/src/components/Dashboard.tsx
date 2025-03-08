import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Users, Ticket, CreditCard, Clock, Activity, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const { bands, transactions, activityLogs } = useData();
  const { userRole, currentUser } = useAuth();
  
  // Calculate statistics
  const activeBands = bands.filter(band => band.isActive).length;
  const totalVisitorsToday = bands.filter(band => {
    const today = new Date();
    const bandDate = new Date(band.printedAt);
    return bandDate.toDateString() === today.toDateString();
  }).length;
  
  const totalDeposits = transactions
    .filter(tx => tx.type === 'deposit')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalRefunds = transactions
    .filter(tx => tx.type === 'refund')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const currentBalance = totalDeposits - totalRefunds;
  
  // Staff-specific stats
  const staffBands = currentUser && userRole === 'staff'
    ? bands.filter(band => band.printedBy === currentUser.id).length
    : 0;
  
  // Recent activity logs (last 5)
  const recentLogs = [...activityLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
  
  // Generate data for visitor trend chart (last 7 days)
  const generateVisitorTrendData = () => {
    const labels = [];
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      labels.push(format(date, 'EEE'));
      
      const dayVisitors = bands.filter(band => {
        const bandDate = new Date(band.printedAt);
        return bandDate.toDateString() === date.toDateString();
      }).length;
      
      data.push(dayVisitors);
    }
    
    return { labels, data };
  };
  
  const visitorTrendData = generateVisitorTrendData();
  
  const chartData = {
    labels: visitorTrendData.labels,
    datasets: [
      {
        label: 'Daily Visitors',
        data: visitorTrendData.data,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };
  
  // Calculate today's adult and child visitors
  const adultVisitorsToday = bands.filter(band => {
    const today = new Date();
    const bandDate = new Date(band.printedAt);
    return bandDate.toDateString() === today.toDateString() && band.visitorType === 'A';
  }).length;
  
  const childVisitorsToday = bands.filter(band => {
    const today = new Date();
    const bandDate = new Date(band.printedAt);
    return bandDate.toDateString() === today.toDateString() && band.visitorType === 'C';
  }).length;
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Visitors Today</p>
            <p className="text-2xl font-bold">{totalVisitorsToday}</p>
            <p className="text-xs text-gray-500">{adultVisitorsToday} Adults, {childVisitorsToday} Children</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <Ticket className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Bands</p>
            <p className="text-2xl font-bold">{activeBands}</p>
            <p className="text-xs text-gray-500">Currently in the park</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <CreditCard className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-2xl font-bold">₹{currentBalance}</p>
            <p className="text-xs text-gray-500">Deposits: ₹{totalDeposits} | Refunds: ₹{totalRefunds}</p>
          </div>
        </div>
        
        {userRole === 'staff' ? (
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <Activity className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Your Bands Printed</p>
              <p className="text-2xl font-bold">{staffBands}</p>
              <p className="text-xs text-gray-500">Total bands issued by you</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className="rounded-full bg-red-100 p-3 mr-4">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
              <p className="text-xs text-gray-500">All time deposits and refunds</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Visitor Trend Chart */}
      {(userRole === 'admin' || userRole === 'owner') && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <TrendingUp className="mr-2 text-blue-600" size={20} />
              Visitor Trend (Last 7 Days)
            </h3>
            <Link to="/reports" className="text-blue-600 hover:text-blue-800 text-sm">
              View Full Reports
            </Link>
          </div>
          <div className="h-64">
            <Line 
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                  }
                }
              }}
            />
          </div>
        </div>
      )}
      
      {/* Today's Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <Calendar className="mr-2 text-blue-600" size={20} />
          <h3 className="text-lg font-semibold">Today's Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-sm text-gray-600">Adult Visitors</p>
            <p className="text-xl font-bold">{adultVisitorsToday}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <p className="text-sm text-gray-600">Child Visitors</p>
            <p className="text-xl font-bold">{childVisitorsToday}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
            <p className="text-sm text-gray-600">Deposits Today</p>
            <p className="text-xl font-bold">₹{
              transactions
                .filter(tx => {
                  const today = new Date();
                  const txDate = new Date(tx.timestamp);
                  return txDate.toDateString() === today.toDateString() && tx.type === 'deposit';
                })
                .reduce((sum, tx) => sum + tx.amount, 0)
            }</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            <p className="text-sm text-gray-600">Refunds Today</p>
            <p className="text-xl font-bold">₹{
              transactions
                .filter(tx => {
                  const today = new Date();
                  const txDate = new Date(tx.timestamp);
                  return txDate.toDateString() === today.toDateString() && tx.type === 'refund';
                })
                .reduce((sum, tx) => sum + tx.amount, 0)
            }</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(userRole === 'staff' || userRole === 'admin') && (
            <>
              <Link
                to="/bands"
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 flex items-center transition-colors"
              >
                <Ticket className="h-5 w-5 text-blue-600 mr-3" />
                <span>Print New Bands</span>
              </Link>
              
              <Link
                to="/entry-exit"
                className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 flex items-center transition-colors"
              >
                <Users className="h-5 w-5 text-green-600 mr-3" />
                <span>Scan Entry/Exit</span>
              </Link>
            </>
          )}
          
          {(userRole === 'admin' || userRole === 'owner') && (
            <>
              <Link
                to="/reports"
                className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 flex items-center transition-colors"
              >
                <Activity className="h-5 w-5 text-purple-600 mr-3" />
                <span>Generate Reports</span>
              </Link>
              
              <Link
                to="/activity"
                className="bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg p-4 flex items-center transition-colors"
              >
                <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                <span>View Activity Logs</span>
              </Link>
            </>
          )}
          
          {userRole === 'admin' && (
            <Link
              to="/users"
              className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 flex items-center transition-colors"
            >
              <Users className="h-5 w-5 text-red-600 mr-3" />
              <span>Manage Users</span>
            </Link>
          )}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentLogs.map(log => (
            <div key={log.id} className="border-b pb-3 last:border-0">
              <div className="flex justify-between">
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                  log.action.includes('Entry') ? 'bg-green-100 text-green-800' :
                  log.action.includes('Exit') ? 'bg-blue-100 text-blue-800' :
                  log.action.includes('Refund') ? 'bg-purple-100 text-purple-800' :
                  log.action.includes('Print') ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {log.action}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm mt-1">{log.details}</p>
            </div>
          ))}
          
          {recentLogs.length === 0 && (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
          
          {recentLogs.length > 0 && (
            <div className="text-center mt-2">
              <Link
                to="/activity"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View All Activity
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;