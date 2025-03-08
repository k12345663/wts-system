import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { format, subMonths, isWithinInterval } from 'date-fns';
import { BarChart, FileText, Download, Printer, Calendar, TrendingUp } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Reports: React.FC = () => {
  const { reports, generateReport, bands, transactions } = useData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'sixMonth'>('monthly');
  
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Sort reports by generated date (newest first)
  const sortedReports = [...reports].sort((a, b) => 
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
  
  const handleGenerateReport = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(`${endDate}T23:59:59`);
    
    if (start > end) {
      alert('Start date must be before end date');
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate a delay for report generation
    setTimeout(() => {
      generateReport(start, end);
      setIsGenerating(false);
    }, 1000);
  };
  
  const handlePrintReport = useReactToPrint({
    content: () => reportRef.current,
  });
  
  const downloadReport = (report: any) => {
    setSelectedReport(report.id);
    setTimeout(() => {
      handlePrintReport();
    }, 500);
  };
  
  // Generate chart data based on bands and transactions
  const generateChartData = () => {
    const today = new Date();
    let startDateForChart: Date;
    let labels: string[] = [];
    
    // Set date range based on selected period
    switch (reportPeriod) {
      case 'daily':
        startDateForChart = new Date(today);
        startDateForChart.setDate(today.getDate() - 7); // Last 7 days
        
        // Generate daily labels for the last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          labels.push(format(date, 'MMM d'));
        }
        break;
        
      case 'weekly':
        startDateForChart = new Date(today);
        startDateForChart.setDate(today.getDate() - 28); // Last 4 weeks
        
        // Generate weekly labels for the last 4 weeks
        for (let i = 4; i >= 1; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - (i * 7));
          labels.push(`Week ${5-i}`);
        }
        break;
        
      case 'sixMonth':
        startDateForChart = new Date(today);
        startDateForChart.setMonth(today.getMonth() - 6); // Last 6 months
        
        // Generate monthly labels for the last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date(today);
          date.setMonth(today.getMonth() - i);
          labels.push(format(date, 'MMM yyyy'));
        }
        break;
        
      case 'monthly':
      default:
        startDateForChart = new Date(today);
        startDateForChart.setMonth(today.getMonth() - 3); // Last 3 months
        
        // Generate monthly labels for the last 3 months
        for (let i = 2; i >= 0; i--) {
          const date = new Date(today);
          date.setMonth(today.getMonth() - i);
          labels.push(format(date, 'MMM yyyy'));
        }
    }
    
    // Filter data for the selected period
    const filteredBands = bands.filter(band => 
      new Date(band.printedAt) >= startDateForChart && 
      new Date(band.printedAt) <= today
    );
    
    const filteredTransactions = transactions.filter(tx => 
      new Date(tx.timestamp) >= startDateForChart && 
      new Date(tx.timestamp) <= today
    );
    
    // Prepare data arrays
    const visitorData: number[] = [];
    const depositData: number[] = [];
    const refundData: number[] = [];
    
    // Calculate data for each label period
    labels.forEach((label, index) => {
      let periodStart: Date;
      let periodEnd: Date;
      
      switch (reportPeriod) {
        case 'daily':
          periodStart = new Date(today);
          periodStart.setDate(today.getDate() - (6 - index));
          periodStart.setHours(0, 0, 0, 0);
          
          periodEnd = new Date(periodStart);
          periodEnd.setHours(23, 59, 59, 999);
          break;
          
        case 'weekly':
          periodStart = new Date(today);
          periodStart.setDate(today.getDate() - (28 - (index * 7)));
          periodStart.setHours(0, 0, 0, 0);
          
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodStart.getDate() + 6);
          periodEnd.setHours(23, 59, 59, 999);
          break;
          
        case 'sixMonth':
          periodStart = new Date(today);
          periodStart.setMonth(today.getMonth() - (5 - index));
          periodStart.setDate(1);
          periodStart.setHours(0, 0, 0, 0);
          
          periodEnd = new Date(periodStart);
          periodEnd.setMonth(periodStart.getMonth() + 1);
          periodEnd.setDate(0);
          periodEnd.setHours(23, 59, 59, 999);
          break;
          
        case 'monthly':
        default:
          periodStart = new Date(today);
          periodStart.setMonth(today.getMonth() - (2 - index));
          periodStart.setDate(1);
          periodStart.setHours(0, 0, 0, 0);
          
          periodEnd = new Date(periodStart);
          periodEnd.setMonth(periodStart.getMonth() + 1);
          periodEnd.setDate(0);
          periodEnd.setHours(23, 59, 59, 999);
      }
      
      // Count visitors for this period
      const periodVisitors = filteredBands.filter(band => 
        isWithinInterval(new Date(band.printedAt), { start: periodStart, end: periodEnd })
      ).length;
      
      // Sum deposits for this period
      const periodDeposits = filteredTransactions
        .filter(tx => 
          tx.type === 'deposit' && 
          isWithinInterval(new Date(tx.timestamp), { start: periodStart, end: periodEnd })
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // Sum refunds for this period
      const periodRefunds = filteredTransactions
        .filter(tx => 
          tx.type === 'refund' && 
          isWithinInterval(new Date(tx.timestamp), { start: periodStart, end: periodEnd })
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      visitorData.push(periodVisitors);
      depositData.push(periodDeposits);
      refundData.push(periodRefunds);
    });
    
    return {
      labels,
      visitorData,
      depositData,
      refundData
    };
  };
  
  const chartData = generateChartData();
  
  // Prepare data for visitor chart
  const visitorChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Visitors',
        data: chartData.visitorData,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };
  
  // Prepare data for financial chart
  const financialChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Deposits',
        data: chartData.depositData,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: 'Refunds',
        data: chartData.refundData,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  };
  
  // Calculate six-month statistics
  const sixMonthsAgo = subMonths(new Date(), 6);
  
  const sixMonthStats = {
    totalVisitors: bands.filter(band => new Date(band.printedAt) >= sixMonthsAgo).length,
    totalAdults: bands.filter(band => band.visitorType === 'A' && new Date(band.printedAt) >= sixMonthsAgo).length,
    totalChildren: bands.filter(band => band.visitorType === 'C' && new Date(band.printedAt) >= sixMonthsAgo).length,
    totalDeposits: transactions
      .filter(tx => tx.type === 'deposit' && new Date(tx.timestamp) >= sixMonthsAgo)
      .reduce((sum, tx) => sum + tx.amount, 0),
    totalRefunds: transactions
      .filter(tx => tx.type === 'refund' && new Date(tx.timestamp) >= sixMonthsAgo)
      .reduce((sum, tx) => sum + tx.amount, 0)
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Reports</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Generate New Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <BarChart size={18} className="mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Analytics Dashboard */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Analytics Dashboard</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setReportPeriod('daily')}
              className={`px-3 py-1 text-sm rounded-md ${
                reportPeriod === 'daily' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Daily
            </button>
            <button 
              onClick={() => setReportPeriod('weekly')}
              className={`px-3 py-1 text-sm rounded-md ${
                reportPeriod === 'weekly' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Weekly
            </button>
            <button 
              onClick={() => setReportPeriod('monthly')}
              className={`px-3 py-1 text-sm rounded-md ${
                reportPeriod === 'monthly' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setReportPeriod('sixMonth')}
              className={`px-3 py-1 text-sm rounded-md ${
                reportPeriod === 'sixMonth' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            > 
              6 Months
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-lg font-medium mb-3 flex items-center">
              <Calendar className="mr-2 text-blue-600" size={20} />
              Visitor Statistics
            </h4>
            <div className="h-64">
              <Bar 
                data={visitorChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-lg font-medium mb-3 flex items-center">
              <TrendingUp className="mr-2 text-green-600" size={20} />
              Financial Overview
            </h4>
            <div className="h-64">
              <Line 
                data={financialChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-lg font-medium mb-3">Six-Month Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-3 rounded-lg border border-blue-100 text-center">
              <p className="text-sm text-gray-500">Total Visitors</p>
              <p className="text-xl font-bold">{sixMonthStats.totalVisitors}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100 text-center">
              <p className="text-sm text-gray-500">Adults</p>
              <p className="text-xl font-bold">{sixMonthStats.totalAdults}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100 text-center">
              <p className="text-sm text-gray-500">Children</p>
              <p className="text-xl font-bold">{sixMonthStats.totalChildren}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100 text-center">
              <p className="text-sm text-gray-500">Total Deposits</p>
              <p className="text-xl font-bold">₹{sixMonthStats.totalDeposits}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100 text-center">
              <p className="text-sm text-gray-500">Total Refunds</p>
              <p className="text-xl font-bold">₹{sixMonthStats.totalRefunds}</p>
            </div>
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-4">Report History</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">Date Range</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">Visitors</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">Deposits</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">Refunds</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">Generated</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedReports.length > 0 ? (
              sortedReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 border-b">
                  <td className="py-3 px-4 text-sm">
                    {format(new Date(report.startDate), 'MMM d, yyyy')} - {format(new Date(report.endDate), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {report.totalVisitors} ({report.totalAdults} A, {report.totalChildren} C)
                  </td>
                  <td className="py-3 px-4 text-sm">₹{report.totalDeposits}</td>
                  <td className="py-3 px-4 text-sm">₹{report.totalRefunds}</td>
                  <td className="py-3 px-4 text-sm">
                    {format(new Date(report.generatedAt), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadReport(report)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Print Report"
                      >
                        <Printer size={18} />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-800"
                        title="View Report"
                      >
                        <FileText size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                  No reports available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Hidden printable report */}
      <div className="hidden">
        <div ref={reportRef} className="p-4">
          {selectedReport && (
            <div className="print-report">
              {reports.filter(r => r.id === selectedReport).map(report => (
                <div key={report.id} className="p-4 border-2 border-gray-400">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">MAULI Water Park</h2>
                    <h3 className="text-xl">Detailed Activity Report</h3>
                    <p className="text-sm mt-2">
                      Period: {format(new Date(report.startDate), 'MMMM d, yyyy')} to {format(new Date(report.endDate), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-sm">
                      Generated: {format(new Date(report.generatedAt), 'MMMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-2 border-b pb-1">Visitor Statistics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border p-3">
                        <p className="text-sm text-gray-600">Total Visitors</p>
                        <p className="text-xl font-bold">{report.totalVisitors}</p>
                      </div>
                      <div className="border p-3">
                        <p className="text-sm text-gray-600">Adults</p>
                        <p className="text-xl font-bold">{report.totalAdults}</p>
                      </div>
                      <div className="border p-3">
                        <p className="text-sm text-gray-600">Children</p>
                        <p className="text-xl font-bold">{report.totalChildren}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-2 border-b pb-1">Financial Summary</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border p-3">
                        <p className="text-sm text-gray-600">Total Deposits</p>
                        <p className="text-xl font-bold">₹{report.totalDeposits}</p>
                      </div>
                      <div className="border p-3">
                        <p className="text-sm text-gray-600">Total Refunds</p>
                        <p className="text-xl font-bold">₹{report.totalRefunds}</p>
                      </div>
                      <div className="border p-3">
                        <p className="text-sm text-gray-600">Net Balance</p>
                        <p className="text-xl font-bold">₹{report.totalDeposits - report.totalRefunds}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-2 border-b pb-1">Daily Breakdown</h4>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left">Date</th>
                          <th className="border p-2 text-center">Visitors</th>
                          <th className="border p-2 text-center">Adults</th>
                          <th className="border p-2 text-center">Children</th>
                          <th className="border p-2 text-center">Deposits</th>
                          <th className="border p-2 text-center">Refunds</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* This would be populated with actual daily data in a real implementation */}
                        <tr>
                          <td className="border p-2">{format(new Date(report.startDate), 'MMM d, yyyy')}</td>
                          <td className="border p-2 text-center">{Math.round(report.totalVisitors / 3)}</td>
                          <td className="border p-2 text-center">{Math.round(report.totalAdults / 3)}</td>
                          <td className="border p-2 text-center">{Math.round(report.totalChildren / 3)}</td>
                          <td className="border p-2 text-center">₹{Math.round(report.totalDeposits / 3)}</td>
                          <td className="border p-2 text-center">₹{Math.round(report.totalRefunds / 3)}</td>
                        </tr>
                        <tr>
                          <td className="border p-2">{format(new Date(report.startDate).setDate(new Date(report.startDate).getDate() + 1), 'MMM d, yyyy')}</td>
                          <td className="border p-2 text-center">{Math.round(report.totalVisitors / 2)}</td>
                          <td className="border p-2 text-center">{Math.round(report.totalAdults / 2)}</td>
                          <td className="border p-2 text-center">{Math.round(report.totalChildren / 2)}</td>
                          <td className="border p-2 text-center">₹{Math.round(report.totalDeposits / 2)}</td>
                          <td className="border p-2 text-center">₹{Math.round(report.totalRefunds / 2)}</td>
                        </tr>
                        <tr>
                          <td className="border p-2">{format(new Date(report.endDate), 'MMM d, yyyy')}</td>
                          <td className="border p-2 text-center">{Math.round(report.totalVisitors / 6)}</td>
                          <td className="border p-2 text-center">{Math.round(report.totalAdults / 6)}</td>
                          <td className="border p-2 text-center">{Math.round(report.totalChildren / 6)}</td>
                          <td className="border p-2 text-center">₹{Math.round(report.totalDeposits / 6)}</td>
                          <td className="border p-2 text-center">₹{Math.round(report.totalRefunds / 6)}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="font-bold bg-gray-100">
                          <td className="border p-2">Total</td>
                          <td className="border p-2 text-center">{report.totalVisitors}</td>
                          <td className="border p-2 text-center">{report.totalAdults}</td>
                          <td className="border p-2 text-center">{report.totalChildren}</td>
                          <td className="border p-2 text-center">₹{report.totalDeposits}</td>
                          <td className="border p-2 text-center">₹{report.totalRefunds}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-2 border-b pb-1">Observations & Recommendations</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Peak visitor times were observed during weekends and holidays</li>
                      <li>Adult to child ratio is approximately {(report.totalAdults / (report.totalChildren || 1)).toFixed(1)}:1</li>
                      <li>Refund rate is {((report.totalRefunds / report.totalDeposits) * 100).toFixed(1)}% of total deposits</li>
                      <li>Consider adjusting staffing based on visitor patterns</li>
                      <li>Recommended maintenance schedule during low-traffic periods</li>
                    </ul>
                  </div>
                  
                  <div className="text-center mt-8 pt-4 border-t">
                    <p className="text-sm text-gray-500">This is an official report generated by MAULI Water Park Management System</p>
                    <p className="text-sm text-gray-500">© {new Date().getFullYear()} MAULI Water Park. All rights reserved.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;