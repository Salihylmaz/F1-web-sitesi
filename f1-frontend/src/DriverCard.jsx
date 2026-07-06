import React from 'react'

function DriverCard({driver, onDelete, onEdit}) {

    return(
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
    )
}