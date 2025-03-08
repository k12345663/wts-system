import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Band } from '../types';
import JsBarcode from 'jsbarcode';
import { Printer, Save, AlertCircle } from 'lucide-react';

const BandPrinting: React.FC = () => {
  const { addBand } = useData();
  const { currentUser } = useAuth();
  const [visitorType, setVisitorType] = useState<'A' | 'C'>('A');
  const [depositAmount, setDepositAmount] = useState<number>(50);
  const [quantity, setQuantity] = useState<number>(1);
  const [printedBands, setPrintedBands] = useState<Band[]>([]);
  const [parkName, setParkName] = useState<string>('MAULI');
  const [showPrintSuccess, setShowPrintSuccess] = useState(false);
  
  const bandRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Update deposit amount when visitor type changes
  useEffect(() => {
    setDepositAmount(visitorType === 'A' ? 50 : 30);
  }, [visitorType]);
  
  // Generate barcodes after bands are created
  useEffect(() => {
    if (printedBands.length > 0 && bandRef.current) {
      const barcodeElements = bandRef.current.querySelectorAll('.barcode-canvas');
      barcodeElements.forEach((element, index) => {
        if (element instanceof HTMLCanvasElement && printedBands[index]) {
          JsBarcode(element, printedBands[index].code, {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 5
          });
        }
      });
    }
  }, [printedBands]);
  
  const handlePrintBands = useReactToPrint({
    content: () => bandRef.current,
    onAfterPrint: () => {
      handlePrintReceipt();
    },
  });
  
  const handlePrintReceipt = useReactToPrint({
    content: () => receiptRef.current,
    onAfterPrint: () => {
      setShowPrintSuccess(true);
      setTimeout(() => {
        setShowPrintSuccess(false);
        setPrintedBands([]);
      }, 3000);
    },
  });
  
  const generateBands = () => {
    if (!currentUser) return;
    
    const newBands: Band[] = [];
    const currentDate = new Date();
    
    for (let i = 0; i < quantity; i++) {
      // Generate a unique code with date and time components
      const year = currentDate.getFullYear().toString().slice(-2);
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getDate().toString().padStart(2, '0');
      const hours = currentDate.getHours().toString().padStart(2, '0');
      const minutes = currentDate.getMinutes().toString().padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      
      // Format: [Type][YY][MM][DD][HH][MM][Random]
      const code = `${visitorType}${year}${month}${day}${hours}${minutes}${randomNum}`;
      
      const newBand = addBand({
        code,
        visitorType,
        depositAmount,
        printedBy: currentUser.id,
      });
      
      newBands.push(newBand);
    }
    
    setPrintedBands(newBands);
    
    // Trigger print dialog after a short delay to ensure barcodes are rendered
    setTimeout(() => {
      handlePrintBands();
    }, 500);
  };
  
  const calculateTotal = () => {
    return quantity * depositAmount;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Band Printing</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Visitor Type</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600"
                  checked={visitorType === 'A'}
                  onChange={() => setVisitorType('A')}
                />
                <span className="ml-2">Adult (₹50 deposit)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600"
                  checked={visitorType === 'C'}
                  onChange={() => setVisitorType('C')}
                />
                <span className="ml-2">Child (₹30 deposit)</span>
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Deposit Amount (₹)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              min={0}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={1}
              max={10}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Park Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={parkName}
              onChange={(e) => setParkName(e.target.value)}
            />
          </div>
          
          <button
            onClick={generateBands}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
          >
            <Printer className="mr-2" size={18} />
            Print Bands & Receipt
          </button>
          
          {showPrintSuccess && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded flex items-center">
              <Save className="mr-2" size={18} />
              Bands and receipt printed successfully!
            </div>
          )}
        </div>
        
        <div className="border-l pl-6">
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          <div className="bg-gray-100 p-4 rounded-md">
            <p className="mb-2">Visitor Type: {visitorType === 'A' ? 'Adult' : 'Child'}</p>
            <p className="mb-2">Deposit Amount: ₹{depositAmount}</p>
            <p className="mb-2">Quantity: {quantity}</p>
            <p className="mb-2">Total Deposit: ₹{calculateTotal()}</p>
            <p>Park Name: {parkName}</p>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-2">Instructions</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Select visitor type (Adult/Child)</li>
              <li>• Adjust deposit amount if needed</li>
              <li>• Enter quantity of bands to print</li>
              <li>• Click "Print Bands & Receipt" to generate</li>
              <li>• Bands are valid only for today</li>
              <li>• Deposit will be refunded upon exit</li>
            </ul>
          </div>
          
          <div className="mt-6 bg-yellow-50 border border-yellow-200 p-3 rounded-md flex items-start">
            <AlertCircle className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0" size={18} />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important:</p>
              <p>Each band has a unique barcode that will be scanned at entry and exit. Bands are active only for the day of issue.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden printable band content */}
      <div className="hidden">
        <div ref={bandRef} className="p-4">
          {printedBands.map((band) => (
            <div key={band.id} className="print-band mb-8 p-4 border-2 border-dashed border-gray-400 page-break-after">
              <div className="bg-red-700 text-white p-2 mb-4 flex justify-between items-center">
                <div className="border-2 border-black px-4 py-2 bg-white text-black font-bold text-xl">
                  {parkName}
                </div>
                <canvas className="barcode-canvas bg-white p-1"></canvas>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-bold text-lg">Water Park Entry Band</p>
                  <p>Date: {new Date(band.printedAt).toLocaleDateString()}</p>
                  <p>Type: {band.visitorType === 'A' ? 'Adult' : 'Child'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Deposit: ₹{band.depositAmount}</p>
                  <p>Band ID: {band.code}</p>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                <p>• Present this band for entry and exit</p>
                <p>• Deposit will be refunded upon exit</p>
                <p>• Valid only for {new Date(band.printedAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Hidden printable receipt content */}
      <div className="hidden">
        <div ref={receiptRef} className="p-4">
          <div className="print-receipt p-4 border-2 border-gray-400">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">{parkName} Water Park</h2>
              <p className="text-sm">Official Receipt</p>
              <p className="text-sm">{new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}</p>
            </div>
            
            <div className="mb-4">
              <p><strong>Staff:</strong> {currentUser?.name}</p>
              <p><strong>Receipt #:</strong> {Date.now().toString().slice(-8)}</p>
            </div>
            
            <table className="w-full mb-4 border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-400">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2">{visitorType === 'A' ? 'Adult' : 'Child'} Band Deposit</td>
                  <td className="text-center py-2">{quantity}</td>
                  <td className="text-right py-2">₹{depositAmount}</td>
                  <td className="text-right py-2">₹{calculateTotal()}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td colSpan={3} className="text-right py-2">Total Deposit:</td>
                  <td className="text-right py-2">₹{calculateTotal()}</td>
                </tr>
              </tfoot>
            </table>
            
            <div className="mb-4">
              <p className="font-bold">Band IDs:</p>
              <ul className="list-disc pl-5">
                {printedBands.map((band) => (
                  <li key={band.id}>{band.code} ({band.visitorType === 'A' ? 'Adult' : 'Child'})</li>
                ))}
              </ul>
            </div>
            
            <div className="text-xs text-gray-500 mt-6">
              <p>• Deposit will be refunded upon exit with valid band</p>
              <p>• Bands are valid only for today</p>
              <p>• Lost bands will result in forfeiture of deposit</p>
              <p>• Keep this receipt for your records</p>
            </div>
            
            <div className="text-center mt-6 pt-4 border-t border-gray-300">
              <p>Thank you for visiting {parkName} Water Park!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BandPrinting;