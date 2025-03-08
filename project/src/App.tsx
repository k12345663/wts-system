import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Components
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BandPrinting from './components/BandPrinting';
import EntryExitScanner from './components/EntryExitScanner';
import ActivityLogs from './components/ActivityLogs';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import Login from './pages/Login';

// Protected route component
const ProtectedRoute: React.FC<{ 
  element: React.ReactNode; 
  allowedRoles?: string[];
}> = ({ element, allowedRoles }) => {
  const { isAuthenticated, userRole } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" />;
  }
  
  return <>{element}</>;
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<Layout />}>
              <Route index element={
                <ProtectedRoute element={<Dashboard />} />
              } />
              
              <Route path="bands" element={
                <ProtectedRoute 
                  element={<BandPrinting />} 
                  allowedRoles={['staff', 'admin']} 
                />
              } />
              
              <Route path="entry-exit" element={
                <ProtectedRoute 
                  element={<EntryExitScanner />} 
                  allowedRoles={['staff', 'admin']} 
                />
              } />
              
              <Route path="activity" element={
                <ProtectedRoute 
                  element={<ActivityLogs />} 
                  allowedRoles={['admin', 'owner']} 
                />
              } />
              
              <Route path="reports" element={
                <ProtectedRoute 
                  element={<Reports />} 
                  allowedRoles={['admin', 'owner']} 
                />
              } />
              
              <Route path="users" element={
                <ProtectedRoute 
                  element={<UserManagement />} 
                  allowedRoles={['admin']} 
                />
              } />
            </Route>
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;