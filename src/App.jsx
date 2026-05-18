import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ResetPassword from './components/ResetPassword';
import InviteScreen from './components/InviteScreen';
import useStore from './store/useStore';

function App() {
  const user = useStore((state) => state.user);

  return (
    <SocketProvider>
      <div className="w-screen h-screen bg-deep text-primary overflow-hidden">
        <Router>
          <Routes>
            <Route path="/" element={user ? <Dashboard /> : <LandingPage />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/invite/:token" element={<InviteScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </div>
    </SocketProvider>
  );
}

export default App;
