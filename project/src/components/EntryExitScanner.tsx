import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Band } from '../types';
import { CheckCircle, XCircle, AlertCircle, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const EntryExitScanner: React.FC = () => {
  const { bands, recordEntry, recordExit, processRefund } = useData();
  const [scanCode, setScanCode] = useState('');
  const [scanType, setScanType] = useState<'entry' | 'exit'>('entry');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    band?: Band;
  } | null>(null);
  const [showPrintSuccess, setShowPrintSuccess] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrintReceipt = useReactToPrint({
    content: () => receiptRef.current,
    onAfterPrint: () => {
      setShowPrintSuccess(true);
      setTimeout(() => {
        setShowPrintSuccess(false);
      }, 3000);
    },
  });

  const handleScan = () => {
    if (!scanCode.trim()) {
      setScanResult({
        success: false,
        message: 'Please enter a band code',
      });
      return;
    }

    // Find the band with the given code
    const band = bands.find((b) => b.code === scanCode);

    if (!band) {
      setScanResult({
        success: false,
        message: 'Band not found',
      });
      return;
    }

    if (!band.isActive) {
      setScanResult({
        success: false,
        message: 'Band is inactive',
        band,
      });
      return;
    }

    // Check if band is from today
    const today = new Date().toDateString();
    const bandDate = new Date(band.printedAt).toDateString();
    
    if (bandDate !== today) {
      setScanResult({
        success: false,
        message: 'Band is expired (not from today)',
        band,
      });
      return;
    }

    if (scanType === 'entry') {
      // Entry validation
      if (band.entryTime) {
        setScanResult({
          success: false,
          message: 'Band already used for entry',
          band,
        });
        return;
      }

      // Record entry
      recordEntry(band.id);
      setScanResult({
        success: true,
        message: 'Entry recorded successfully',
        band,
      });
    } else {
      // Exit validation
      if (!band.entryTime) {
        setScanResult({
          success: false,
          message: 'Band has not been used for entry',
          band,
        });
        return;
      }

      if (band.exitTime) {
        setScanResult({
          success: false,
          message: 'Band already used for exit',
          band,
        });
        return;
      }

      // Record exit
      recordExit(band.id);
      
      // Process refund
      processRefund(band.id);
      
      setScanResult({
        success: true,
        message: 'Exit recorded and deposit refunded',
        band,
      });
      
      // Print refund receipt
      setTimeout(() => {
        handlePrintReceipt();
      }, 500);
    }

    // Clear the scan code after processing
    setScanCode('');
  };

  // Auto-focus the input field
  useEffect(() => {
    const inputElement = document.getElementById('scan-input');
    if (inputElement) {
      inputElement.focus();
    }
  }, [scanType]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Entry/Exit Scanner</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Scan Type</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600"
                  checked={scanType === 'entry'}
                  onChange={() => setScanType('entry')}
                />
                <span className="ml-2">Entry</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600"
                  checked={scanType === 'exit'}
                  onChange={() => setScanType('exit')}
                />
                <span className="ml-2">Exit</span>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Band Code</label>
            <div className="flex">
              <input
                id="scan-input"
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                placeholder="Scan or enter band code"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleScan();
                  }
                }}
              />
              <button
                onClick={handleScan}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md focus:outline-none focus:shadow-outline"
              >
                Scan
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Press Enter after scanning or click the Scan button
            </p>
          </div>
          
          {showPrintSuccess && scanType === 'exit' && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded flex items-center">
              <Printer className="mr-2" size={18} />
              Refund receipt printed successfully!
            </div>
          )}
        </div>

        <div className="border-l pl-6">
          <h3 className="text-lg font-semibold mb-4">Scan Result</h3>
          
          {scanResult ? (
            <div className={`p-4 rounded-md ${
              scanResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                {scanResult.success ? (
                  <CheckCircle className="text-green-500 mr-2 flex-shrink-0" size={20} />
                ) : (
                  <XCircle className="text-red-500 mr-2 flex-shrink-0" size={20} />
                )}
                <div>
                  <p className={`font-medium ${
                    scanResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {scanResult.message}
                  </p>
                  
                  {scanResult.band && (
                    <div className="mt-2 text-sm">
                      <p>Code: {scanResult.band.code}</p>
                      <p>Type: {scanResult.band.visitorType === 'A' ? 'Adult' : 'Child'}</p>
                      <p>Deposit: ₹{scanResult.band.depositAmount}</p>
                      <p>Printed: {new Date(scanResult.band.printedAt).toLocaleString()}</p>
                      {scanResult.band.entryTime && (
                        <p>Entry: {new Date(scanResult.band.entryTime).toLocaleTimeString()}</p>
                      )}
                      {scanResult.band.exitTime && (
                        <p>Exit: {new Date(scanResult.band.exitTime).toLocaleTimeString()}</p>
                      )}
                      {scanResult.success && scanType === 'exit' && (
                        <button
                          onClick={handlePrintReceipt}
                          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded flex items-center"
                        >
                          <Printer size={14} className="mr-1" />
                          Print Refund Receipt
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-md flex items-center">
              <AlertCircle className="text-gray-400 mr-2" size={20} />
              <p className="text-gray-500">No scan performed yet</p>
            </div>
          )}
          
          <div className="mt-6">
            <h4 className="font-medium mb-2">Instructions</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Select Entry or Exit scan type</li>
              <li>• Scan the band barcode or enter the code manually</li>
              <li>• For Exit scans, deposit will be automatically refunded</li>
              <li>• A refund receipt will be printed for exit scans</li>
              <li>• Verify visitor details after scanning</li>
            </ul>
          </div>
          
          <div className="mt-6 bg-blue-50 border border-blue-200 p-3 rounded-md">
            <p className="text-sm text-blue-800 font-medium">Today's Statistics</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-white p-2 rounded border border-blue-100">
                <p className="text-xs text-gray-500">Entries</p>
                <p className="font-bold">{bands.filter(b => b.entryTime && new Date(b.entryTime).toDateString() === new Date().toDateString()).length}</p>
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <p className="text-xs text-gray-500">Exits</p>
                <p className="font-bold">{bands.filter(b => b.exitTime && new Date(b.exitTime).toDateString() === new Date().toDateString()).length}</p>
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <p className="text-xs text-gray-500">Active Bands</p>
                <p className="font-bold">{bands.filter(b => b.isActive && b.entryTime && !b.exitTime).length}</p>
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <p className="text-xs text-gray-500">Refunds Processed</p>
                <p className="font-bold">{bands.filter(b => b.isRefunded && new Date(b.exitTime!).toDateString() === new Date().toDateString()).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden printable refund receipt */}
      <div className="hidden">
        <div ref={receiptRef} className="p-4">
          {scanResult && scanResult.success && scanType === 'exit' && scanResult.band && (
            <div className="print-receipt p-4 border-2 border-gray-400">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">MAULI Water Park</h2>
                <p className="text-sm">Refund Receipt</p>
                <p className="text-sm">{new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}</p>
              </div>
              
              <div className="mb-4">
                <p><strong>Receipt #:</strong> REF-{Date.now().toString().slice(-8)}</p>
                <p><strong>Band ID:</strong> {scanResult.band.code}</p>
              </div>
              
              <table className="w-full mb-4 border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-400">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-2">Deposit Refund ({scanResult.band.visitorType === 'A' ? 'Adult' : 'Child'} Band)</td>
                    <td className="text-right py-2">₹{scanResult.band.depositAmount}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className="text-right py-2">Total Refund:</td>
                    <td className="text-right py-2">₹{scanResult.band.depositAmount}</td>
                  </tr>
                </tfoot>
              </table>
              
              <div className="mb-4">
                <p><strong>Entry Time:</strong> {scanResult.band.entryTime ? new Date(scanResult.band.entryTime).toLocaleTimeString() : 'N/A'}</p>
                <p><strong>Exit Time:</strong> {scanResult.band.exitTime ? new Date(scanResult.band.exitTime).toLocaleTimeString() : 'N/A'}</p>
              </div>
              
              <div className="text-xs text-gray-500 mt-6">
                <p>• This receipt confirms the refund of your deposit</p>
                <p>• The band has been deactivated</p>
                <p>• Thank you for visiting MAULI Water Park</p>
              </div>
              
              <div className="text-center mt-6 pt-4 border-t border-gray-300">
                <p>Visit Again Soon!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntryExitScanner;