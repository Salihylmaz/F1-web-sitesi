import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../assets/App.css";

// API'dan gelen İngilizce ülke isimlerini bayrak emojileriyle eşleştiren sözlük
const countryFlags = {
  "Bahrain": "🇧🇭", "Saudi Arabia": "🇸🇦", "Australia": "🇦🇺", "Japan": "🇯🇵",
  "China": "🇨🇳", "USA": "🇺🇸", "United States": "🇺🇸", "Italy": "🇮🇹", "Monaco": "🇲🇨",
  "Canada": "🇨🇦", "Spain": "🇪🇸", "Austria": "🇦🇹", "UK": "🇬🇧", "Hungary": "🇭🇺",
  "Belgium": "🇧🇪", "Netherlands": "🇳🇱", "Singapore": "🇸🇬", "Azerbaijan": "🇦🇿",
  "Mexico": "🇲🇽", "Brazil": "🇧🇷", "Qatar": "🇶🇦", "UAE": "🇦🇪"
};

function CalendarPage() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextRace, setNextRace] = useState(null);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    axios.get('https://api.jolpi.ca/ergast/f1/current.json')
      .then(response => {
        const raceData = response.data.MRData.RaceTable.Races;
        setRaces(raceData);

        // Sıradaki yarışı bul
        const today = new Date();
        const upcomingRace = raceData.find(race => {
          const raceDate = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
          return raceDate >= today;
        });

        if (upcomingRace) {
          setNextRace(upcomingRace);
        }

        setLoading(false);
      })
      .catch(error => {
        console.error("Takvim verisi çekilirken hata oluştu:", error);
        setLoading(false);
      });
  }, []);

  // CANLI GERİ SAYIM MOTORU
  useEffect(() => {
    if (!nextRace) return;

    const targetDate = new Date(`${nextRace.date}T${nextRace.time || '00:00:00Z'}`).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setCountdown("YARIŞ BAŞLADI!");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown(`${days}G ${hours}S ${minutes}D ${seconds}SN`);
    }, 1000);

    return () => clearInterval(interval); // Bileşen ekrandan gidince sayacı durdur (Bellek sızıntısını önler)
  }, [nextRace]);

  const formatRaceDateTime = (dateStr, timeStr) => {
    const dateObj = new Date(`${dateStr}T${timeStr || '00:00:00Z'}`);
    const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const formattedTime = timeStr ? dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
    return { formattedDate, formattedTime };
  };

  const today = new Date();

  return (
    <div className="calendar-container">
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#fff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px', margin: 0 }}>Canlı Yarış Takvimi</h1>
        <p style={{ color: '#8d99ae', marginTop: '10px' }}>2026 Dünya Şampiyonası Turu</p>
      </div>

      {loading ? (
        <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
          <p className="loading-text">FIA Sunucularından takvim çekiliyor...</p>
        </div>
      ) : (
        <div className="modern-races-grid">
          {races.map((race) => {
            const { formattedDate, formattedTime } = formatRaceDateTime(race.date, race.time);
            const isNextRace = nextRace && race.round === nextRace.round;
            
            // Tarih kontrolü ile yarışın bitip bitmediğini anlıyoruz
            const raceDateObj = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
            const isPastRace = raceDateObj < today && !isNextRace;
            
            // Sprint yarışı var mı? (Ergast API'ında Sprint objesi dolu geliyorsa Sprint haftasıdır)
            const hasSprint = !!race.Sprint;
            
            // Ülke bayrağını sözlükten bul
            const countryName = race.Circuit.Location.country;
            const flag = countryFlags[countryName] || "🏁";

            return (
              <div 
                key={race.round} 
                className={`modern-race-card ${isNextRace ? 'highlighted-race' : ''} ${isPastRace ? 'past-race' : ''}`}
              >
                
                {/* SIRADAKİ YARIŞ BANNER'I VE CANLI SAYAC */}
                {isNextRace && (
                  <div className="status-banner">
                    <span className="pulsing-dot">🔴</span> SIRADAKİ YARIŞ | <span className="live-countdown">{countdown}</span>
                  </div>
                )}

                <div className="card-header">
                  <div className="badges-wrapper">
                    <span className="round-badge">Round {race.round}</span>
                    {hasSprint && <span className="sprint-badge">🔥 SPRINT</span>}
                    {isPastRace && <span className="completed-badge">🏁 TAMAMLANDI</span>}
                  </div>
                  <span className="race-date">
                    {formattedDate} {formattedTime && `• ${formattedTime}`}
                  </span>
                </div>

                <div className="card-body">
                  <h3>{flag} {race.raceName}</h3>
                  <p>{race.Circuit.circuitName}, {countryName}</p>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CalendarPage;