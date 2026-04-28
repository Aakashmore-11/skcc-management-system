import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Trash2, Edit3, Shield, Key } from 'lucide-react';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', username: '', password: '', role: 'Teacher', isActive: true
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('/api/teachers');
      setTeachers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // If password is empty string, don't send it so backend doesn't update it
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await axios.put(`/api/teachers/${isEditing}`, payload);
      } else {
        await axios.post('/api/teachers', formData);
      }
      setShowForm(false);
      setIsEditing(null);
      setFormData({ name: '', username: '', password: '', role: 'Teacher', isActive: true });
      fetchTeachers();
    } catch (error) {
      alert(error.response?.data?.msg || 'Error saving teacher');
    }
  };

  const handleEditClick = (teacher) => {
    setIsEditing(teacher._id);
    setFormData({
      name: teacher.name,
      username: teacher.username,
      password: '', // Blank by default when editing
      role: teacher.role,
      isActive: teacher.isActive
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to permanently delete this teacher account?')) {
      try {
        await axios.delete(`/api/teachers/${id}`);
        fetchTeachers();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <div className="card-title text-[18px]">Teacher Management</div>
          <div className="card-subtitle">Manage credentials and access control for teachers.</div>
        </div>
        <button className="btn btn-primary" onClick={() => { 
          setShowForm(!showForm); 
          if(showForm) { 
            setIsEditing(null); 
            setFormData({ name: '', username: '', password: '', role: 'Teacher', isActive: true }); 
          } 
        }}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Add Teacher'}
        </button>
      </div>

      {showForm && (
        <div className="chart-card" style={{ marginBottom: '20px' }}>
          <div className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEditing ? <Edit3 size={16} color="var(--accent)" /> : <Shield size={16} color="var(--accent)" />}
            {isEditing ? 'Update Teacher Credentials' : 'Create Teacher Account'}
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" placeholder="Teacher's full name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Username</label>
              <input type="text" className="form-control" placeholder="e.g. jdoe123" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required={!isEditing} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Password {isEditing && <span className="text-text3 normal-case text-xs">(Leave blank to keep current)</span>}</label>
              <input type="password" className="form-control" placeholder="Secure password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!isEditing} minLength="6" />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Role</label>
              <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="Teacher">Teacher</option>
                <option value="Senior Teacher">Senior Teacher</option>
              </select>
            </div>
            <div className="form-group mb-0 flex items-center gap-3">
              <label className="form-label mb-0">Account Status</label>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input type="checkbox" className="sr-only peer" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green border border-border"></div>
                <span className="ml-3 text-sm font-medium text-text2">{formData.isActive ? 'Active' : 'Inactive'}</span>
              </label>
            </div>
            
            <button type="submit" className="btn btn-primary md:col-span-2 mt-2">
              {isEditing ? 'Save Changes' : 'Create Account'}
            </button>
          </form>
        </div>
      )}

      <div className="table-card" style={{ marginBottom: '20px' }}>
        <div className="table-header">
          <div className="search-box w-full md:max-w-[400px]">
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Search teachers by name or username..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full bg-transparent border-none outline-none text-text1"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map(teacher => (
                <tr key={teacher._id}>
                  <td>
                    <div className="student-cell">
                      <div className="avatar-sm" style={{ background: 'var(--accent)' }}>
                        {teacher.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="student-name">{teacher.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{teacher.username}</td>
                  <td><span className="class-tag">{teacher.role}</span></td>
                  <td>
                    <span className={`badge ${teacher.isActive ? 'badge-green' : 'badge-red'}`}>
                      {teacher.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEditClick(teacher)} className="btn" style={{ padding: '4px 8px', background: 'rgba(79, 124, 255, 0.1)', color: 'var(--accent)' }}>
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(teacher._id)} className="btn btn-danger" style={{ padding: '4px 8px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center p-10 text-text3">No teachers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
