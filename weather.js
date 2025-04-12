// Weather API key
const API_KEY = "e480f8c3dc8d11783a95547d7c4de931";
const API_BASE_URL = 'http://api.openweathermap.org/data/2.5';

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const settingsBtn = document.getElementById('settings-button');
const favoritesButton = document.getElementById('favorites-button');
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

    // Load favorites first
    const favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
    if (favorites.length > 0) {
        currentLocation = {
            city: favorites[0].name,
            country: favorites[0].country,
            lat: favorites[0].lat,
            lon: favorites[0].lon
        };
        document.getElementById('search-input').value = `${currentLocation.city}, ${currentLocation.country}`;
    }

    // Load weather data for default location
    loadWeatherData(currentLocation);

    // Load the favorite cities from local storage
    loadFavoriteTabs();
    
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

    // Add to Favorites
    favoritesButton.addEventListener('click', addToFavorites);

    // Update Favorites
    settingsBtn.addEventListener("click", () => {
        modal.style.display = "block";
        updateFavoritesInSettings();
    });    
}

// Refresh the page
document.getElementById("home-button").addEventListener("click", function () {
    window.location.href = "weather.html";
});

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
    
    // Add high/low temperature display for current day
    const highTemp = Math.round(data.main.temp_max);
    const lowTemp = Math.round(data.main.temp_min);
    const currentDayRange = document.getElementById('current-day-range');
    currentDayRange.innerHTML = `
        <span class="high-temp">${highTemp}°</span>
        <span class="low-temp">${lowTemp}°</span>
    `;
    
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
    const dailyForecasts = {};
    const now = new Date();
    const next5Days = [];

    // Create date objects for next 5 days
    for (let i = 1; i <= 5; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() + i);
        next5Days.push({
            weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: date
        });
    }

    // Process API data
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Only process if it's one of the next 5 days
        if (!next5Days.some(d => d.weekday === dayKey)) return;

        if (!dailyForecasts[dayKey]) {
            dailyForecasts[dayKey] = {
                min: item.main.temp_min,
                max: item.main.temp_max,
                icons: []
            };
        } else {
            dailyForecasts[dayKey].min = Math.min(dailyForecasts[dayKey].min, item.main.temp_min);
            dailyForecasts[dayKey].max = Math.max(dailyForecasts[dayKey].max, item.main.temp_max);
        }
        
        dailyForecasts[dayKey].icons.push(item.weather[0].id);
    });

    // Build forecast in chronological order
    let forecastHTML = '';
    
    next5Days.forEach(dayInfo => {
        const dayData = dailyForecasts[dayInfo.weekday];
        const dayName = dayInfo.weekday;
        
        if (dayData) {
            const modeIcon = mode(dayData.icons);
            const weatherId = modeIcon || dayData.icons[0];
            
            forecastHTML += `
                <div class="forecast-day">
                    <div class="day-name">${dayName}</div>
                    <div class="forecast-icon">
                        ${getWeatherIcon(weatherId)}
                    </div>
                    <div class="temp-range">
                        <span class="high-temp">${Math.round(dayData.max)}°</span>
                        <span class="low-temp">${Math.round(dayData.min)}°</span>
                    </div>
                </div>
            `;
        } else {
            // Fallback if API doesn't have data for that day
            forecastHTML += `
                <div class="forecast-day">
                    <div class="day-name">${dayName}</div>
                    <div class="forecast-icon">
                        <ion-icon name="help-outline"></ion-icon>
                    </div>
                    <div class="temp-range">
                        <span class="high-temp">-</span>
                        <span class="low-temp">-</span>
                    </div>
                </div>
            `;
        }
    });
    
    forecast.innerHTML = forecastHTML;
}

