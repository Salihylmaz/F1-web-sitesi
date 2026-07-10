import React, { useEffect, useState } from "react";
import axios from "axios";

function NewsPage(){

    const [news, setNews] = useState([])
    const [loading, setLoading] = useState(true)

    const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    // Türkçe formata çevir ve saatin ortasındaki iki noktayı tek noktaya dönüştür
    return date.toLocaleDateString('tr-TR', options).replace(':', '.');
  };

    useEffect(() => {
        axios.get(`https://api.rss2json.com/v1/api.json?rss_url=https://www.motorsport.com/rss/f1/news/`)
        .then(response => {
            setNews(response.data.items);
            setLoading(false);
        })
    }, [])

    return(
        <div className="news-container">
            <div className="news-grid">
                {news.map((item, index) => (
                    // Dış taşıyıcıyı div yerine doğrudan a (link) etiketi yapıyoruz
                    <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer" /* Güvenlik için Senior Dev kuralı */
                    key={index} 
                    className="news-card"
                    >
                        <h1>{item.title}</h1> 
                        <p>{formatDate(item.pubDate)}</p> 
                        <img src={item.enclosure.link} alt="Haber Görseli" /> 
                        
                    </a>
                ))}
            </div>

        </div>
    )
}

export default NewsPage;