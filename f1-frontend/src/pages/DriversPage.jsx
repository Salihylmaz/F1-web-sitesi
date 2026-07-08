import '../App.css'; 
import { useState, useEffect } from 'react';
import axios from 'axios';
import DriverCard from '../DriverCard';
import DriverForm from '../DriverForm';
import DriverList from '../DriverList';
import SearchBar from '../SearchBar';

function DriversPage() {

  const [drivers, setDrivers] = useState([])
  const [editingDriver, setEditingDriver] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')


  const filteredDrivers = drivers.filter(driver => {
    if(searchQuery == "") return true;

    const query = searchQuery.toLowerCase();
    const driverName = driver.name.toLowerCase();
    const driverTeam = driver.team.toLowerCase();

    return driverName.includes(query) || driverTeam.includes(query);
  });


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

  const handleFormSubmit = (formData) => {

    if(editingDriver != null){

      const updatedDriver = {
        id: editingDriver.id,
        name: formData.name,
        team: formData.team,
        points: formData.points
      }

      axios.put(`https://localhost:7231/api/Drivers/${editingDriver.id}`, updatedDriver)
      .then(response =>{
        fetchDrivers()
        setEditingDriver(null)
      })
    }
    else{
      const newDriver = {
        id: Math.floor(Math.random() * 10000),
        name: formData.name,
        team: formData.team,
        points: formData.points
      }

      axios.post('https://localhost:7231/api/Drivers', newDriver)
      .then(response => {
        console.log('Sunucu cevabı: ', response.data)
        //fetchDrivers()
        setDrivers([...drivers, newDriver])
      })
      .catch(error => console.error("Sürücü eklenirken hata:",error))
    }
  }
  const handleEditClick = (driver) => {
    setEditingDriver(driver)
  }

  // --- 5. VERİ SİLME (DELETE) ALANI ---
  const handleDeleteDriver = (id) => {
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
      <DriverForm 
        onSubmitForm={handleFormSubmit}
        editingDriver={editingDriver}
      />

      <hr />

      <SearchBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}

      />

      {/* PİLOT LİSTESİ */}
      <DriverList
        drivers={filteredDrivers}
        onDelete={handleDeleteDriver}
        onEdit={handleEditClick}
      />
    </div>
  )
}

export default DriversPage