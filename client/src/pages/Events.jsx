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
      const res = await axios.get('http://localhost:5000/api/events');
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
      const res = await axios.get('http://localhost:5000/api/students');
      setStudents(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEventFees = async (eventId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/events/${eventId}/fees`);
      setEventFees(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEventExpenses = async (eventId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/events/${eventId}/expenses`);
      setEventExpenses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/events', {
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
        await axios.delete(`http://localhost:5000/api/events/${id}`);
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
      await axios.post('http://localhost:5000/api/events/fees', {
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
      await axios.post('http://localhost:5000/api/events/expenses', {
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
        await axios.delete(`http://localhost:5000/api/events/expenses/${id}`);
        fetchEventExpenses(selectedEventId);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const generateEventReceipt = (fee) => {
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setTextColor(79, 124, 255);
    doc.text('SKCC MANAGEMENT', 105, 25, null, null, 'center');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Official Event Fee Receipt', 105, 33, null, null, 'center');
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 40, 190, 40);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Receipt No: ${fee.receiptNumber}`, 20, 55);
    doc.text(`Date: ${new Date(fee.paymentDate).toLocaleDateString()}`, 140, 55);
    doc.setFillColor(245, 245, 250);
    doc.rect(20, 65, 170, 10, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('EVENT & STUDENT DETAILS', 25, 72);
    doc.setFont(undefined, 'normal');
    doc.text(`Event Name:`, 25, 85);
    doc.text(`${activeEvent?.eventName}`, 70, 85);
    doc.text(`Student Name:`, 25, 93);
    doc.text(`${fee.student?.fullName}`, 70, 93);
    doc.setFillColor(245, 245, 250);
    doc.rect(20, 110, 170, 10, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('PAYMENT DETAILS', 25, 117);
    doc.setFont(undefined, 'normal');
    doc.text(`Amount Paid:`, 25, 130);
    doc.setFontSize(14);
    doc.setTextColor(34, 212, 143);
    doc.text(`INR ${fee.amountPaid.toLocaleString()}/-`, 70, 130);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.text('Thank you for your participation!', 105, 160, null, null, 'center');
    doc.save(`Event_Receipt_${fee.receiptNumber}.pdf`);
  };

  const activeEvent = events.find(e => e._id === selectedEventId);

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
      s.assignedClass?.division || 'N/A',
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
      'Division': s.assignedClass?.division || 'N/A',
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
    const matchesDiv = finalDivFilter === '' || s.assignedClass?.division === finalDivFilter;

    return matchesSearch && matchesClass && matchesDiv;
  });

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <div className="card-title" style={{ fontSize: '18px' }}>Events & Functions</div>
        <div className="card-subtitle">Manage extra-curricular events and collect dedicated fees.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>

        {/* Left Column: Create Event */}
        <div>
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
            <table className="data-table">
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

        {/* Right Column: Manage Selected Event */}
        <div>
          {activeEvent ? (
            <>
              <div className="chart-card" style={{ marginBottom: '20px', borderTop: '3px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div className="card-title">{activeEvent.eventName} Registrations</div>
                    <div className="card-subtitle">Record student payments for this specific event.</div>
                  </div>
                  <div className="badge badge-amber" style={{ fontSize: '14px' }}>Event Fee: ₹{activeEvent.feeAmount}</div>
                </div>

                <form onSubmit={handlePayFee} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
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
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
                    <CheckCircle size={16} /> Collect
                  </button>
                </form>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Registrations List */}
                <div className="table-card">
                  <div className="table-header">
                    <span className="card-title">Registrations ({eventFees.length})</span>
                  </div>
                  <table className="data-table">
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
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text3)' }}>No registrations.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Expenses Manager */}
                <div className="table-card">
                  <div className="table-header">
                    <span className="card-title">Event Expenses</span>
                  </div>
                  <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                    <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" className="form-control" placeholder="Description..." value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} required style={{ flex: 1 }} />
                      <input type="number" className="form-control" placeholder="₹" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} required style={{ width: '80px' }} />
                      <button type="submit" className="btn btn-primary"><Plus size={14} /></button>
                    </form>
                  </div>
                  <table className="data-table">
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
                        <tr><td colSpan="2" style={{ textAlign: 'center', color: 'var(--text3)' }}>No expenses logged.</td></tr>
                      )}
                    </tbody>
                  </table>
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
        <div className="table-card" style={{ marginTop: '24px', borderTop: '3px solid var(--green)' }}>
          <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">Final Participant List</div>
              <div className="card-subtitle">Students who have fully cleared their participation fees.</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
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
                {[...new Set(students.map(s => s.assignedClass?.division).filter(Boolean))].sort().map(d => (
                  <option key={d} value={d}>Div {d}</option>
                ))}
              </select>

              <button className="btn" onClick={exportFinalListPDF} style={{ background: 'rgba(240,75,75,0.1)', color: 'var(--red)', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} /> PDF
              </button>
              <button className="btn" onClick={exportFinalListExcel} style={{ background: 'rgba(34,212,143,0.1)', color: 'var(--green)', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TableIcon size={14} /> Excel
              </button>
            </div>
          </div>
          <table className="data-table">
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
                  <td>{s.assignedClass?.division || 'N/A'}</td>
                  <td style={{ color: 'var(--text2)' }}>{s.contactNumber}</td>
                  <td><span className="badge badge-green" style={{ background: 'rgba(34,212,143,0.1)' }}>Full Payment Received</span></td>
                </tr>
              ))}
              {filteredFinalList.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>No matching students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
