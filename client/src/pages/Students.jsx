import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Trash2, Users, Edit3 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [divFilter, setDivFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const location = useLocation();
  
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '', address: '', contactNumber: '', parentContact: '', assignedClass: '', totalFees: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    if (search) {
      setSearchTerm(search);
    }
  }, [location.search]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/students');
      setStudents(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get('/api/classes');
      setClasses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/students/${isEditing}`, {
          ...formData,
          totalFees: Number(formData.totalFees)
        });
      } else {
        await axios.post('/api/students', {
          ...formData,
          totalFees: Number(formData.totalFees)
        });
      }
      setShowForm(false);
      setIsEditing(null);
      setFormData({ fullName: '', address: '', contactNumber: '', parentContact: '', assignedClass: '', totalFees: '' });
      fetchStudents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditClick = (student) => {
    setIsEditing(student._id);
    setFormData({
      fullName: student.fullName,
      address: student.address,
      contactNumber: student.contactNumber,
      parentContact: student.parentContact || '',
      assignedClass: student.assignedClass?._id || '',
      totalFees: student.totalFees
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to permanently delete this student?')) {
      try {
        await axios.delete(`/api/students/${id}`);
        fetchStudents();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const filteredStudents = students.filter(s => {
    const fullClassName = s.assignedClass?.className || '';
    const baseClass = fullClassName.split(' (Div')[0];
    const division = fullClassName.match(/\((Div .*?)\)/)?.[1] || '';
    
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || s.contactNumber.includes(searchTerm);
    const matchesClass = classFilter === '' || baseClass === classFilter;
    const matchesDiv = divFilter === '' || division === divFilter;
    const matchesBatch = batchFilter === '' || s.assignedClass?.batchName === batchFilter;
    
    return matchesSearch && matchesClass && matchesDiv && matchesBatch;
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <div className="card-title text-[18px]">Student Directory</div>
          <div className="card-subtitle">Manage student enrollments and records.</div>
        </div>
        <button className="btn btn-primary w-full sm:w-auto" onClick={() => { 
          setShowForm(!showForm); 
          if(showForm) { setIsEditing(null); setFormData({ fullName: '', address: '', contactNumber: '', parentContact: '', assignedClass: '', totalFees: '' }); } 
        }}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Register Student'}
        </button>
      </div>

      {showForm && (
        <div className="chart-card" style={{ marginBottom: '20px' }}>
          <div className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEditing ? <Edit3 size={16} color="var(--accent)" /> : <Users size={16} color="var(--accent)" />}
            {isEditing ? 'Update Student Details' : 'New Student Registration'}
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group mb-0"><label className="form-label">Full Name</label><input type="text" className="form-control" placeholder="Student's name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required /></div>
            <div className="form-group mb-0"><label className="form-label">Contact Number</label><input type="text" className="form-control" placeholder="+91" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} required /></div>
            <div className="form-group mb-0"><label className="form-label">Parent Contact (Optional)</label><input type="text" className="form-control" placeholder="+91" value={formData.parentContact} onChange={e => setFormData({...formData, parentContact: e.target.value})} /></div>
            <div className="form-group mb-0"><label className="form-label">Residential Address</label><input type="text" className="form-control" placeholder="Full address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required /></div>
            <div className="form-group mb-0">
              <label className="form-label">Class & Batch Assignment</label>
              <select className="form-control" value={formData.assignedClass} onChange={e => setFormData({...formData, assignedClass: e.target.value})} required>
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.className} - {c.batchName}</option>)}
              </select>
            </div>
            <div className="form-group mb-0"><label className="form-label">Total Course Fees (₹)</label><input type="number" className="form-control" placeholder="0" value={formData.totalFees} onChange={e => setFormData({...formData, totalFees: e.target.value})} required /></div>
            <button type="submit" className="btn btn-primary md:col-span-2">
              {isEditing ? 'Save Changes' : 'Complete Enrollment'}
            </button>
          </form>
        </div>
      )}

      <div className="table-card" style={{ marginBottom: '20px' }}>
        <div className="table-header">
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <div className="search-box flex-1 w-full md:max-w-[400px]">
              <Search size={14} />
              <input 
                type="text" 
                placeholder="Search by student name or contact..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full bg-transparent border-none outline-none text-text1"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select 
                className="form-control w-full md:w-[130px] h-[34px] text-[13px] px-2.5 py-0" 
                value={classFilter}
                onChange={e => { setClassFilter(e.target.value); setDivFilter(''); }}
              >
                <option value="">All Classes</option>
                {[...new Set(classes.map(c => c.className.split(' (Div')[0]))].sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <select 
                className="form-control w-full md:w-[110px] h-[34px] text-[13px] px-2.5 py-0" 
                value={divFilter}
                onChange={e => setDivFilter(e.target.value)}
              >
                <option value="">All Div</option>
                {[...new Set(classes.map(c => c.className.match(/\((Div .*?)\)/)?.[1]).filter(Boolean))].sort().map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>

              <select 
                className="form-control w-full md:w-[130px] h-[34px] text-[13px] px-2.5 py-0" 
                value={batchFilter}
                onChange={e => setBatchFilter(e.target.value)}
              >
                <option value="">All Batches</option>
                {[...new Set(classes.map(c => c.batchName))].filter(Boolean).sort().map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">

        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Contact Info</th>
              <th>Batch Assigned</th>
              <th>Total Fees</th>
              <th>Pending Dues</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student._id}>
                <td>
                  <div className="student-cell">
                    <div className="avatar-sm" style={{ background: 'var(--accent2)' }}>
                      {student.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="student-name">{student.fullName}</div>
                      <div className="student-id">{student._id.substring(student._id.length - 6).toUpperCase()}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text2)' }}>{student.contactNumber}</td>
                <td><span className="class-tag">{student.assignedClass?.className} ({student.assignedClass?.batchName})</span></td>
                <td><span className="amount-cell">₹{student.totalFees.toLocaleString()}</span></td>
                <td>
                  <span className={`badge ${student.feesPending > 0 ? 'badge-amber' : 'badge-green'}`}>
                    ₹{student.feesPending.toLocaleString()}
                  </span>
                </td>
                 <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditClick(student)} className="btn" style={{ padding: '4px 8px', background: 'rgba(79, 124, 255, 0.1)', color: 'var(--accent)' }}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(student._id)} className="btn btn-danger" style={{ padding: '4px 8px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center p-10 text-text3">No students found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
