import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, CheckCircle, XCircle, Clock, FileDown, FileSpreadsheet, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function AttendanceReports() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, presentToday: 0, absentToday: 0, lateToday: 0, unmarkedToday: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchAttendance();
    } else {
      setStudents([]);
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get('/api/classes');
      setClasses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/attendance/stats');
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/attendance/class/${selectedClass}?date=${selectedDate}`);
      setStudents(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!selectedClass || !selectedDate) {
      alert("Please select a class and date to export.");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    const className = classes.find(c => c._id === selectedClass)?.className || '';
    const batchName = classes.find(c => c._id === selectedClass)?.batchName || '';
    doc.text(`Attendance Report: ${className} (${batchName})`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(selectedDate).toLocaleDateString('en-IN')}`, 14, 28);
    
    const tableColumn = ["Student Name", "Status", "Marked By"];
    const tableRows = students.map(s => [
      s.fullName,
      s.status || 'Not Marked',
      s.markedBy || 'N/A'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [79, 124, 255] }
    });
    
    doc.save(`Attendance_${className}_${selectedDate}.pdf`);
  };

  const exportToExcel = () => {
    if (!selectedClass || !selectedDate) {
      alert("Please select a class and date to export.");
      return;
    }
    const className = classes.find(c => c._id === selectedClass)?.className || '';
    const data = students.map(s => ({
      "Student Name": s.fullName,
      "Status": s.status || 'Not Marked',
      "Marked By": s.markedBy || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    worksheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }];
    XLSX.writeFile(workbook, `Attendance_${className}_${selectedDate}.xlsx`);
  };

  const classStats = {
    present: students.filter(s => s.status === 'Present').length,
    absent: students.filter(s => s.status === 'Absent').length,
    late: students.filter(s => s.status === 'Late').length,
    unmarked: students.filter(s => !s.status).length,
  };

  const pieData = [
    { name: 'Present', value: classStats.present, color: '#22d48f' },
    { name: 'Absent', value: classStats.absent, color: '#f04b4b' },
    { name: 'Late', value: classStats.late, color: '#f5a623' },
  ].filter(d => d.value > 0);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <div className="card-title text-[18px]">Attendance Reports</div>
          <div className="card-subtitle">Review attendance history, charts, and export records.</div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button className="btn" onClick={exportToPDF} style={{ background: 'rgba(79, 124, 255, 0.1)', color: 'var(--accent)' }}>
            <FileDown size={16} /> PDF
          </button>
          <button className="btn" onClick={exportToExcel} style={{ background: 'rgba(34, 212, 143, 0.1)', color: 'var(--green)' }}>
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card" style={{ background: 'rgba(79, 124, 255, 0.05)', border: '1px solid rgba(79, 124, 255, 0.1)' }}>
          <div className="stat-header">
            <div className="stat-title">Total Students</div>
            <div className="stat-icon" style={{ background: 'rgba(79, 124, 255, 0.1)', color: 'var(--accent)' }}><Users size={16} /></div>
          </div>
          <div className="stat-value text-accent">{stats.totalStudents}</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(34, 212, 143, 0.05)', border: '1px solid rgba(34, 212, 143, 0.1)' }}>
          <div className="stat-header">
            <div className="stat-title">Present Today</div>
            <div className="stat-icon" style={{ background: 'rgba(34, 212, 143, 0.1)', color: 'var(--green)' }}><CheckCircle size={16} /></div>
          </div>
          <div className="stat-value text-green">{stats.presentToday}</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(255, 71, 87, 0.05)', border: '1px solid rgba(255, 71, 87, 0.1)' }}>
          <div className="stat-header">
            <div className="stat-title">Absent Today</div>
            <div className="stat-icon" style={{ background: 'rgba(255, 71, 87, 0.1)', color: 'var(--red)' }}><XCircle size={16} /></div>
          </div>
          <div className="stat-value text-red">{stats.absentToday}</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(255, 165, 2, 0.05)', border: '1px solid rgba(255, 165, 2, 0.1)' }}>
          <div className="stat-header">
            <div className="stat-title">Late Today</div>
            <div className="stat-icon" style={{ background: 'rgba(255, 165, 2, 0.1)', color: 'var(--amber)' }}><Clock size={16} /></div>
          </div>
          <div className="stat-value text-amber">{stats.lateToday}</div>
        </div>
      </div>

      <div className="chart-card mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="form-label text-[12px] uppercase tracking-wider text-text3 mb-2 block">Select Class & Batch</label>
            <select className="form-control" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.className} - {c.batchName}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="form-label text-[12px] uppercase tracking-wider text-text3 mb-2 block">Select Date</label>
            <input type="date" className="form-control" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        {selectedClass && selectedDate && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-1">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-accent"/> Daily Distribution</h3>
              <div className="h-[200px] w-full flex justify-center items-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <span className="text-text3 text-sm">No data for this date</span>}
              </div>
              <div className="flex flex-col gap-2 mt-4">
                {pieData.map(d => (
                  <div key={d.name} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }}></span>{d.name}</div>
                    <div className="font-medium">{d.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-sm font-medium mb-4">Class Attendance Record</h3>
              {loading ? (
                <div className="text-center p-10 text-text3">Loading records...</div>
              ) : students.length > 0 ? (
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="data-table">
                    <thead className="sticky top-0 bg-card z-10 shadow-sm">
                      <tr>
                        <th>Student Name</th>
                        <th>Status</th>
                        <th>Marked By (Teacher)</th>
                        <th>Time Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => (
                        <tr key={student.studentId}>
                          <td className="font-medium text-[13px]">{student.fullName}</td>
                          <td>
                            <span className={`badge ${student.status === 'Present' ? 'badge-green' : student.status === 'Absent' ? 'badge-red' : student.status === 'Late' ? 'badge-amber' : 'bg-surface text-text3 border border-border'}`}>
                              {student.status || 'Not Marked'}
                            </span>
                          </td>
                          <td className="text-[13px] text-text2 flex items-center gap-2">
                            {student.markedBy !== 'N/A' && <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold">{student.markedBy.substring(0,1).toUpperCase()}</div>}
                            {student.markedBy}
                          </td>
                          <td className="text-[12px] text-text3 font-mono">
                            {student.updatedAt ? new Date(student.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-10 text-text3">No students found in this class.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
