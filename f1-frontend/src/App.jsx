import './App.css'
import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {

  const [drivers, setDrivers] = useState([])

  const [newName, setNewName] = useState('')
  const [newTeam, setNewTeam] = useState('')
  const [newPoints, setNewPoints] = useState('')

  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = () => {
    axios.get('https://localhost:7231/api/Drivers')
    .then(response => {
      if (Array.isArray(response.data)){
        setDrivers(response.data)
      }
    })
    .catch(error => console.error('Veri çekme hatası: ', error))
  }

  const handleAddDriver = (e) => {
    e.preventDefault()

    const newDriver = {
      id: Math.floor(Math.random() * 10000),
      name: newName,
      team: newTeam,
      points: parseInt(newPoints)
    }

    axios.post('https://localhost:7231/api/Drivers', newDriver)
    .then(response => {
      console.log('Sunucu cevabı: ', response.data)
      //fetchDrivers()
      setDrivers([...drivers, newDriver])
      setNewName('')
      setNewTeam('')
      setNewPoints('')

    })
    .catch(error => console.error("Sürücü eklenirken hata:",error))
  }

return (
    <div className="app-container">
      <h1>F1 Pit Duvarı</h1>
      
      {/* YENİ PİLOT EKLEME FORMU */}
      <div className="form-container">
        <h2>Yeni Pilot Ekle</h2>
        <form onSubmit={handleAddDriver}>
          <input 
            type="text" 
            placeholder="Pilot Adı (Örn: Fernando Alonso)" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} // Klavyede basılan her harfi State'e yazar
            required 
          />
          <input 
            type="text" 
            placeholder="Takımı (Örn: Aston Martin)" 
            value={newTeam} 
            onChange={(e) => setNewTeam(e.target.value)} 
            required 
          />
          <input 
            type="number" 
            placeholder="Şampiyona Puanı" 
            value={newPoints} 
            onChange={(e) => setNewPoints(e.target.value)} 
            required 
          />
          <button type="submit">Garaja Ekle</button>
        </form>
      </div>

      <hr />

      {/* PİLOT LİSTESİ */}
      <div className="driver-list">
        {drivers.map(driver => (
          <div key={driver.id} className="driver-card">
            <h3>{driver.name}</h3>
            <p><strong>Takım:</strong> {driver.team}</p>
            <p><strong>Puan:</strong> {driver.points}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App