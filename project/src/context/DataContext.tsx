import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Band, Transaction, ActivityLog, Report } from '../types';
import { mockBands, mockTransactions, mockActivityLogs, mockReports } from '../data/mockData';
import { useAuth } from './AuthContext';

interface DataContextType {
  bands: Band[];
  transactions: Transaction[];
  activityLogs: ActivityLog[];
  reports: Report[];
  addBand: (band: Omit<Band, 'id' | 'printedAt' | 'isActive' | 'isRefunded'>) => Band;
  updateBand: (bandId: string, updates: Partial<Band>) => void;
  recordEntry: (bandId: string) => void;
  recordExit: (bandId: string) => void;
  processRefund: (bandId: string) => void;
  addActivityLog: (action: string, details: string) => void;
  generateReport: (startDate: Date, endDate: Date) => Report;
  getBandsByStaff: (staffId: string) => Band[];
  getActiveBands: () => Band[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bands, setBands] = useState<Band[]>(mockBands);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [reports, setReports] = useState<Report[]>(mockReports);
  const { currentUser } = useAuth();

  // Sync with localStorage
  useEffect(() => {
    const savedBands = localStorage.getItem('bands');
    const savedTransactions = localStorage.getItem('transactions');
    const savedActivityLogs = localStorage.getItem('activityLogs');
    const savedReports = localStorage.getItem('reports');

    if (savedBands) setBands(JSON.parse(savedBands));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedActivityLogs) setActivityLogs(JSON.parse(savedActivityLogs));
    if (savedReports) setReports(JSON.parse(savedReports));
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('bands', JSON.stringify(bands));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
    localStorage.setItem('reports', JSON.stringify(reports));
  }, [bands, transactions, activityLogs, reports]);

  const addBand = (bandData: Omit<Band, 'id' | 'printedAt' | 'isActive' | 'isRefunded'>) => {
    const newBand: Band = {
      id: uuidv4(),
      ...bandData,
      printedAt: new Date(),
      isActive: true,
      isRefunded: false
    };

    setBands((prev) => [...prev, newBand]);
    
    // Add transaction for deposit
    const newTransaction: Transaction = {
      id: uuidv4(),
      bandId: newBand.id,
      type: 'deposit',
      amount: newBand.depositAmount,
      timestamp: new Date(),
      processedBy: bandData.printedBy
    };
    
    setTransactions((prev) => [...prev, newTransaction]);
    
    // Log activity
    addActivityLog(
      'Band Printed',
      `Band ${newBand.code} printed for ${newBand.visitorType === 'A' ? 'Adult' : 'Child'} with deposit of $${newBand.depositAmount}`
    );
    
    return newBand;
  };

  const updateBand = (bandId: string, updates: Partial<Band>) => {
    setBands((prev) =>
      prev.map((band) => (band.id === bandId ? { ...band, ...updates } : band))
    );
  };

  const recordEntry = (bandId: string) => {
    const band = bands.find((b) => b.id === bandId);
    if (band && !band.entryTime) {
      updateBand(bandId, { entryTime: new Date() });
      addActivityLog(
        'Visitor Entry',
        `Band ${band.code} scanned for entry`
      );
    }
  };

  const recordExit = (bandId: string) => {
    const band = bands.find((b) => b.id === bandId);
    if (band && band.entryTime && !band.exitTime) {
      updateBand(bandId, { exitTime: new Date() });
      addActivityLog(
        'Visitor Exit',
        `Band ${band.code} scanned for exit`
      );
    }
  };

  const processRefund = (bandId: string) => {
    const band = bands.find((b) => b.id === bandId);
    if (band && band.exitTime && !band.isRefunded) {
      updateBand(bandId, { isRefunded: true, isActive: false });
      
      // Add transaction for refund
      const newTransaction: Transaction = {
        id: uuidv4(),
        bandId: band.id,
        type: 'refund',
        amount: band.depositAmount,
        timestamp: new Date(),
        processedBy: currentUser?.id || 'system'
      };
      
      setTransactions((prev) => [...prev, newTransaction]);
      
      addActivityLog(
        'Deposit Refunded',
        `Deposit of $${band.depositAmount} refunded for band ${band.code}`
      );
    }
  };

  const addActivityLog = (action: string, details: string) => {
    const newLog: ActivityLog = {
      id: uuidv4(),
      userId: currentUser?.id || 'system',
      action,
      details,
      timestamp: new Date()
    };
    
    setActivityLogs((prev) => [...prev, newLog]);
  };

  const generateReport = (startDate: Date, endDate: Date) => {
    // Filter data for the date range
    const filteredBands = bands.filter(
      (band) => band.printedAt >= startDate && band.printedAt <= endDate
    );
    
    const filteredTransactions = transactions.filter(
      (tx) => tx.timestamp >= startDate && tx.timestamp <= endDate
    );
    
    // Calculate report metrics
    const totalVisitors = filteredBands.length;
    const totalAdults = filteredBands.filter((b) => b.visitorType === 'A').length;
    const totalChildren = filteredBands.filter((b) => b.visitorType === 'C').length;
    const totalDeposits = filteredTransactions
      .filter((tx) => tx.type === 'deposit')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalRefunds = filteredTransactions
      .filter((tx) => tx.type === 'refund')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    // Create report
    const newReport: Report = {
      id: uuidv4(),
      startDate,
      endDate,
      totalVisitors,
      totalAdults,
      totalChildren,
      totalDeposits,
      totalRefunds,
      generatedBy: currentUser?.id || 'system',
      generatedAt: new Date()
    };
    
    setReports((prev) => [...prev, newReport]);
    
    addActivityLog(
      'Report Generated',
      `Report generated for period ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
    );
    
    return newReport;
  };

  const getBandsByStaff = (staffId: string) => {
    return bands.filter((band) => band.printedBy === staffId);
  };

  const getActiveBands = () => {
    return bands.filter((band) => band.isActive);
  };

  return (
    <DataContext.Provider
      value={{
        bands,
        transactions,
        activityLogs,
        reports,
        addBand,
        updateBand,
        recordEntry,
        recordExit,
        processRefund,
        addActivityLog,
        generateReport,
        getBandsByStaff,
        getActiveBands
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};