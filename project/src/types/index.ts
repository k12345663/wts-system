export type UserRole = 'admin' | 'owner' | 'staff';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

export interface Band {
  id: string;
  code: string;
  visitorType: 'A' | 'C'; // A for Adult, C for Child
  depositAmount: number;
  printedBy: string;
  printedAt: Date;
  entryTime?: Date;
  exitTime?: Date;
  isActive: boolean;
  isRefunded: boolean;
}

export interface Transaction {
  id: string;
  bandId: string;
  type: 'deposit' | 'refund';
  amount: number;
  timestamp: Date;
  processedBy: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: Date;
}

export interface Report {
  id: string;
  startDate: Date;
  endDate: Date;
  totalVisitors: number;
  totalAdults: number;
  totalChildren: number;
  totalDeposits: number;
  totalRefunds: number;
  generatedBy: string;
  generatedAt: Date;
}

export interface ParkingRecord {
  id: string;
  vehicleNumber: string;
  entryTime: Date;
  exitTime?: Date;
  vehicleType: 'car' | 'bike' | 'bus' | 'other';
  associatedBandIds?: string[];
  isActive: boolean;
}