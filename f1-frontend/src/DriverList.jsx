import React from "react";
import DriverCard from "./DriverCard";

function DriverList({drivers, onDelete, onEdit}){

    return(
        <div className="driver-list">
            {drivers.map(driver =>(
                <DriverCard
                    key={driver.id}
                    driver={driver}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            ))}
            
        </div>
    )
}

export default DriverList