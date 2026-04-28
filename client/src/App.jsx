import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Students from './pages/Students';
import Fees from './pages/Fees';
import Classes from './pages/Classes';
import AttendanceReports from './pages/AttendanceReports';
import Teachers from './pages/Teachers';
import Events from './pages/Events';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import Cookies from 'js-cookie';
import axios from 'axios';

// Global axios configuration for authentication
axios.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const ProtectedRoute = ({ children }) => {
  const token = Cookies.get('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="fees" element={<Fees />} />
          <Route path="classes" element={<Classes />} />
          <Route path="attendance-reports" element={<AttendanceReports />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="events" element={<Events />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="reports" element={<Reports />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
