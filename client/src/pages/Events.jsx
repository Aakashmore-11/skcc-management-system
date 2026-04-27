import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, PartyPopper, CheckCircle, Download, FileText, Table as TableIcon, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [eventFees, setEventFees] = useState([]);
  const [eventExpenses, setEventExpenses] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [finalListFilter, setFinalListFilter] = useState('');
  const [finalClassFilter, setFinalClassFilter] = useState('');
  const [finalDivFilter, setFinalDivFilter] = useState('');

  // Create Event Form
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [feeAmount, setFeeAmount] = useState('');

  // Pay Fee Form
  const [selectedStudent, setSelectedStudent] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  // Add Expense Form
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  useEffect(() => {
    fetchEvents();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventFees(selectedEventId);
      fetchEventExpenses(selectedEventId);
    } else {
      setEventFees([]);
      setEventExpenses([]);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/events');
      setEvents(res.data);
      if (res.data.length > 0 && !selectedEventId) {
        setSelectedEventId(res.data[0]._id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/students');
      setStudents(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEventFees = async (eventId) => {
    try {
      const res = await axios.get(`/api/events/${eventId}/fees`);
      setEventFees(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEventExpenses = async (eventId) => {
    try {
      const res = await axios.get(`/api/events/${eventId}/expenses`);
      setEventExpenses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/events', {
        eventName,
        eventDate,
        feeAmount: Number(feeAmount)
      });
      setEventName('');
      setEventDate('');
      setFeeAmount('');
      fetchEvents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event and all its fee records?')) {
      try {
        await axios.delete(`/api/events/${id}`);
        if (selectedEventId === id) setSelectedEventId('');
        fetchEvents();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handlePayFee = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/events/fees', {
        event: selectedEventId,
        student: selectedStudent,
        amountPaid: Number(amountPaid)
      });
      setSelectedStudent('');
      setAmountPaid('');
      fetchEventFees(selectedEventId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/events/expenses', {
        event: selectedEventId,
        description: expenseDescription,
        amount: Number(expenseAmount)
      });
      setExpenseDescription('');
      setExpenseAmount('');
      fetchEventExpenses(selectedEventId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Remove this expense record?')) {
      try {
        await axios.delete(`/api/events/expenses/${id}`);
        fetchEventExpenses(selectedEventId);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const generateEventReceipt = async (fee) => {
    const doc = new jsPDF();

    // Try to load Logo for watermark
    let img = null;
    try {
      img = new Image();
      img.src = '/logo.png';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    } catch (e) {
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
      doc.text(`Official Event Fee Receipt - ${copyType}`, 105, offsetY + 34, null, null, 'center');

      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(15, offsetY + 38, 195, offsetY + 38);

      // Receipt & Date row
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

      // Section: Student / Event Info
      doc.setFillColor(245, 245, 250);
      doc.rect(15, offsetY + 50, 180, 8, 'F');
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('EVENT & STUDENT INFORMATION', 20, offsetY + 55.5);

      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);

      // Left column
      doc.text(`Student Name:`, 20, offsetY + 65);
      doc.setFont(undefined, 'bold');
      doc.text(`${fee.student?.fullName || 'N/A'}`, 55, offsetY + 65);

      doc.setFont(undefined, 'normal');
      doc.text(`Mobile Number:`, 20, offsetY + 72);
      doc.setFont(undefined, 'bold');
      doc.text(`${fee.student?.contactNumber || 'N/A'}`, 55, offsetY + 72);

      // Right column
      const fullClassName = fee.student?.assignedClass?.className || 'N/A';
      const baseClass = fullClassName.split(' (Div')[0];
      const division = fullClassName.match(/\((Div .*?)\)/)?.[1] || 'N/A';

      doc.setFont(undefined, 'normal');
      doc.text(`Class:`, 125, offsetY + 65);
      doc.setFont(undefined, 'bold');
      doc.text(`${baseClass}`, 145, offsetY + 65);

      doc.setFont(undefined, 'normal');
      doc.text(`Division:`, 125, offsetY + 72);
      doc.setFont(undefined, 'bold');
      doc.text(`${division}`, 145, offsetY + 72);

      doc.setFont(undefined, 'normal');
      doc.text(`Event Name:`, 125, offsetY + 79);
      doc.setFont(undefined, 'bold');
      doc.text(`${activeEvent?.eventName || 'N/A'}`, 152, offsetY + 79);

      // Section: Payment Details
      doc.setFillColor(245, 245, 250);
      doc.rect(15, offsetY + 85, 180, 8, 'F');
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('PAYMENT DETAILS', 20, offsetY + 90.5);

      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Amount Paid:`, 20, offsetY + 102);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(34, 180, 120);
      doc.text(`INR ${fee.amountPaid.toLocaleString()}/-`, 50, offsetY + 102);

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Event Fee:`, 125, offsetY + 102);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(79, 124, 255);
      doc.text(`INR ${(activeEvent?.feeAmount || 0).toLocaleString()}/-`, 148, offsetY + 102);

      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(15, offsetY + 120, 195, offsetY + 120);

      // Signature
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Authorized Signature / Stamp', 155, offsetY + 140, null, null, 'center');
      doc.setLineWidth(0.5);
      doc.setDrawColor(100, 100, 100);
      doc.line(130, offsetY + 135, 180, offsetY + 135);

      // Footer note
      doc.setFontSize(8);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('This is a computer generated receipt.', 105, offsetY + 140, null, null, 'center');

      // Watermark
      if (img) {
        doc.setGState(new doc.GState({ opacity: 0.12 }));
        doc.addImage(img, 'PNG', 55, offsetY + 28, 100, 100);
        doc.setGState(new doc.GState({ opacity: 1 }));
      }
    };

    drawReceipt(0, 'Student Copy');
    doc.save(`Event_Receipt_${fee.receiptNumber}.pdf`);
  };

  const activeEvent = events.find(e => e._id === selectedEventId);

  // Class model stores division inside className, e.g. "Class 10 (Div A)"
  const parseDivision = (className) => {
    if (!className) return 'N/A';
    const match = className.match(/\(Div ([^)]+)\)/);
    return match ? match[1] : 'N/A';
  };

  const totalRevenue = eventFees.reduce((sum, f) => sum + f.amountPaid, 0);
  const totalExpense = eventExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpense;

  // Helper to get total a student paid for this event
  const getStudentPaidForEvent = (studentId) => {
    return eventFees
      .filter(fee => fee.student && (fee.student._id === studentId || fee.student === studentId))
      .reduce((sum, fee) => sum + fee.amountPaid, 0);
  };

  const availableStudents = students.filter(student => {
    if (!activeEvent) return false;
    const studentTotalPaid = getStudentPaidForEvent(student._id);
    return studentTotalPaid < activeEvent.feeAmount;
  });

  const exportFinalListPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(79, 124, 255);
    doc.text('SKCC MANAGEMENT', 105, 20, null, null, 'center');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Final Participant List: ${activeEvent?.eventName}`, 105, 30, null, null, 'center');

    const tableData = filteredFinalList.map(s => [
      s.fullName,
      s.assignedClass?.className || 'N/A',
      parseDivision(s.assignedClass?.className),
      s.contactNumber,
      'Paid'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Student Name', 'Class', 'Division', 'Mobile Number', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 124, 255] }
    });

    doc.save(`${activeEvent?.eventName}_Participants.pdf`);
  };

  const exportFinalListExcel = () => {
    const data = filteredFinalList.map(s => ({
      'Student Name': s.fullName,
      'Class': s.assignedClass?.className || 'N/A',
      'Division': parseDivision(s.assignedClass?.className),
      'Mobile Number': s.contactNumber,
      'Status': 'Fully Paid'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");
    XLSX.writeFile(workbook, `${activeEvent?.eventName}_Participants.xlsx`);
  };

  const filteredFinalList = students.filter(s => {
    const isPaid = getStudentPaidForEvent(s._id) >= (activeEvent?.feeAmount || 0);
    if (!isPaid) return false;

    const search = finalListFilter.toLowerCase();
    const matchesSearch = s.fullName.toLowerCase().includes(search);
    const matchesClass = finalClassFilter === '' || s.assignedClass?.className === finalClassFilter;
    const matchesDiv = finalDivFilter === '' || parseDivision(s.assignedClass?.className) === finalDivFilter;

    return matchesSearch && matchesClass && matchesDiv;
  });

  return (
    <>
      <div className="mb-6">
        <div className="card-title text-[18px]">Events & Functions</div>
        <div className="card-subtitle">Manage extra-curricular events and collect dedicated fees.</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left Column: Create Event */}
        <div className="lg:col-span-1">
          <div className="chart-card" style={{ marginBottom: '20px' }}>
            <div className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PartyPopper size={16} color="var(--accent)" /> Create New Event
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input type="text" className="form-control" placeholder="e.g. Annual Trip" value={eventName} onChange={e => setEventName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Event</label>
                <input type="date" className="form-control" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Participation Fee (₹)</label>
                <input type="number" className="form-control" placeholder="0" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={16} /> Add Event
              </button>
            </form>
          </div>

          <div className="table-card">
            <div className="table-header">
              <span className="card-title">Existing Events</span>
            </div>
            <div className="overflow-x-auto">
            <table className="data-table min-w-[300px]">
              <tbody>
                {events.map(ev => (
                  <tr key={ev._id} style={{ background: selectedEventId === ev._id ? 'var(--card)' : 'transparent', cursor: 'pointer' }} onClick={() => setSelectedEventId(ev._id)}>
                    <td>
                      <div style={{ fontWeight: selectedEventId === ev._id ? 600 : 500, color: selectedEventId === ev._id ? 'var(--accent)' : 'var(--text1)' }}>{ev.eventName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{new Date(ev.eventDate).toLocaleDateString()}</div>
                    </td>
                    <td><span className="badge badge-green">₹{ev.feeAmount}</span></td>
                    <td>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev._id); }} className="btn btn-danger" style={{ padding: '4px 8px' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text3)', padding: '20px' }}>No events found.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Right Column: Manage Selected Event */}
        <div className="lg:col-span-2">
          {activeEvent ? (
            <>
              <div className="chart-card border-t-4 border-accent mb-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div>
                    <div className="card-title">{activeEvent.eventName} Registrations</div>
                    <div className="card-subtitle">Record student payments for this specific event.</div>
                  </div>
                  <div className="badge badge-amber text-[14px]">Event Fee: ₹{activeEvent.feeAmount}</div>
                </div>

                <form onSubmit={handlePayFee} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Student</label>
                    <select className="form-control" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} required>
                      <option value="">Select a student...</option>
                      {availableStudents.map(s => {
                        const paid = getStudentPaidForEvent(s._id);
                        const due = activeEvent.feeAmount - paid;
                        return (
                          <option key={s._id} value={s._id}>
                            {s.fullName} {paid > 0 ? `(Remaining: ₹${due})` : `(Full Fee: ₹${activeEvent.feeAmount})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-group" style={{ width: '120px', marginBottom: 0 }}>
                    <label className="form-label">Amount (₹)</label>
                    <input type="number" className="form-control" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary w-full sm:w-auto px-4 py-2.5">
                    <CheckCircle size={16} /> Collect
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="stat-card card-blue" style={{ padding: '16px' }}>
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-value" style={{ fontSize: '20px' }}>₹{totalRevenue}</div>
                </div>
                <div className="stat-card card-red" style={{ padding: '16px' }}>
                  <div className="stat-label">Total Expenses</div>
                  <div className="stat-value" style={{ fontSize: '20px' }}>₹{totalExpense}</div>
                </div>
                <div className={`stat-card ${netProfit >= 0 ? 'card-green' : 'card-amber'}`} style={{ padding: '16px' }}>
                  <div className="stat-label">Net Balance</div>
                  <div className="stat-value" style={{ fontSize: '20px' }}>₹{netProfit}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* Registrations List */}
                <div className="table-card">
                  <div className="table-header">
                    <span className="card-title">Registrations ({eventFees.length})</span>
                  </div>
                  <div className="overflow-x-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="data-table min-w-[400px]">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Paid</th>
                        <th>Due</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventFees.map(fee => {
                        const studentPaid = getStudentPaidForEvent(fee.student?._id);
                        const pending = activeEvent.feeAmount - studentPaid;
                        return (
                          <tr key={fee._id}>
                            <td>
                              <div className="student-name" style={{ fontSize: '12px' }}>{fee.student?.fullName || 'N/A'}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{fee.receiptNumber}</div>
                            </td>
                            <td><span className="badge badge-green">₹{fee.amountPaid}</span></td>
                            <td><span style={{ fontSize: '12px', color: pending > 0 ? 'var(--amber)' : 'var(--text3)' }}>{pending > 0 ? `₹${pending}` : 'Cleared'}</span></td>
                            <td>
                              <button onClick={() => generateEventReceipt(fee)} className="btn" style={{ padding: '4px 6px', background: 'rgba(79,124,255,0.1)', color: 'var(--accent)' }}>
                                <Download size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {eventFees.length === 0 && (
                        <tr><td colSpan="4" className="text-center text-text3 p-6">No registrations.</td></tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>

                {/* Expenses Manager */}
                <div className="table-card">
                  <div className="table-header">
                    <span className="card-title">Event Expenses</span>
                  </div>
                  <div className="p-3 border-b border-border">
                    <form onSubmit={handleAddExpense} className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input type="text" className="form-control" style={{ flex: 3 }} placeholder="Expense description (e.g. Catering, Venue...)" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} required />
                        <input type="number" className="form-control" style={{ flex: 1 }} placeholder="Amount" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} required />
                        <button type="submit" className="btn btn-primary px-4"><Plus size={14} /></button>
                      </div>
                    </form>
                  </div>
                  <div className="overflow-x-auto">
                  <table className="data-table min-w-[300px]">
                    <thead>
                      <tr>
                        <th>Expense</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventExpenses.map(exp => (
                        <tr key={exp._id}>
                          <td style={{ fontSize: '12px' }}>{exp.description}</td>
                          <td><span className="badge badge-red">₹{exp.amount}</span></td>
                          <td>
                            <button onClick={() => handleDeleteExpense(exp._id)} className="btn btn-danger" style={{ padding: '4px 8px' }}>
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {eventExpenses.length === 0 && (
                        <tr><td colSpan="3" className="text-center text-text3 p-6">No expenses logged.</td></tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <PartyPopper size={48} color="var(--border2)" style={{ marginBottom: '16px' }} />
              <div className="card-title">No Event Selected</div>
              <div className="card-subtitle">Create or select an event from the list to manage its transactions.</div>
            </div>
          )}
        </div>
      </div>

      {activeEvent && (
        <div className="table-card mt-6 border-t-[3px] border-green">
          <div className="table-header flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="card-title">Final Participant List</div>
              <div className="card-subtitle">Students who have fully cleared their participation fees.</div>
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <div className="search-box" style={{ width: '180px' }}>
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search name..."
                  value={finalListFilter}
                  onChange={(e) => setFinalListFilter(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text1)', outline: 'none', fontSize: '12px' }}
                />
              </div>

              <select
                className="form-control"
                style={{ width: '100px', padding: '4px 8px', fontSize: '12px', height: '32px' }}
                value={finalClassFilter}
                onChange={e => setFinalClassFilter(e.target.value)}
              >
                <option value="">All Classes</option>
                {[...new Set(students.map(s => s.assignedClass?.className).filter(Boolean))].sort().map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>

              <select
                className="form-control"
                style={{ width: '90px', padding: '4px 8px', fontSize: '12px', height: '32px' }}
                value={finalDivFilter}
                onChange={e => setFinalDivFilter(e.target.value)}
              >
                <option value="">All Div</option>
                {[...new Set(students.map(s => parseDivision(s.assignedClass?.className)).filter(d => d !== 'N/A'))].sort().map(d => (
                  <option key={d} value={d}>Div {d}</option>
                ))}
              </select>

              <button className="btn bg-red/10 text-red px-3 py-1.5 text-xs flex items-center gap-1.5 w-full sm:w-auto justify-center" onClick={exportFinalListPDF}>
                <FileText size={14} /> PDF
              </button>
              <button className="btn bg-green/10 text-green px-3 py-1.5 text-xs flex items-center gap-1.5 w-full sm:w-auto justify-center" onClick={exportFinalListExcel}>
                <TableIcon size={14} /> Excel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="data-table min-w-[600px]">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Division</th>
                <th>Mobile Number</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredFinalList.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600 }}>{s.fullName}</td>
                  <td>{s.assignedClass?.className || 'N/A'}</td>
                  <td>{parseDivision(s.assignedClass?.className)}</td>
                  <td style={{ color: 'var(--text2)' }}>{s.contactNumber}</td>
                  <td><span className="badge badge-green" style={{ background: 'rgba(34,212,143,0.1)' }}>Full Payment Received</span></td>
                </tr>
              ))}
              {filteredFinalList.length === 0 && (
                <tr><td colSpan="5" className="text-center text-text3 p-10">No matching students found.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </>
  );
}
