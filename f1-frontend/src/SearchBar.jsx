import React from "react";

function SearchBar({searchQuery, onSearchChange}){

    return(
        <div className="search-container">
            <input 
                type="text" 
                placeholder="Pilot veya Takım ara..." 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
    )
}

export default SearchBar