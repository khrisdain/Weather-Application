// weather-api.js
const API_KEY = "e480f8c3dc8d11783a95547d7c4de931";
const API_BASE_URL = 'http://api.openweathermap.org/data/2.5';

// Weather data fetching
export async function fetchCurrentWeather(lat, lon) {
    const response = await fetch(
        `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
        throw new Error('Weather data not available');
    }
    
    return await response.json();
}

export async function fetchForecast(lat, lon) {
    const response = await fetch(
        `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
        throw new Error('Forecast data not available');
    }
    
    return await response.json();
}

// Location search
export async function searchLocationsByQuery(query) {
    const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
    );
    
    if (!response.ok) {
        throw new Error('Location search failed');
    }
    
    return await response.json();
}

// Reverse geocoding
export async function getLocationNameFromCoords(lat, lon) {
    const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
    );
    
    if (!response.ok) {
        throw new Error('Reverse geocoding failed');
    }
    
    return await response.json();
}