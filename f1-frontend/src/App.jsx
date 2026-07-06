import './App.css'
import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {

  const [drivers, setDrivers] = useState([])

  const [newName, setNewName] = useState('')
  const [newTeam, setNewTeam] = useState('')
  const [newPoints, setNewPoints] = useState('')
  const [editingDriver, setEditingDriver] = useState(null)

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

  const handleSubmit = (e) => {
    e.preventDefault()

    if(editingDriver != null){

      const updatedDriver = {
        id: editingDriver.id,
        name: newName,
        team: newTeam,
        points: parseInt(newPoints)
      }

      axios.put(`https://localhost:7231/api/Drivers/${editingDriver.id}`, updatedDriver)
      .then(response =>{
        fetchDrivers()

        setNewName('')
        setNewPoints('')
        setNewTeam('')
        setEditingDriver(null)
      })
    }
    else{
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
  }
  const handleEditClick = (driver) => {
    setEditingDriver(driver)
    setNewName(driver.name)
    setNewPoints(driver.points)
    setNewTeam(driver.team)
  }

  // --- 5. VERİ SİLME (DELETE) ALANI ---
  const handleDeleteDriver = (id) => {
    // Silmeden önce kullanıcıya emin olup olmadığını soralım (Defensive UI)
    const isConfirmed = window.confirm("Bu pilotu garajdan silmek istediğine emin misin?");
    
    if (isConfirmed) {
      // C# backend'ine DELETE isteği atıyoruz
      axios.delete(`https://localhost:7231/api/Drivers/${id}`)
        .then(response => {
          console.log("Silme başarılı:", response.data);
          
          // NRT Mantığı: API'dan listeyi baştan çekmek yerine, 
          // silinen pilotun ID'sini mevcut state'ten filtreleyip çıkarıyoruz.
          setDrivers(drivers.filter(driver => driver.id !== id));
        })
        .catch(error => console.error("Sürücü silinirken hata:", error));
    }
  }

return (
    <div className="app-container">
      <h1>F1 Pit Duvarı</h1>
      
      {/* YENİ PİLOT EKLEME FORMU */}
      <div className="form-container">
        <h2>Yeni Pilot Ekle</h2>
        <form onSubmit={handleSubmit}>
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
            <button className='delete-btn' onClick={() => handleDeleteDriver(driver.id)}>
            Pit'ten çıkar
          </button>

          <button className='put-btn' onClick={() => handleEditClick(driver)}>
            Sürücü bilgilerini güncelle
          </button>

          </div>
          

        ))}
      </div>
    </div>
  )
}

export default App