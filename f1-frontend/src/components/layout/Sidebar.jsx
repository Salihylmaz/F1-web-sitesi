import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>🏎️ F1 CENTER</h2>
      </div>
      
      <nav className="sidebar-nav">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          🏁 Pit Duvarı
        </Link>
        
        <Link 
          to="/telemetry" 
          className={`nav-link ${location.pathname === '/telemetry' ? 'active' : ''}`}
        >
          📈 Telemetri
        </Link>

        <Link 
          to="/calendar" 
          className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}
        >
          📅 Takvim
        </Link>

        <Link 
          to="/news" 
          className={`nav-link ${location.pathname === '/news' ? 'active' : ''}`}
        >
          📰 Haberler
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;