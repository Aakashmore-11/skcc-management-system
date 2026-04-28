import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Calendar, Users, CheckCircle, XCircle, Clock, Save, FileDown, FileSpreadsheet, Search as SearchIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Attendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getLocalDate());

  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // { studentId: status }
  const [stats, setStats] = useState({ totalStudents: 0, presentToday: 0, absentToday: 0, lateToday: 0, unmarkedToday: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchAttendance();
    } else {
      setStudents([]);
      setAttendanceData({});
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
      const initialData = {};
      res.data.forEach(s => {
        if (s.status) {
          initialData[s.studentId] = s.status;
        }
      });
      setAttendanceData(initialData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAll = (status) => {
    const newData = {};
    students.forEach(s => {
      newData[s.studentId] = status;
    });
    setAttendanceData(newData);
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedDate) return;

    if (Object.keys(attendanceData).length < students.length) {
      setErrorMsg(`Please mark attendance for all students. ${students.length - Object.keys(attendanceData).length} left.`);
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    const confirmSubmit = window.confirm("Are you sure you want to submit attendance for this class?");
    if (!confirmSubmit) return;

    setLoading(true);
    const payloadData = Object.entries(attendanceData).map(([studentId, status]) => ({
      studentId,
      status
    }));

    try {
      await axios.post('/api/attendance/mark', {
        classId: selectedClass,
        date: selectedDate,
        attendanceData: payloadData
      });
      setSuccessMsg('Attendance submitted successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchStats();
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to save attendance. Please try again.');
      setTimeout(() => setErrorMsg(''), 4000);
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

    const tableColumn = ["Student Name", "Status"];
    const tableRows = students.map(s => [
      s.fullName,
      attendanceData[s.studentId] || 'Not Marked'
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

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="text-center sm:text-left">
          <div className="card-title text-[20px] sm:text-[22px]">Attendance Management</div>
          <div className="card-subtitle mt-1">Track and manage student daily attendance.</div>
        </div>
        <div className="flex gap-2">
          <button className="btn !py-2 !px-4" onClick={exportToPDF} style={{ background: 'rgba(79, 124, 255, 0.1)', color: 'var(--accent)' }}>
            <FileDown size={16} /> <span className="hidden sm:inline">Export PDF</span><span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="stat-card" style={{ background: 'rgba(79, 124, 255, 0.05)', border: '1px solid rgba(79, 124, 255, 0.1)' }}>
          <div className="stat-top">
            <div className="stat-label">Total Students</div>
            <div className="stat-icon" style={{ background: 'rgba(79, 124, 255, 0.1)', color: 'var(--accent)' }}>
              <Users size={16} />
            </div>
          </div>
          <div className="stat-value text-accent">{stats.totalStudents}</div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(34, 212, 143, 0.05)', border: '1px solid rgba(34, 212, 143, 0.1)' }}>
          <div className="stat-top">
            <div className="stat-label">Present Today</div>
            <div className="stat-icon" style={{ background: 'rgba(34, 212, 143, 0.1)', color: 'var(--green)' }}>
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="stat-value text-green">{stats.presentToday}</div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(255, 71, 87, 0.05)', border: '1px solid rgba(255, 71, 87, 0.1)' }}>
          <div className="stat-top">
            <div className="stat-label">Absent Today</div>
            <div className="stat-icon" style={{ background: 'rgba(255, 71, 87, 0.1)', color: 'var(--red)' }}>
              <XCircle size={16} />
            </div>
          </div>
          <div className="stat-value text-red">{stats.absentToday}</div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(255, 165, 2, 0.05)', border: '1px solid rgba(255, 165, 2, 0.1)' }}>
          <div className="stat-top">
            <div className="stat-label">Late Today</div>
            <div className="stat-icon" style={{ background: 'rgba(255, 165, 2, 0.1)', color: 'var(--amber)' }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="stat-value text-amber">{stats.lateToday}</div>
        </div>
      </div>

      {/* Filter and Table Section */}
      <div className="chart-card mb-6 p-4 sm:p-6 mx-1 sm:mx-0">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:flex-1 min-w-0">
            <label className="form-label text-[11px] sm:text-[12px] uppercase tracking-wider text-text3 mb-2 block">Select Class & Batch</label>
            <select
              className="form-control h-[38px] w-full max-w-full text-[13px] appearance-none"
              style={{ textOverflow: 'ellipsis' }}
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="">-- Select Class --</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.className} - {c.batchName}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:flex-1 min-w-0">
            <label className="form-label text-[11px] sm:text-[12px] uppercase tracking-wider text-text3 mb-2 block">Select Date</label>
            <input
              type="date"
              className="form-control h-[38px] w-full max-w-full text-[13px]"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={getLocalDate()}
            />
          </div>
        </div>

        {selectedClass && selectedDate && (
          <>
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red/10 border border-red/20 text-red text-sm font-medium flex items-center gap-2">
                <XCircle size={16} /> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-green/10 border border-green/20 text-green text-sm font-medium flex items-center gap-2">
                <CheckCircle size={16} /> {successMsg}
              </div>
            )}

            <div className="flex flex-col gap-4 mb-4 pb-4 border-b border-border">
              {/* Actions Row */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button className="btn flex-1 sm:flex-none text-[12px] !py-1.5 !px-3" onClick={() => markAll('Present')} style={{ background: 'rgba(34, 212, 143, 0.1)', color: 'var(--green)' }}>Mark All Present</button>
                  <button className="btn flex-1 sm:flex-none text-[12px] !py-1.5 !px-3" onClick={() => markAll('Absent')} style={{ background: 'rgba(255, 71, 87, 0.1)', color: 'var(--red)' }}>Mark All Absent</button>
                </div>
              </div>

              {/* Search Row */}
              <div className="relative w-full">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text3">
                  <SearchIcon size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Search students by name..."
                  className="form-control h-[40px] w-full pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center p-10 text-text3">Loading students...</div>
            ) : students.length > 0 ? (
              <>
                <div className="mt-2 border border-border rounded-lg overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[1fr,300px] px-4 py-3 bg-surface border-b border-border text-[11px] font-bold uppercase tracking-wider text-text3">
                    <div>Student Name</div>
                    <div className="text-center">Attendance Status</div>
                  </div>

                  <div className="divide-y divide-border/50">
                    {students.filter(student => student.fullName.toLowerCase().includes(searchQuery.toLowerCase())).map(student => (
                      <div key={student.studentId} className="grid grid-cols-[1fr,auto] sm:grid-cols-[1fr,300px] items-center px-4 py-3 hover:bg-surface/50 transition-colors gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="avatar-sm !w-8 !h-8 shrink-0" style={{ background: 'var(--accent2)' }}>
                            {student.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="font-medium text-text1 text-[14px] truncate leading-none">{student.fullName}</div>
                        </div>

                        {/* Desktop View: Original Radio Buttons */}
                        <div className="hidden sm:flex items-center justify-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name={`status-${student.studentId}`}
                              checked={attendanceData[student.studentId] === 'Present'}
                              onChange={() => handleStatusChange(student.studentId, 'Present')}
                              className="accent-green w-4 h-4"
                            />
                            <span className={`text-[13px] ${attendanceData[student.studentId] === 'Present' ? 'text-green font-medium' : 'text-text2'}`}>Present</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name={`status-${student.studentId}`}
                              checked={attendanceData[student.studentId] === 'Absent'}
                              onChange={() => handleStatusChange(student.studentId, 'Absent')}
                              className="accent-red w-4 h-4"
                            />
                            <span className={`text-[13px] ${attendanceData[student.studentId] === 'Absent' ? 'text-red font-medium' : 'text-text2'}`}>Absent</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name={`status-${student.studentId}`}
                              checked={attendanceData[student.studentId] === 'Late'}
                              onChange={() => handleStatusChange(student.studentId, 'Late')}
                              className="accent-amber w-4 h-4"
                            />
                            <span className={`text-[13px] ${attendanceData[student.studentId] === 'Late' ? 'text-amber font-medium' : 'text-text2'}`}>Late</span>
                          </label>
                        </div>

                        {/* Mobile View: One Button Cycling (P/A Only) */}
                        <div className="flex sm:hidden items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const current = attendanceData[student.studentId];
                              const next = current === 'Present' ? 'Absent' : 'Present';
                              handleStatusChange(student.studentId, next);
                            }}
                            className={`w-12 h-10 rounded-lg flex items-center justify-center font-bold text-[15px] transition-all duration-200 shadow-sm ${
                              attendanceData[student.studentId] === 'Present' ? 'bg-green text-white' :
                              attendanceData[student.studentId] === 'Absent' ? 'bg-red text-white' :
                              'bg-surface border border-border text-text3'
                            }`}
                          >
                            {attendanceData[student.studentId] === 'Present' ? 'P' :
                             attendanceData[student.studentId] === 'Absent' ? 'A' : '?'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {students.filter(student => student.fullName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="p-10 text-center text-text3">No students found in this class.</div>
                  )}
                </div>

                {/* Final Save Button at Bottom */}
                <div className="mt-6 flex justify-center sm:justify-end pb-4">
                  <button 
                    className="btn btn-primary h-[48px] w-full sm:w-auto px-12 text-[15px] shadow-lg shadow-accent/20" 
                    onClick={handleSave} 
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (
                      <>
                        <Save size={18} /> Complete & Save Attendance
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center p-10 text-text3">No students found in this class.</div>
            )}
        </>
      )}
      </div>
    </>
  );
}