// Helper function to find most frequent icon
function mode(arr) {
    return arr.sort((a,b) => 
        arr.filter(v => v === a).length - 
        arr.filter(v => v === b).length
    ).pop();
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
                        
                        currentLocation = { 
                            city: city,
                            country: country,
                            lat: parseFloat(lat),
                            lon: parseFloat(lon)
                        };
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

        var modal = document.getElementById("myModal");

        // Get the button that opens the modal
        var btn = document.getElementById("myBtn");

        // Get the <span> element that closes the modal
        var span = document.getElementsByClassName("close")[0];

        // When the user clicks the button, open the modal 
        btn.onclick = function() {
        modal.style.display = "block";
        }

        // When the user clicks on <span> (x), close the modal
        span.onclick = function() {
        modal.style.display = "none";
        }

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
        }

        async function addToFavorites() {
            const cityInput = document.getElementById('search-input').value.trim();
            
            if (!cityInput) {
                alert('Please search and select a valid city first');
                return;
            }
        
            try {
                // Validate through OpenWeatherMap API
                const response = await fetch(
                    `https://api.openweathermap.org/geo/1.0/direct?q=${cityInput}&limit=1&appid=${API_KEY}`
                );
                
                if (!response.ok) throw new Error('Validation failed');
                const data = await response.json();
                
                if (data.length === 0) {
                    alert('Invalid city - not found in our database');
                    return;
                }
        
                const cityInfo = {
                    name: data[0].name,
                    country: data[0].country,
                    lat: data[0].lat,
                    lon: data[0].lon
                };
        
                // Get existing favorites
                const favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
                
                // Check for duplicates
                const exists = favorites.some(f => 
                    f.lat === cityInfo.lat && f.lon === cityInfo.lon
                );
        
                if (!exists) {
                    favorites.push(cityInfo);
                    localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
                    alert('Added to favorites!');
                    
                    // Update current location to the new favorite
                    currentLocation = cityInfo;
                    
                    // Refresh UI elements
                    loadFavoriteTabs();
                    loadWeatherData(currentLocation);
                } else {
                    alert('This city is already in your favorites');
                }
            } catch (error) {
                console.error('Favorite error:', error);
                alert('Failed to add favorite. Please try again.');
            }
        }

        function loadFavoriteTabs() {
            const favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
            const tabsContainer = document.querySelector('.tabs');
            tabsContainer.innerHTML = '';
        
            favorites.forEach((favorite, index) => {
                const tabElement = document.createElement('div');
                tabElement.className = 'tab';
                tabElement.textContent = `${favorite.name}, ${favorite.country}`;
                
                // Store coordinates in dataset
                tabElement.dataset.lat = favorite.lat;
                tabElement.dataset.lon = favorite.lon;
        
                // Add click handler to load weather
                tabElement.addEventListener('click', function() {
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    currentLocation = {
                        city: favorite.name,
                        country: favorite.country,
                        lat: favorite.lat,
                        lon: favorite.lon
                    };
                    document.getElementById('search-input').value = `${favorite.name}, ${favorite.country}`;
                    loadWeatherData(currentLocation);
                });
        
                // Only activate first tab if we're actually showing its data
                if (index === 0 && favorites.length > 0) {
                    tabElement.classList.add('active');
                }
                
                tabsContainer.appendChild(tabElement);
            });
        
            if (favorites.length === 0) {
                tabsContainer.innerHTML = '<div class="tab">No favorites yet</div>';
            }
        }

        function updateFavoritesInSettings() {
            const favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
            const listContent = document.getElementById('favorites-list-content');
            
            if (favorites.length === 0) {
                listContent.innerHTML = '<div>No saved locations</div>';
                return;
            }
        
            listContent.innerHTML = favorites.map((favorite, index) => `
                <div class="favorite-item">
                    <div>${favorite.name}, ${favorite.country}</div>
                    <button class="remove-favorite" data-index="${index}">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
            `).join('');
        
            // Add click handlers for remove buttons
            document.querySelectorAll('.remove-favorite').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.dataset.index);
                    removeFavorite(index);
                });
            });
        }
        
        function removeFavorite(index) {
            const favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
            if (index >= 0 && index < favorites.length) {
                favorites.splice(index, 1);
                localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
                updateFavoritesInSettings();
                loadFavoriteTabs();
                
                // If removed favorite was currently displayed, update view
                if (currentLocation.lat === favorites[index]?.lat && 
                    currentLocation.lon === favorites[index]?.lon) {
                    loadWeatherData(favorites[0] || currentLocation);
                }
            }
        }