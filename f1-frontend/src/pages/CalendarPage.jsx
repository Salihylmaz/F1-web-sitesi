import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css'; 

function CalendarPage() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('https://api.jolpi.ca/ergast/f1/current.json')
      .then(response => {
        const raceData = response.data.MRData.RaceTable.Races;
        setRaces(raceData);
        setLoading(false);
      })
      .catch(error => {
        console.error("Takvim verisi çekilirken hata oluştu:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="calendar-container">
      <h1 className="calendar-title">Canlı Yarış Takvimi</h1>

      {loading ? (
        <p className="loading-text">FIA Sunucularından takvim çekiliyor...</p>
      ) : (
        <div className="races-grid">
          {races.map((race) => (
            <div key={race.round} className="race-card">
              <div className="race-info">
                <h3>{race.raceName}</h3>
                <p>{race.Circuit.circuitName}</p>
              </div>
              <div className="race-time">
                <div className="date">{race.date}</div>
                <div className="time">{race.time ? race.time.replace('Z', ' (UTC)') : 'Saat Belirsiz'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CalendarPage;