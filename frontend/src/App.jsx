import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';

// Simple placeholder components for now
const DashboardPlaceholder = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1>Dashboard</h1>
    <p>Welcome! You have successfully logged in and completed onboarding.</p>
  </div>
);

const OnboardingPlaceholder = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1>Profile Setup</h1>
    <p>Please complete your profile and preferences to start matching!</p>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Default route redirects to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes (We will add strict security to these later) */}
      <Route path="/dashboard" element={<DashboardPlaceholder />} />
      <Route path="/onboarding" element={<OnboardingPlaceholder />} />
    </Routes>
  );
}

export default App;