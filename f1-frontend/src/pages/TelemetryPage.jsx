import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import '../assets/App.css'; // CSS dosyasının yeni konumu

// Takım Renkleri (Grafik çubuklarını takıma göre boyamak için)
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

// Tooltip (Mouse ile çubuğun üstüne gelince çıkan özel bilgi kutusu)
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#1e1f29', padding: '15px', border: `1px solid ${data.color}`, borderRadius: '8px', color: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1.1rem' }}>{data.name}</p>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#8d99ae', textTransform: 'uppercase', letterSpacing: '1px' }}>{data.displayTeam}</p>
        <p style={{ margin: 0, fontSize: '1.5rem', color: data.color, fontFamily: 'Orbitron, sans-serif' }}>
          {data.points} PTS
        </p>
      </div>
    );
  }
  return null;
};

function TelemetryPage() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Elasticsearch'ten tüm pilotları çekiyoruz
    axios.get('https://localhost:7231/api/Drivers')
      .then(response => {
        if (Array.isArray(response.data)) {
          // Gelen veriyi grafik motoru (Recharts) için hazırlıyoruz
          const formattedData = response.data.map(driver => {
            // Pit duvarında yaptığımız akıllı isim temizliğinin aynısı
            let displayTeam = driver.team.replace(" F1 Team", "").trim();
            if (displayTeam.includes("Red Bull")) {
              displayTeam = "Red Bull";
            } else if (displayTeam.includes("RB") || displayTeam === "RB F1 Team") {
              displayTeam = "Racing Bulls";
            }

            return {
              name: driver.name,
              points: driver.points,
              displayTeam: displayTeam,
              color: teamColors[displayTeam] || '#333333' // Sözlükte yoksa karbon gri
            };
          });

          // Çubuklar puan sırasına göre yüksekten düşüğe dizilsin
          formattedData.sort((a, b) => b.points - a.points);
          setChartData(formattedData);
        }
      })
      .catch(error => console.error('Telemetri veri hatası: ', error));
  }, []);

  return (
    <div className="telemetry-container">
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#fff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '2px' }}>Pilotlar Şampiyonası Analizi</h1>
        <p style={{ color: '#E8002D', fontWeight: 'bold', letterSpacing: '1px' }}>🔴 Canlı Telemetri Modülü</p>
      </div>
      
      <div className="chart-container" style={{ width: '100%', height: '550px', backgroundColor: '#2b2d42', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
            {/* Sadece yatay çizgilerden oluşan şeffaf bir arka plan ızgarası */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4a4e69" opacity={0.5} />
            
            {/* X Ekseni (Pilot İsimleri) - İsimler uzun olduğu için eğimli yazdırıyoruz */}
            <XAxis 
              dataKey="name" 
              stroke="#8d99ae" 
              tick={{ fill: '#8d99ae', fontSize: 12 }} 
              angle={-45} 
              textAnchor="end" 
              interval={0} 
              tickMargin={10}
            />
            
            {/* Y Ekseni (Puanlar) - Dijital telemetri fontuyla */}
            <YAxis 
              stroke="#8d99ae" 
              tick={{ fill: '#8d99ae', fontFamily: 'Orbitron, sans-serif', fontSize: 14 }} 
            />
            
            {/* Mouse ile üzerine gelince açılan kutu */}
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} // Çubuğun arkasındaki hover efekti
            />
            
            {/* Çubuklar (Bar) */}
            <Bar dataKey="points" radius={[6, 6, 0, 0]} animationDuration={1500}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TelemetryPage;