import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import DriversPage from './pages/DriversPage';
import CalendarPage from './pages/CalendarPage'; // Yeni sayfamız

function App() {
  return (
    <Router>
      <div className="app-layout">
        
        {/* Sol tarafta sabit kalacak menü */}
        <Sidebar />

        {/* Sağ tarafta URL'e göre değişecek dinamik içerik */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<DriversPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;