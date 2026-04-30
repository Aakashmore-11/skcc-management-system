import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { Download, Plus, Receipt, Search } from 'lucide-react';

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', amountPaid: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  useEffect(() => {
    fetchFees();
    fetchStudents();
  }, []);

  const fetchFees = async () => {
    try {
      const res = await axios.get('/api/fees');
      setFees(res.data.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)));
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message;
      alert("Failed to load fees: " + msg);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/students?limit=1000');
      setStudents(res.data.students);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message;
      alert("Failed to load students: " + msg);
    }
  };

  const handleRecordFee = async (e) => {
    e.preventDefault();
    
    const amount = Number(formData.amountPaid);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const student = students.find(s => s._id === formData.studentId);
    const studentName = student ? student.fullName : 'Unknown Student';

    const isConfirmed = window.confirm(
      `Confirm Payment Recording?\n\nStudent: ${studentName}\nAmount: ₹${amount.toLocaleString()}\n\nAre you sure you want to record this payment? This will update the student's pending balance.`
    );

    if (!isConfirmed) return;

    try {
      await axios.post('/api/fees', {
        studentId: formData.studentId,
        amountPaid: amount
      });
      setShowForm(false);
      setFormData({ studentId: '', amountPaid: '' });
      fetchFees();
      fetchStudents();
      setStudentSearch('');
      setShowStudentDropdown(false);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message;
      alert("Failed to record fee: " + msg);
    }
  };

  const generateReceipt = async (fee) => {
    const doc = new jsPDF();

    // Try to load Logo
    let img = null;
    try {
      img = new Image();
      img.src = '/logo.png';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    } catch (e) {
      console.warn('Logo not found or could not be loaded for watermark.');
      img = null;
    }

    const drawReceipt = (offsetY, copyType) => {
      // Outer Border
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.rect(10, offsetY + 5, 190, 140);

      // Header
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.setFont(undefined, 'bold');
      doc.text('Shekhar Kumar Coaching Classes', 105, offsetY + 16, null, null, 'center');

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.setFont(undefined, 'normal');
      doc.text('1,2,3 Mayur Society, Nilgiri, Limbayat, Surat.', 105, offsetY + 22, null, null, 'center');
      doc.text('9601905488 | 8866238407', 105, offsetY + 27, null, null, 'center');

      doc.setFontSize(11);
      doc.setTextColor(120, 120, 120);
      doc.setFont(undefined, 'bold');
      doc.text(`Official Fee Receipt Document - ${copyType}`, 105, offsetY + 34, null, null, 'center');

      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(15, offsetY + 38, 195, offsetY + 38);

      // Receipt Details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Receipt No: `, 15, offsetY + 46);
      doc.setFont(undefined, 'bold');
      doc.text(`${fee.receiptNumber}`, 35, offsetY + 46);

      doc.setFont(undefined, 'normal');
      doc.text(`Payment Date: `, 145, offsetY + 46);
      doc.setFont(undefined, 'bold');
      doc.text(`${new Date(fee.paymentDate).toLocaleDateString('en-IN')}`, 168, offsetY + 46);

      // Section Title: Student Info
      doc.setFillColor(245, 245, 250);
      doc.rect(15, offsetY + 50, 180, 8, 'F');
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('STUDENT INFORMATION', 20, offsetY + 55.5);

      // Student Details
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Name of Student:`, 20, offsetY + 65);
      doc.setFont(undefined, 'bold');
      doc.text(`${fee.student?.fullName || 'N/A'}`, 55, offsetY + 65);

      doc.setFont(undefined, 'normal');
      doc.text(`Mobile Number:`, 20, offsetY + 72);
      doc.setFont(undefined, 'bold');
      doc.text(`${fee.student?.contactNumber || 'N/A'}`, 55, offsetY + 72);

      doc.setFont(undefined, 'normal');
      const fullClassName = fee.student?.assignedClass?.className || 'N/A';
      const baseClass = fullClassName.split(' (Div')[0];
      const division = fullClassName.match(/\((Div .*?)\)/)?.[1] || 'N/A';

      doc.text(`Class:`, 125, offsetY + 65);
      doc.setFont(undefined, 'bold');
      doc.text(`${baseClass}`, 155, offsetY + 65);

      doc.setFont(undefined, 'normal');
      doc.text(`Division:`, 125, offsetY + 72);
      doc.setFont(undefined, 'bold');
      doc.text(`${division}`, 155, offsetY + 72);

      doc.setFont(undefined, 'normal');
      doc.text(`Batch Timing:`, 125, offsetY + 79);
      doc.setFont(undefined, 'bold');
      doc.text(`${fee.student?.assignedClass?.batchName || 'N/A'}`, 155, offsetY + 79);

      // Section Title: Payment Details
      doc.setFillColor(245, 245, 250);
      doc.rect(15, offsetY + 90, 180, 8, 'F');
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('TRANSACTION DETAILS', 20, offsetY + 95.5);

      // Payment Details
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Amount Paid:`, 20, offsetY + 107);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(34, 180, 120);
      doc.text(`INR ${fee.amountPaid.toLocaleString()}/-`, 50, offsetY + 107);

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Amount Due:`, 125, offsetY + 107);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(220, 80, 80);
      const dueDisplay = (fee.remainingBalance || 0) === 0 ? 'NIL' : `INR ${(fee.remainingBalance || 0).toLocaleString()}/-`;
      doc.text(dueDisplay, 150, offsetY + 107);

      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(15, offsetY + 120, 195, offsetY + 120);

      // Signature Area
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Authorized Signature / Stamp', 155, offsetY + 140, null, null, 'center');
      doc.setLineWidth(0.5);
      doc.setDrawColor(100, 100, 100);
      doc.line(130, offsetY + 135, 180, offsetY + 135);

      // Note
      doc.setFontSize(8);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('This is a computer generated receipt.', 105, offsetY + 140, null, null, 'center');

      if (img) {
        // Add watermark in the center
        doc.setGState(new doc.GState({ opacity: 0.12 }));
        // Center horizontally: (210 - 100) / 2 = 55
        // Center vertically in box: y = 5 + (140 - 100)/2 = 25
        doc.addImage(img, 'PNG', 55, offsetY + 28, 100, 100);
        doc.setGState(new doc.GState({ opacity: 1 })); // reset opacity
      }
    };

    // Draw Top Receipt
    drawReceipt(0, 'Student Copy');

    doc.save(`Receipt_${fee.receiptNumber}.pdf`);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <div className="card-title text-[18px]">Fees & Receipts</div>
          <div className="card-subtitle">Record payments and generate official receipts.</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              className="form-control pr-10 h-[38px]" 
              placeholder="Search receipts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text3" />
          </div>
          <button className="btn btn-primary w-full sm:w-auto" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> {showForm ? 'Cancel Transaction' : 'Record Payment'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="chart-card mb-5 max-w-[600px] w-full">
          <div className="card-title mb-4 flex items-center gap-2">
            <Receipt size={16} color="var(--accent)" /> New Transaction
          </div>
          <form onSubmit={handleRecordFee} className="flex flex-col gap-4">
            <div className="form-group relative">
              <label className="form-label">Select Student Account</label>
              <div className="relative">
                <input
                  type="text"
                  className="form-control pl-5 pr-12 py-3 rounded-full border-accent bg-surface/30 focus:bg-surface/50 transition-all border-2"
                  placeholder="Search student..."
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setShowStudentDropdown(true);
                    if (formData.studentId) setFormData({ ...formData, studentId: '' });
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                />
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text3" />
              </div>
              
              {showStudentDropdown && studentSearch && (
                <div className="absolute z-[100] w-full mt-2 bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto backdrop-blur-xl">
                  {students.filter(s => s.fullName.toLowerCase().includes(studentSearch.toLowerCase())).length > 0 ? (
                    students
                      .filter(s => s.fullName.toLowerCase().includes(studentSearch.toLowerCase()))
                      .map(s => (
                        <div 
                          key={s._id}
                          className="px-5 py-3 hover:bg-accent/20 cursor-pointer border-b border-white/5 last:border-0 transition-colors group"
                          onClick={() => {
                            setFormData({ ...formData, studentId: s._id });
                            setStudentSearch(s.fullName);
                            setShowStudentDropdown(false);
                          }}
                        >
                          <div className="font-medium text-text1 group-hover:text-accent transition-colors">{s.fullName}</div>
                          <div className="text-[10px] text-text3 uppercase mt-0.5 font-bold tracking-wider">
                            Pending Due: <span className={s.feesPending > 0 ? 'text-red' : 'text-green'}>₹{s.feesPending.toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="px-5 py-4 text-text3 italic text-sm text-center">No students found</div>
                  )}
                </div>
              )}
              {formData.studentId && (
                <div className="mt-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                  <span className="text-xs font-bold text-accent uppercase">Selected: {students.find(s => s._id === formData.studentId)?.fullName}</span>
                  <button type="button" onClick={() => { setFormData({ ...formData, studentId: '' }); setStudentSearch(''); }} className="text-text3 hover:text-red transition-colors">✕</button>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Amount Received (₹)</label>
              <input type="number" className="form-control" placeholder="0" value={formData.amountPaid} onChange={e => setFormData({ ...formData, amountPaid: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary">Confirm Payment</button>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="overflow-x-auto">
        <table className="data-table min-w-[500px]">
          <thead>
            <tr>
              <th>Receipt No.</th>
              <th>Student Name</th>
              <th>Amount Settled</th>
              <th>Transaction Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {fees.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-10 text-text3">No transactions found.</td>
              </tr>
            ) : fees.filter(fee => 
                fee.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                fee.receiptNumber?.toString().toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-10 text-text3">No receipts match your search.</td>
              </tr>
            ) : fees.filter(fee => 
                fee.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                fee.receiptNumber?.toString().toLowerCase().includes(searchTerm.toLowerCase())
              ).map(fee => (
              <tr key={fee._id}>
                <td><span className="student-id">{fee.receiptNumber}</span></td>
                <td><div className="student-name">{fee.student?.fullName || 'Unknown/Deleted'}</div></td>
                <td><span className="badge badge-green">₹{fee.amountPaid.toLocaleString()}</span></td>
                <td style={{ color: 'var(--text2)' }}>{new Date(fee.paymentDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td>
                  <button onClick={() => generateReceipt(fee)} className="btn" style={{ background: 'rgba(79, 124, 255, 0.1)', color: 'var(--accent)', padding: '4px 10px', fontSize: '11px' }}>
                    <Download size={12} /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
