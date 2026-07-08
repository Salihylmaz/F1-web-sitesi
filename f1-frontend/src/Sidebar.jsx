import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="sidebar">
      <h2 className="sidebar-logo">F1 HUB</h2>
      <nav className="sidebar-nav">
        {/* Sayfa yönlendirmeleri */}
        <Link to="/" className="nav-link">🏎️ Pilotlar</Link>
        <Link to="/calendar" className="nav-link">📅 Yarış Takvimi</Link>
      </nav>
    </div>
  );
}

export default Sidebar;