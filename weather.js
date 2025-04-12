// Weather API key
const API_KEY = "e480f8c3dc8d11783a95547d7c4de931";
const API_BASE_URL = 'http://api.openweathermap.org/data/2.5';

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const locationSearch = document.getElementById('location-search');
const locationPopup = document.getElementById('location-popup');
const closePopup = document.getElementById('close-popup');
const searchInput = document.getElementById('popup-search');
const searchResults = document.getElementById('search-results');
const currentWeather = document.getElementById('current-weather');
const currentDayTime = document.getElementById('current-day-time');
const currentTemp = document.getElementById('current-temp');
const currentWeatherIcon = document.getElementById('current-weather-icon');
const weatherDetails = document.getElementById('weather-details');
const forecast = document.getElementById('forecast');
const rainGraph = document.getElementById('rain-graph');
const citiesGrid = document.getElementById('cities-grid');
const tabs = document.querySelectorAll('.tab');

// Default location
let currentLocation = {
    city: 'Seattle',
    country: 'Australia',
    lat: -31.96,
    lon: 115.86
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set initial theme based on user preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-theme');
        themeIcon.setAttribute('name', 'sunny-outline');
    }

    // Load weather data for default location
    loadWeatherData(currentLocation);
    
    // Load other cities
    loadOtherCitiesData();

    // Set current date and time
    updateDateTime();

    // Set up event listeners
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Location search
    locationSearch.addEventListener('click', openLocationPopup);
    closePopup.addEventListener('click', closeLocationPopup);
    searchInput.addEventListener('input', debounce(searchLocations, 500));

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Handle tab switching functionality
            // For simplicity, we're not implementing the actual tab switching
            // but you would load different data based on the selected tab
        });
    });
}

// Toggle between light and dark theme
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    
    if (document.body.classList.contains('dark-theme')) {
        themeIcon.setAttribute('name', 'sunny-outline');
    } else {
        themeIcon.setAttribute('name', 'moon-outline');
    }
}

// Open location search popup
function openLocationPopup() {
    locationPopup.style.display = 'flex';
    document.getElementById('popup-search').focus();
}

// Close location search popup
function closeLocationPopup() {
    locationPopup.style.display = 'none';
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
    currentDayTime.textContent = now.toLocaleDateString('en-US', options);
}

// Load weather data for a location
async function loadWeatherData(location) {
    try {
        // Current weather
        const currentResponse = await fetch(
            `${API_BASE_URL}/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!currentResponse.ok) {
            throw new Error('Weather data not available');
        }
        
        const currentData = await currentResponse.json();
        updateCurrentWeather(currentData);
        
        // Forecast
        const forecastResponse = await fetch(
            `${API_BASE_URL}/forecast?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Forecast data not available');
        }
        
        const forecastData = await forecastResponse.json();
        updateForecast(forecastData);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showErrorMessage();
    }
}

// Update current weather display
function updateCurrentWeather(data) {
    const temp = Math.round(data.main.temp);
    currentTemp.textContent = `${temp}°`;
    
    // Update weather icon based on condition
    const weatherId = data.weather[0].id;
    currentWeatherIcon.innerHTML = getWeatherIcon(weatherId);
    
    // Update weather details
    weatherDetails.innerHTML = `
        <div>Real feel: ${Math.round(data.main.feels_like)}°</div>
        <div>Wind: ${getWindDirection(data.wind.deg)} ${Math.round(data.wind.speed)} km/h</div>
        <div>Humidity: ${data.main.humidity}%</div>
        <div>Sunrise: ${formatTime(data.sys.sunrise)}</div>
        <div>Sunset: ${formatTime(data.sys.sunset)}</div>
    `;
}

// Update forecast display
function updateForecast(data) {
    // Group forecast by day (taking one forecast per day at noon)
    const dailyForecasts = {};
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        // If we don't have this day yet and it's around noon (12PM), add it
        if (!dailyForecasts[day] && date.getHours() >= 11 && date.getHours() <= 13) {
            dailyForecasts[day] = item;
        }
    });
    
    // Convert to array and take only the next 6 days
    const forecasts = Object.values(dailyForecasts).slice(0, 6);
    
    // Create forecast HTML
    let forecastHTML = '';
    
    forecasts.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(item.main.temp);
        const weatherId = item.weather[0].id;
        
        forecastHTML += `
            <div class="forecast-day">
                <div class="day-name">${day}</div>
                <div class="forecast-icon">
                    ${getWeatherIcon(weatherId)}
                </div>
                <div class="forecast-temp">${temp}°</div>
            </div>
        `;
    });
    
    // Fill any missing days to always have 6 days
    const missingDays = 6 - forecasts.length;
    for (let i = 0; i < missingDays; i++) {
        forecastHTML += `
            <div class="forecast-day">
                <div class="day-name">-</div>
                <div class="forecast-icon">
                    <ion-icon name="help-outline"></ion-icon>
                </div>
                <div class="forecast-temp">-</div>
            </div>
        `;
    }
    
    forecast.innerHTML = forecastHTML;
}

