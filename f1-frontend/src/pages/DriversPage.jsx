import "../assets/App.css";
import { useState, useEffect } from 'react';
import axios from 'axios';
import DriverList from '../components/DriverList';
import SearchBar from '../components/SearchBar';

function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(''); 

  // --- DEBOUNCE MOTORU ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- ELASTICSEARCH ZEKİ ARAMA VE VERİ ÇEKME ---
  useEffect(() => {
    if (debouncedSearch) {
      axios.get(`https://localhost:7231/api/Drivers/search?searchTerm=${debouncedSearch}`)
        .then(response => {
          setDrivers(response.data);
        })
        .catch(error => console.error("Arama hatası:", error));
    } else {
      fetchDrivers();
    }
  }, [debouncedSearch]);

  const fetchDrivers = () => {
    axios.get('https://localhost:7231/api/Drivers')
    .then(response => {
      console.log("BACKEND'DEN GELEN SAF VERİ:", response.data); 
      if (Array.isArray(response.data)){
        setDrivers(response.data);
      }
    })
    .catch(error => console.error('Veri çekme hatası: ', error));
  }

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>F1 Pit Duvarı</h1>
        <p className="live-data-badge">🔴 Canlı Veri (Ergast & Elasticsearch)</p>
      </div>

      {/* Artık DriverForm yok, tamamen sildik! */}
      <hr />

      <SearchBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* PİLOT LİSTESİ - Artık silme ve düzenleme yetkisi yok */}
      <DriverList
       drivers={[...drivers].sort((a, b) => b.points - a.points)}
       />
    </div>
  );
}

export default DriversPage;