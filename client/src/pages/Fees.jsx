import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { Download, Plus, Receipt } from 'lucide-react';

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', amountPaid: '' });

  useEffect(() => {
    fetchFees();
    fetchStudents();
  }, []);

  const fetchFees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/fees');
      setFees(res.data.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/students');
      setStudents(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRecordFee = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/fees', {
        studentId: formData.studentId,
        amountPaid: Number(formData.amountPaid)
      });
      setShowForm(false);
      setFormData({ studentId: '', amountPaid: '' });
      fetchFees();
      fetchStudents();
    } catch (error) {
      console.error(error);
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
      doc.text(`Class:`, 125, offsetY + 65);
      doc.setFont(undefined, 'bold');
      doc.text(`${fee.student?.assignedClass?.className || 'N/A'}`, 145, offsetY + 65);

      doc.setFont(undefined, 'normal');
      doc.text(`Division:`, 125, offsetY + 72);
      doc.setFont(undefined, 'bold');
      doc.text(`${fee.student?.assignedClass?.batchName || 'N/A'}`, 145, offsetY + 72);

      // Section Title: Payment Details
      doc.setFillColor(245, 245, 250);
      doc.rect(15, offsetY + 80, 180, 8, 'F');
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('TRANSACTION DETAILS', 20, offsetY + 85.5);

      // Payment Details
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Amount Paid:`, 20, offsetY + 97);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(34, 180, 120);
      doc.text(`INR ${fee.amountPaid.toLocaleString()}/-`, 50, offsetY + 97);

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Amount Due:`, 125, offsetY + 97);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(220, 80, 80);
      doc.text(`INR ${fee.student?.feesPending?.toLocaleString() || 0}/-`, 150, offsetY + 97);

      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(15, offsetY + 110, 195, offsetY + 110);

      // Signature Area
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Authorized Signature / Stamp', 155, offsetY + 130, null, null, 'center');
      doc.setLineWidth(0.5);
      doc.setDrawColor(100, 100, 100);
      doc.line(130, offsetY + 125, 180, offsetY + 125);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div className="card-title" style={{ fontSize: '18px' }}>Fees & Receipts</div>
          <div className="card-subtitle">Record payments and generate official receipts.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {showForm ? 'Cancel Transaction' : 'Record Payment'}
        </button>
      </div>

      {showForm && (
        <div className="chart-card" style={{ marginBottom: '20px', maxWidth: '600px' }}>
          <div className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={16} color="var(--accent)" /> New Transaction
          </div>
          <form onSubmit={handleRecordFee} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Select Student Account</label>
              <select className="form-control" value={formData.studentId} onChange={e => setFormData({ ...formData, studentId: e.target.value })} required>
                <option value="">-- Choose Student --</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.fullName} • (Pending Due: ₹{s.feesPending.toLocaleString()})
                  </option>
                ))}
              </select>
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
        <table className="data-table">
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
            {fees.map(fee => (
              <tr key={fee._id}>
                <td><span className="student-id">{fee.receiptNumber}</span></td>
                <td><div className="student-name">{fee.student?.fullName || 'Unknown/Deleted'}</div></td>
                <td><span className="badge badge-green">₹{fee.amountPaid.toLocaleString()}</span></td>
                <td style={{ color: 'var(--text2)' }}>{new Date(fee.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td>
                  <button onClick={() => generateReceipt(fee)} className="btn" style={{ background: 'rgba(79, 124, 255, 0.1)', color: 'var(--accent)', padding: '4px 10px', fontSize: '11px' }}>
                    <Download size={12} /> Download
                  </button>
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
