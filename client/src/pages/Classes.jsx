import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Library, Edit3 } from 'lucide-react';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  
  // Form state
  const [selectedClass, setSelectedClass] = useState('');
  const [division, setDivision] = useState('');
  const [stream, setStream] = useState('');
  const [year, setYear] = useState('');
  const [batchName, setBatchName] = useState('');
  const [fees, setFees] = useState('');

  const classOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'B.Com'];
  const divisionOptions = ['A', 'B', 'C', 'D', 'E'];
  const streamOptions = ['Arts', 'Commerce', 'Science'];
  const yearOptions = ['FY', 'SY', 'TY'];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/classes');
      setClasses(res.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalClassName = selectedClass === 'B.Com' ? 'B.Com' : `Class ${selectedClass}`;
    
    if (['11', '12'].includes(selectedClass) && stream) {
      finalClassName += ` - ${stream}`;
    }
    if (selectedClass === 'B.Com' && year) {
      finalClassName += ` - ${year}`;
    }
    if (selectedClass !== 'B.Com' && division) {
      finalClassName += ` (Div ${division})`;
    }

    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/classes/${isEditing}`, { 
          className: finalClassName, 
          batchName, 
          fees: Number(fees) 
        });
      } else {
        await axios.post('http://localhost:5000/api/classes', { 
          className: finalClassName, 
          batchName, 
          fees: Number(fees) 
        });
      }
      
      setIsEditing(null);
      setSelectedClass('');
      setDivision('');
      setStream('');
      setYear('');
      setBatchName('');
      setFees('');
      
      fetchClasses();
    } catch (error) {
      console.error('Error saving class:', error);
    }
  };

  const handleEditClick = (cls) => {
    setIsEditing(cls._id);
    // Simple parsing logic or just set values
    setBatchName(cls.batchName);
    setFees(cls.fees);
    // Note: className parsing is complex, better to let user re-select grade
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClass = async (id) => {
    if(window.confirm('Are you sure you want to delete this class?')) {
      try {
        await axios.delete(`http://localhost:5000/api/classes/${id}`);
        fetchClasses();
      } catch (error) {
        console.error('Error deleting class:', error);
      }
    }
  };

  const isStandardClass = selectedClass && selectedClass !== 'B.Com';
  const isHigherSecondary = ['11', '12'].includes(selectedClass);
  const isDegree = selectedClass === 'B.Com';

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <div className="card-title" style={{ fontSize: '18px' }}>Classes & Batches</div>
        <div className="card-subtitle">Configure academic classes and batch timings.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <div className="chart-card" style={{ alignSelf: 'start' }}>
          <div className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEditing ? <Edit3 size={16} color="var(--accent)" /> : <Library size={16} color="var(--accent)" />}
            {isEditing ? 'Edit Class Details' : 'Add New Class'}
          </div>
          <form onSubmit={handleSubmit}>
            
            <div className="form-group">
              <label className="form-label">Grade / Standard</label>
              <select className="form-control" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setDivision(''); setStream(''); setYear(''); }} required>
                <option value="">Select Grade</option>
                {classOptions.map(c => <option key={c} value={c}>{c === 'B.Com' ? 'B.Com' : `Class ${c}`}</option>)}
              </select>
            </div>

            {isDegree && (
              <div className="form-group">
                <label className="form-label">Degree Year</label>
                <select className="form-control" value={year} onChange={e => setYear(e.target.value)} required>
                  <option value="">Select Year</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}

            {isHigherSecondary && (
              <div className="form-group">
                <label className="form-label">Stream</label>
                <select className="form-control" value={stream} onChange={e => setStream(e.target.value)} required>
                  <option value="">Select Stream</option>
                  {streamOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {isStandardClass && (
              <div className="form-group">
                <label className="form-label">Division / Section</label>
                <select className="form-control" value={division} onChange={e => setDivision(e.target.value)} required>
                  <option value="">Select Division</option>
                  {divisionOptions.map(d => <option key={d} value={d}>Division {d}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Batch Timing/Name</label>
              <input type="text" className="form-control" placeholder="e.g. Morning Batch" value={batchName} onChange={e => setBatchName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Standard Base Fees (₹)</label>
              <input type="number" className="form-control" placeholder="e.g. 5000" value={fees} onChange={e => setFees(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              {isEditing ? <Edit3 size={16} /> : <Plus size={16} />} 
              {isEditing ? 'Update Class' : 'Create Class'}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '8px' }} onClick={() => { setIsEditing(null); setSelectedClass(''); setBatchName(''); setFees(''); }}>
                Cancel Edit
              </button>
            )}

          </form>
        </div>

        <div className="table-card" style={{ alignSelf: 'start' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Batch Timing</th>
                <th>Base Fees</th>
                <th>Enrolled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls._id}>
                  <td><div className="student-name">{cls.className}</div></td>
                  <td style={{ color: 'var(--text2)' }}>{cls.batchName}</td>
                  <td><span className="badge badge-green">₹{cls.fees.toLocaleString()}</span></td>
                  <td><span className="class-tag">{cls.totalStudents} students</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEditClick(cls)} className="btn" style={{ padding: '4px 8px', background: 'rgba(79, 124, 255, 0.1)', color: 'var(--accent)' }}>
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDeleteClass(cls._id)} className="btn btn-danger" style={{ padding: '4px 8px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>No classes found. Add one to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