// Load data for other cities
async function loadOtherCitiesData() {
    // For demo purposes, we'll use predefined cities
    const cities = [
        { name: 'California', country: 'US', lat: 36.78, lon: -119.42 },
        { name: 'Beijing', country: 'CN', lat: 39.91, lon: 116.40 },
        { name: 'Jerusalem', country: 'IL', lat: 31.77, lon: 35.21 }
    ];
    
    try {
        const cityDataPromises = cities.map(city => 
            fetch(`${API_BASE_URL}/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${API_KEY}`)
            .then(response => response.json())
        );
        
        const cityData = await Promise.all(cityDataPromises);
        
        let citiesHTML = '';
        cityData.forEach((data, index) => {
            const city = cities[index];
            const temp = Math.round(data.main.temp);
            const condition = data.weather[0].main;
            citiesHTML += `
                        <div class="city-card">
                            <div class="city-name">${city.name}</div>
                            <div class="city-condition">${condition}</div>
                            <div class="city-temp">${temp}°</div>
                        </div>
                    `;
                });
                
                citiesGrid.innerHTML = citiesHTML;
                
            } catch (error) {
                console.error('Error loading other cities data:', error);
                citiesGrid.innerHTML = '<div>Unable to load city data</div>';
            }
        }
         // Search for locations based on user input
         async function searchLocations() {
            const query = searchInput.value.trim();
            
            if (query.length < 3) {
                searchResults.innerHTML = '<div class="search-item">Enter at least 3 characters</div>';
                return;
            }
            
            try {
                searchResults.innerHTML = '<div class="loader"></div>';
                
                const response = await fetch(
                    `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
                );
                
                if (!response.ok) {
                    throw new Error('Location search failed');
                }
                
                const data = await response.json();
                
                if (data.length === 0) {
                    searchResults.innerHTML = '<div class="search-item">No locations found</div>';
                    return;
                }
                
                let resultsHTML = '';
                data.forEach(location => {
                    const locationName = `${location.name}, ${location.country}`;
                    resultsHTML += `
                        <div class="search-item" data-lat="${location.lat}" data-lon="${location.lon}" data-name="${location.name}" data-country="${location.country}">
                            ${locationName}
                        </div>
                    `;
                });
                
                searchResults.innerHTML = resultsHTML;
                
                // Add click event for each search result
                document.querySelectorAll('.search-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const lat = item.getAttribute('data-lat');
                        const lon = item.getAttribute('data-lon');
                        const city = item.getAttribute('data-name');
                        const country = item.getAttribute('data-country');
                        
                        currentLocation = { city, country, lat, lon };
                        document.getElementById('search-input').value = `${city}, ${country}`;
                        
                        loadWeatherData(currentLocation);
                        closeLocationPopup();
                    });
                });
                
            } catch (error) {
                console.error('Error searching locations:', error);
                searchResults.innerHTML = '<div class="search-item">Error searching locations</div>';
            }
        }


          // Get weather icon based on condition ID
          function getWeatherIcon(weatherId) {
            // Weather condition codes: https://openweathermap.org/weather-conditions
            if (weatherId >= 200 && weatherId < 300) {
                return '<ion-icon name="thunderstorm" class="thunderstorm"></ion-icon>';  // Thunderstorm
            } else if (weatherId >= 300 && weatherId < 400) {
                return '<ion-icon name="rainy" class="rainy"></ion-icon>';  // Drizzle
            } else if (weatherId >= 500 && weatherId < 600) {
                return '<ion-icon name="rainy" class="rainy"></ion-icon>';  // Rain
            } else if (weatherId >= 600 && weatherId < 700) {
                return '<ion-icon name="snow" class="snowy"></ion-icon>';  // Snow
            } else if (weatherId >= 700 && weatherId < 800) {
                return '<ion-icon name="cloud" class="cloudy"></ion-icon>';  // Atmosphere
            } else if (weatherId === 800) {
                return '<ion-icon name="sunny" class="sunny"></ion-icon>';  // Clear
            } else if (weatherId > 800) {
                return '<ion-icon name="partly-sunny" class="partly-cloudy"></ion-icon>';  // Clouds
            }
            return '<ion-icon name="help-outline"></ion-icon>';
        }

        // Get wind direction based on degrees
        function getWindDirection(degrees) {
            const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const index = Math.round(degrees / 45) % 8;
            return directions[index];
        }

        // Format timestamp to time
        function formatTime(timestamp) {
            const date = new Date(timestamp * 1000);
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }

        // Show error message when weather data can't be loaded
        function showErrorMessage() {
            currentTemp.textContent = '–°';
            currentWeatherIcon.innerHTML = '<ion-icon name="alert-circle-outline"></ion-icon>';
            weatherDetails.innerHTML = '<div>Weather data not available</div>';
            forecast.innerHTML = '<div style="grid-column: span 6; text-align: center;">Forecast data not available</div>';
        }

        // Get user's current location if available
        function getUserLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        
                        // Get city name from coordinates
                        fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`)
                            .then(response => response.json())
                            .then(data => {
                                if (data && data.length > 0) {
                                    currentLocation = {
                                        city: data[0].name,
                                        country: data[0].country,
                                        lat,
                                        lon
                                    };
                                    
                                    document.getElementById('search-input').value = `${currentLocation.city}, ${currentLocation.country}`;
                                    loadWeatherData(currentLocation);
                                }
                            })
                            .catch(error => {
                                console.error('Error getting location name:', error);
                            });
                    },
                    (error) => {
                        console.error('Error getting user location:', error);
                    }
                );
            }
        }

        // Add a button to get current location
        const locationButton = document.createElement('button');
        locationButton.className = 'nav-button';
        locationButton.innerHTML = '<ion-icon name="compass-outline"></ion-icon>';
        locationButton.title = 'Use my location';
        locationButton.addEventListener('click', getUserLocation);
        document.querySelector('.nav-buttons').appendChild(locationButton);

        // Utility function to debounce input
        function debounce(func, delay) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), delay);
            };
        }