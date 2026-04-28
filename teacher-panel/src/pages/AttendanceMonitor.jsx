import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Phone, Users, UserX, Calendar, BarChart3, ChevronRight, 
  Search, FileDown, FileSpreadsheet, ArrowLeft,
  CheckCircle, XCircle, Clock, TrendingUp, Info, AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Utility to get current date in YYYY-MM-DD format (Local)
const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const COLORS = {
  present: '#22d48f',
  absent: '#f04b4b',
  late: '#f5a623',
  unmarked: '#555d74'
};

export default function AttendanceMonitor() {
  const [activeTab, setActiveTab] = useState('absentees');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [absentees, setAbsentees] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (activeTab === 'absentees') {
      fetchAbsentees();
    } else if (activeTab === 'monthly' && selectedClass) {
      fetchMonthlyReport();
    }
  }, [activeTab, selectedClass, selectedDate, selectedMonth, selectedYear]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get('/api/classes');
      setClasses(res.data);
      if (res.data.length > 0) setSelectedClass(res.data[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAbsentees = async () => {
    setLoading(true);
    try {
      const classQuery = selectedClass ? `&classId=${selectedClass}` : '';
      const res = await axios.get(`/api/attendance/absentees?date=${selectedDate}${classQuery}`);
      setAbsentees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/attendance/report/monthly/${selectedClass}?month=${selectedMonth}&year=${selectedYear}`);
      setMonthlyData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      const res = await axios.get(`/api/attendance/student/${studentId}`);
      setSelectedStudent(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const className = classes.find(c => c._id === selectedClass)?.className || 'All Classes';
    
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(`Monthly Attendance Report`, 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Class: ${className} | Period: ${selectedMonth}/${selectedYear}`, 14, 32);

    const tableData = monthlyData.map(s => [
      s.fullName,
      s.stats.present,
      s.stats.absent,
      s.stats.late,
      `${s.stats.percentage}%`
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Student Name', 'Present', 'Absent', 'Late', 'Percentage']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: '#4f7cff' }
    });

    doc.save(`Attendance_Report_${className}_${selectedMonth}_${selectedYear}.pdf`);
  };

  const exportToExcel = () => {
    const className = classes.find(c => c._id === selectedClass)?.className || 'All';
    const data = monthlyData.map(s => ({
      "Student Name": s.fullName,
      "Present": s.stats.present,
      "Absent": s.stats.absent,
      "Late": s.stats.late,
      "Attendance %": s.stats.percentage
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Attendance");
    XLSX.writeFile(workbook, `Attendance_${className}_${selectedMonth}_${selectedYear}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30 p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text1">Attendance Monitor</h1>
            <p className="text-xs text-text2">Track patterns and monitor absentee performance</p>
          </div>
        </div>
        
        <div className="flex bg-surface p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab('absentees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'absentees' ? 'bg-card text-text1 shadow-sm' : 'text-text2 hover:text-text1'}`}
          >
            <UserX size={16} /> <span className="hidden sm:inline">Absentees</span>
          </button>
          <button 
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'monthly' ? 'bg-card text-text1 shadow-sm' : 'text-text2 hover:text-text1'}`}
          >
            <BarChart3 size={16} /> <span className="hidden sm:inline">Monthly Tracker</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'absentees' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-text3 font-bold ml-1">Filter Class</label>
              <select 
                className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.className} - {c.batchName}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-text3 font-bold ml-1">Select Date</label>
              <div className="relative group">
                <div className="flex items-center justify-between px-4 py-2.5 bg-card border border-border rounded-xl group-hover:border-border2 transition-all cursor-pointer">
                  <span className="text-sm font-medium text-text1">{selectedDate.split('-').reverse().join('-')}</span>
                  <Calendar size={16} className="text-text2" />
                </div>
                <input 
                  type="date" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  max={getLocalDate()}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-text3 font-bold ml-1">Search Absentees</label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-3 text-text3" />
                <input 
                  type="text"
                  placeholder="Search student name..."
                  className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Absentees List - Responsive Table/Cards */}
          <div className="bg-card/50 rounded-2xl border border-border overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-border bg-card/80 flex items-center justify-between">
              <h3 className="font-semibold text-text1 flex items-center gap-2 text-sm sm:text-base">
                <UserX size={18} className="text-red" /> 
                Absent Students ({absentees.filter(a => a.student.fullName.toLowerCase().includes(searchTerm.toLowerCase())).length})
              </h3>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface/50">
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-text3 font-bold">Student</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-text3 font-bold">Class</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-text3 font-bold">Mobile No.</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-text3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan="4" className="px-6 py-10 text-center text-text3 italic">Loading absentees...</td></tr>
                  ) : absentees.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-10 text-center text-text3 italic">No students marked absent</td></tr>
                  ) : absentees
                    .filter(a => a.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((absentee) => (
                    <tr key={absentee._id} className="hover:bg-surface/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red/10 text-red flex items-center justify-center text-xs font-bold">
                            {absentee.student.fullName[0]}
                          </div>
                          <span className="font-medium text-text1">{absentee.student.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-surface px-2 py-1 rounded border border-border text-text2">
                          {absentee.classId.className}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text2 text-sm">{absentee.student.mobileNo}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => fetchStudentDetails(absentee.student._id)}
                          className="p-2 text-text3 hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-border">
              {loading ? (
                <div className="px-4 py-10 text-center text-text3 italic text-sm">Loading absentees...</div>
              ) : absentees.length === 0 ? (
                <div className="px-4 py-10 text-center text-text3 italic text-sm">No students marked absent</div>
              ) : absentees
                .filter(a => a.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((absentee) => (
                <div key={absentee._id} className="p-4 flex items-center justify-between hover:bg-surface/30 transition-colors" onClick={() => fetchStudentDetails(absentee.student._id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red/10 text-red flex items-center justify-center text-sm font-bold">
                      {absentee.student.fullName[0]}
                    </div>
                    <div>
                      <div className="font-bold text-text1 text-sm">{absentee.student.fullName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-text3 uppercase font-bold">{absentee.classId.className}</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span className="text-[11px] text-text2">{absentee.student.mobileNo}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-text3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Monthly Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-end gap-3 sm:gap-4">
            <div className="lg:flex-1 space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-text3 font-bold ml-1">Select Class</label>
              <select 
                className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors h-[42px]"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                {classes.map(c => <option key={c._id} value={c._id}>{c.className} - {c.batchName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 lg:flex gap-3">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-text3 font-bold ml-1">Month</label>
                <select 
                  className="w-full lg:w-32 bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none h-[42px]"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                >
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-text3 font-bold ml-1">Year</label>
                <select 
                  className="w-full lg:w-28 bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none h-[42px]"
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 w-full lg:w-auto">
              <button onClick={exportToPDF} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 h-[42px] bg-accent/10 text-accent rounded-xl border border-accent/20 hover:bg-accent/20 transition-all text-sm font-bold">
                <FileDown size={18} /> <span className="lg:hidden">PDF</span>
              </button>
              <button onClick={exportToExcel} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 h-[42px] bg-green/10 text-green rounded-xl border border-green/20 hover:bg-green/20 transition-all text-sm font-bold">
                <FileSpreadsheet size={18} /> <span className="lg:hidden">Excel</span>
              </button>
            </div>
          </div>

          {/* Minimalist Performance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {loading ? (
              <div className="md:col-span-2 lg:col-span-3 text-center py-20 text-text3 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs uppercase tracking-widest opacity-60">Loading performance data...</span>
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-surface/30 rounded-2xl border border-border/50">
                <p className="text-sm text-text3 italic font-medium">No records found for this period</p>
              </div>
            ) : monthlyData.map((student, idx) => (
              <div 
                key={student.studentId} 
                className="bg-card/50 backdrop-blur-md rounded-2xl border border-border/60 p-4 hover:border-accent/40 hover:bg-card transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-base border border-accent/10 shrink-0">
                      {student.fullName[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-text1 text-[14px] group-hover:text-accent transition-colors truncate tracking-tight">{student.fullName}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-text3 font-medium uppercase tracking-wider">
                          Rate:
                        </span>
                        <span className={`text-[10px] font-bold ${student.stats.percentage > 75 ? 'text-green' : student.stats.percentage > 60 ? 'text-amber' : 'text-red'}`}>
                          {student.stats.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => fetchStudentDetails(student.studentId)}
                    className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-text2 hover:text-accent hover:bg-accent/10 transition-all border border-border group/btn"
                  >
                    <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-surface/40 rounded-xl p-2 border border-border/40 text-center">
                    <div className="text-[9px] text-text3 uppercase font-semibold mb-0.5 opacity-60">P</div>
                    <div className="text-sm font-bold text-green">{student.stats.present}</div>
                  </div>
                  <div className="bg-surface/40 rounded-xl p-2 border border-border/40 text-center">
                    <div className="text-[9px] text-text3 uppercase font-semibold mb-0.5 opacity-60">A</div>
                    <div className="text-sm font-bold text-red">{student.stats.absent}</div>
                  </div>
                  <div className="bg-surface/40 rounded-xl p-2 border border-border/40 text-center">
                    <div className="text-[9px] text-text3 uppercase font-semibold mb-0.5 opacity-60">L</div>
                    <div className="text-sm font-bold text-amber">{student.stats.late}</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] text-text3 font-bold uppercase tracking-wider px-0.5">
                    <span>Performance</span>
                    <span>{student.stats.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden border border-border/30">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        student.stats.percentage > 75 ? 'bg-green' : 
                        student.stats.percentage > 60 ? 'bg-amber' : 
                        'bg-red'
                      }`}
                      style={{ width: `${student.stats.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0f172a] w-full max-w-xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/50">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedStudent(null)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text3">
                  <ArrowLeft size={18} />
                </button>
                <h3 className="font-bold text-text1 text-base">Student Insights</h3>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text3">✕</button>
            </div>
            
            <div className="p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Minimal Clean Profile Header */}
              <div className="bg-surface/30 rounded-2xl border border-border/50 p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  {/* Compact Avatar */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-accent/10 flex items-center justify-center text-accent text-2xl font-bold border border-accent/20 shrink-0">
                    {selectedStudent.student.fullName[0]}
                  </div>
                  
                  {/* Main Info */}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-text1 truncate">{selectedStudent.student.fullName}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-lg bg-surface border border-border text-[10px] font-bold text-text2 uppercase">
                        {selectedStudent.student.className}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-surface border border-border text-[10px] font-bold text-text3 uppercase">
                        {selectedStudent.student.batchName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secondary Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-border/30">
                  <a 
                    href={`tel:${selectedStudent.student.mobileNo}`}
                    className="flex items-center gap-3 bg-card/30 p-3 rounded-xl border border-border/40 hover:border-accent/40 hover:bg-accent/5 transition-all group/call"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-text3 shrink-0 border border-border/50 group-hover/call:bg-accent group-hover/call:text-white transition-colors">
                      <Phone size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] text-text3 font-bold uppercase leading-none mb-1">Contact</p>
                      <p className="text-sm font-semibold text-text1">{selectedStudent.student.mobileNo}</p>
                    </div>
                    <div className="px-2 py-1 bg-accent/10 text-accent rounded text-[10px] font-bold opacity-0 group-hover/call:opacity-100 transition-opacity hidden sm:block">
                      CALL NOW
                    </div>
                  </a>
                  <div className="flex items-center gap-3 bg-red/5 p-3 rounded-xl border border-red/10">
                    <div className="w-8 h-8 rounded-lg bg-red/10 flex items-center justify-center text-red shrink-0 border border-red/10">
                      <AlertCircle size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] text-red/60 font-bold uppercase leading-none mb-1">Due Balance</p>
                      <p className="text-sm font-bold text-red">
                        {selectedStudent.student.feesPending > 0 ? `₹${selectedStudent.student.feesPending}` : 'NIL'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Statistics Grid - Compact */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-card/20 p-2.5 rounded-xl border border-border/50 text-center">
                  <div className="text-[9px] text-text3 font-bold uppercase mb-0.5">Total</div>
                  <div className="text-lg font-bold text-text1">{selectedStudent.stats.total}</div>
                </div>
                <div className="bg-green/5 p-2.5 rounded-xl border border-green/10 text-center">
                  <div className="text-[9px] text-green/60 font-bold uppercase mb-0.5">Present</div>
                  <div className="text-lg font-bold text-green">{selectedStudent.stats.present}</div>
                </div>
                <div className="bg-red/5 p-2.5 rounded-xl border border-red/10 text-center">
                  <div className="text-[9px] text-red/60 font-bold uppercase mb-0.5">Absent</div>
                  <div className="text-lg font-bold text-red">{selectedStudent.stats.absent}</div>
                </div>
                <div className="bg-accent/5 p-2.5 rounded-xl border border-accent/10 text-center">
                  <div className="text-[9px] text-accent font-bold uppercase mb-0.5">Rate</div>
                  <div className="text-lg font-bold text-accent">{selectedStudent.stats.percentage}%</div>
                </div>
              </div>

              {/* Attendance Heatmap / Timeline */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-bold text-text3 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={12} /> Recent 14 Days
                  </h4>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-start">
                  {selectedStudent.records.slice(0, 14).map((record, i) => (
                    <div key={i} className="w-8 h-10 rounded-lg flex flex-col items-center justify-center border border-border/60 group relative cursor-help bg-surface/20">
                      <div className={`w-1.5 h-1.5 rounded-full mb-1 ${record.status === 'Present' ? 'bg-green' : record.status === 'Absent' ? 'bg-red' : 'bg-amber'}`} />
                      <span className="text-[9px] font-bold text-text3">{new Date(record.date).getDate()}</span>
                      
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-50">
                        <div className="bg-bg border border-border px-2 py-1 rounded text-[9px] whitespace-nowrap shadow-xl">
                          <span className="font-bold">{new Date(record.date).toLocaleDateString()}</span>: <span className={record.status === 'Present' ? 'text-green' : 'text-red'}>{record.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table List */}
              <div className="bg-surface/30 rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-border/40">
                    {selectedStudent.records.slice(0, 5).map((record, i) => (
                      <tr key={i} className="text-[12px] hover:bg-white/[0.01] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono text-text2">{new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            record.status === 'Present' ? 'bg-green/10 text-green' : 
                            record.status === 'Absent' ? 'bg-red/10 text-red' : 'bg-amber/10 text-amber'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {record.status === 'Present' ? <TrendingUp size={14} className="inline text-green/60" /> : <div className="inline-block w-3 h-px bg-text3/30" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
