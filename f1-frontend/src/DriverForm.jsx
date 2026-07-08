import React, {useEffect, useState}  from "react";

function DriverForm({onSubmitForm, editingDriver}){

    const [newName, setNewName] = useState('')
    const [newTeam, setNewTeam] = useState('')
    const [newPoints, setNewPoints] = useState('')

    useEffect(() => {
        if(editingDriver){
            setNewName(editingDriver.name);
            setNewTeam(editingDriver.team);
            setNewPoints(editingDriver.points);
        }else{
            setNewName('')
            setNewPoints('')
            setNewTeam('')
        }
    },[editingDriver]);


    const handleSubmit = (e) => {
        e.preventDefault()

        const formData = {
            name: newName,
            team: newTeam,
            points:parseInt(newPoints)
        }
        onSubmitForm(formData);
    };

    return(
        <div className="form-container">
            {/* Düzenleme modundaysak başlık değişsin */}
            <h2>{editingDriver ? "Pilot Bilgilerini Güncelle" : "Yeni Pilot Ekle"}</h2>
            
            <form onSubmit={handleSubmit}>
                <input 
                type="text" 
                placeholder="Pilot Adı" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                required 
                />
                <input 
                type="text" 
                placeholder="Takımı" 
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
                <button type="submit">
                {/* Düzenleme modundaysak butonun yazısı değişsin */}
                {editingDriver ? "Güncelle" : "Garaja Ekle"}
                </button>
            </form>
        </div>
    )
}
export default DriverForm