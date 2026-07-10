import React from 'react';

// Takım isimleri artık temizlenmiş halleriyle eşleşecek
const teamColors = {
  "Red Bull": "#3671C6",
  "Mercedes": "#27F4D2",
  "Ferrari": "#E8002D",
  "Aston Martin": "#229971", 
  "McLaren": "#FF8000",
  "Alpine": "#0093cc",
  "Williams": "#37BEDD",
  "Racing Bulls": "#6692FF", 
  "Kick Sauber": "#52E252",
  "Sauber": "#52E252",
  "Haas": "#E6002B", 
  "Audi": "#CC0000", 
  "Cadillac": "#00325b" 
};

function DriverCard({ driver, rank }) {
  // 1. AKILLI TEMİZLİK: "F1 Team" uzantılarını acımadan sil
  let displayTeam = driver.team.replace(" F1 Team", "").trim();

  // 2. ÖZEL İSİM MANİPÜLASYONLARI
  if (displayTeam.includes("Red Bull")) {
    displayTeam = "Red Bull"; // "Red Bull Racing" gelse bile yakalar
  } else if (displayTeam.includes("RB") || displayTeam === "RB F1 Team") {
    displayTeam = "Racing Bulls"; // VCARB / RB düzeltmesi
  }

  const teamColor = teamColors[displayTeam] || '#333333';

  // Podyum hesaplaması
  let podiumClass = "";
  let trophy = "";
  if (rank === 0) { podiumClass = "podium-1"; trophy = "👑"; }
  else if (rank === 1) { podiumClass = "podium-2"; trophy = "🥈"; }
  else if (rank === 2) { podiumClass = "podium-3"; trophy = "🥉"; }

  return (
    <div className={`driver-card ${podiumClass}`} style={{ '--team-color': teamColor }}>
      
      <div className="driver-info">
        <h2>{trophy} {driver.name}</h2>
        <span className="team-badge" style={{ backgroundColor: teamColor }}>
          {displayTeam}
        </span>
      </div>

      <div className="driver-points">
        <span className="points-number">{driver.points}</span>
        <span className="points-label">PTS</span>
      </div>

    </div>
  );
}

export default DriverCard;