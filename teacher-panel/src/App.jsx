import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Attendance from './pages/Attendance';
import Cookies from 'js-cookie';
import axios from 'axios';

// Global axios configuration for authentication
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

axios.interceptors.request.use(
  (config) => {
    const token = Cookies.get('teacher_token');
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
  const token = Cookies.get('teacher_token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/attendance" />} />
          <Route path="attendance" element={<Attendance />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
