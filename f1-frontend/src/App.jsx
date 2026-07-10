import "./assets/App.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import DriversPage from './pages/DriversPage';
import CalendarPage from './pages/CalendarPage';
import NewsPage from './pages/NewsPage';
import TelemetryPage from './pages/TelemetryPage'; // <-- Telemetri import edildi

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
            <Route path="/news" element={<NewsPage/>} />
            <Route path="/telemetry" element={<TelemetryPage />} /> {/* <-- Telemetri rotası eklendi */}
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;