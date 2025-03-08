import { User, Band, Transaction, ActivityLog, Report } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
  },
  {
    id: '2',
    username: 'owner',
    password: 'owner123',
    role: 'owner',
    name: 'Park Owner'
  },
  {
    id: '3',
    username: 'staff1',
    password: 'staff123',
    role: 'staff',
    name: 'Staff Member 1'
  },
  {
    id: '4',
    username: 'staff2',
    password: 'staff123',
    role: 'staff',
    name: 'Staff Member 2'
  }
];

// Generate some mock bands
const generateMockBands = (): Band[] => {
  const bands: Band[] = [];
  const today = new Date();
  
  // Create 10 mock bands with different states
  for (let i = 1; i <= 10; i++) {
    const isAdult = i % 3 !== 0; // 2/3 are adults
    const depositAmount = isAdult ? 50 : 30;
    const staffId = i % 2 === 0 ? '3' : '4'; // Alternate between staff1 and staff2
    
    // Create different states for bands
    const isActive = i <= 7; // 7 active, 3 inactive
    const hasEntered = i <= 8; // 8 have entered, 2 haven't
    const hasExited = i <= 5; // 5 have exited, 5 haven't
    const isRefunded = i <= 3; // 3 refunded, 7 not refunded
    
    // Calculate times
    const printedAt = new Date(today);
    printedAt.setHours(today.getHours() - (10 - i)); // Spread throughout the day
    
    let entryTime: Date | undefined = undefined;
    if (hasEntered) {
      entryTime = new Date(printedAt);
      entryTime.setMinutes(printedAt.getMinutes() + 30); // Entry 30 mins after printing
    }
    
    let exitTime: Date | undefined = undefined;
    if (hasExited) {
      exitTime = new Date(entryTime!);
      exitTime.setHours(entryTime!.getHours() + 3); // Exit 3 hours after entry
    }
    
    bands.push({
      id: uuidv4(),
      code: `WP${String(i).padStart(4, '0')}`,
      visitorType: isAdult ? 'A' : 'C',
      depositAmount,
      printedBy: staffId,
      printedAt,
      entryTime,
      exitTime,
      isActive,
      isRefunded
    });
  }
  
  return bands;
};

// Generate mock transactions based on bands
const generateMockTransactions = (bands: Band[]): Transaction[] => {
  const transactions: Transaction[] = [];
  
  // For each band, create a deposit transaction
  bands.forEach(band => {
    // Deposit transaction
    transactions.push({
      id: uuidv4(),
      bandId: band.id,
      type: 'deposit',
      amount: band.depositAmount,
      timestamp: band.printedAt,
      processedBy: band.printedBy
    });
    
    // If refunded, add refund transaction
    if (band.isRefunded && band.exitTime) {
      transactions.push({
        id: uuidv4(),
        bandId: band.id,
        type: 'refund',
        amount: band.depositAmount,
        timestamp: band.exitTime,
        processedBy: band.printedBy
      });
    }
  });
  
  return transactions;
};

// Generate mock activity logs
const generateMockActivityLogs = (bands: Band[]): ActivityLog[] => {
  const logs: ActivityLog[] = [];
  
  // For each band, create activity logs
  bands.forEach(band => {
    // Band printed log
    logs.push({
      id: uuidv4(),
      userId: band.printedBy,
      action: 'Band Printed',
      details: `Band ${band.code} printed for ${band.visitorType === 'A' ? 'Adult' : 'Child'} with deposit of $${band.depositAmount}`,
      timestamp: band.printedAt
    });
    
    // Entry log
    if (band.entryTime) {
      logs.push({
        id: uuidv4(),
        userId: band.printedBy,
        action: 'Visitor Entry',
        details: `Band ${band.code} scanned for entry`,
        timestamp: band.entryTime
      });
    }
    
    // Exit log
    if (band.exitTime) {
      logs.push({
        id: uuidv4(),
        userId: band.printedBy,
        action: 'Visitor Exit',
        details: `Band ${band.code} scanned for exit`,
        timestamp: band.exitTime
      });
    }
    
    // Refund log
    if (band.isRefunded && band.exitTime) {
      logs.push({
        id: uuidv4(),
        userId: band.printedBy,
        action: 'Deposit Refunded',
        details: `Deposit of $${band.depositAmount} refunded for band ${band.code}`,
        timestamp: band.exitTime
      });
    }
  });
  
  // Add some system logs
  logs.push({
    id: uuidv4(),
    userId: '1', // Admin
    action: 'System Startup',
    details: 'Water Park Management System initialized',
    timestamp: new Date(new Date().setHours(0, 0, 0, 0)) // Start of day
  });
  
  logs.push({
    id: uuidv4(),
    userId: '2', // Owner
    action: 'Report Generated',
    details: 'Daily report generated for yesterday',
    timestamp: new Date(new Date().setHours(9, 0, 0, 0)) // 9 AM
  });
  
  return logs;
};

// Generate mock reports
const generateMockReports = (): Report[] => {
  const reports: Report[] = [];
  const today = new Date();
  
  // Yesterday's report
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(23, 59, 59, 999);
  
  reports.push({
    id: uuidv4(),
    startDate: yesterday,
    endDate: yesterdayEnd,
    totalVisitors: 85,
    totalAdults: 62,
    totalChildren: 23,
    totalDeposits: 3710, // 62*50 + 23*30
    totalRefunds: 3290, // 90% refund rate
    generatedBy: '2', // Owner
    generatedAt: new Date(today.setHours(9, 0, 0, 0)) // 9 AM today
  });
  
  // Last week report
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  lastWeekStart.setHours(0, 0, 0, 0);
  
  const lastWeekEnd = new Date(today);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  lastWeekEnd.setHours(23, 59, 59, 999);
  
  reports.push({
    id: uuidv4(),
    startDate: lastWeekStart,
    endDate: lastWeekEnd,
    totalVisitors: 612,
    totalAdults: 450,
    totalChildren: 162,
    totalDeposits: 27360, // 450*50 + 162*30
    totalRefunds: 24624, // 90% refund rate
    generatedBy: '2', // Owner
    generatedAt: new Date(today.setHours(10, 0, 0, 0)) // 10 AM today
  });
  
  return reports;
};

// Generate all mock data
export const mockBands = generateMockBands();
export const mockTransactions = generateMockTransactions(mockBands);
export const mockActivityLogs = generateMockActivityLogs(mockBands);
export const mockReports = generateMockReports();