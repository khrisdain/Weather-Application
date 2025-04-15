// main.js
import { fetchCurrentWeather, fetchForecast } from './api.js';
import { Location, FavoritesManager, LocationSearchUI } from './location.js';
import { CurrentWeatherDisplay, ForecastDisplay, RainChancesDisplay, OtherCitiesDisplay } from './display.js';
import { ThemeManager, TabManager, SettingsManager } from './theme-ui.js';

class WeatherApp {
    constructor() {
        // Current location initialized with default values
        this.currentLocation = new Location('Seattle', 'Australia', -31.96, 115.86);
        
        // Initialize managers and UI components
        this.favoritesManager = new FavoritesManager();
        this.themeManager = new ThemeManager();
        
        // Initialize display components
        this.currentWeatherDisplay = new CurrentWeatherDisplay();
        this.forecastDisplay = new ForecastDisplay();
        this.rainChancesDisplay = new RainChancesDisplay();
        this.otherCitiesDisplay = new OtherCitiesDisplay();
        
        // Initialize UI managers
        this.tabManager = new TabManager((location) => this.setCurrentLocation(location));
        this.settingsManager = new SettingsManager(
            this.favoritesManager, 
            (index) => this.handleFavoriteRemoved(index)
        );
        
        // Initialize location search
        this.locationSearchUI = new LocationSearchUI((location) => this.setCurrentLocation(location));
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    initialize() {
        // Load favorites first
        const favorites = this.favoritesManager.getFavorites();
        if (favorites.length > 0) {
            this.currentLocation = favorites[0];
            document.getElementById('search-input').value = this.currentLocation.toString();
        }

        // Load weather data for default location
        this.loadWeatherData(this.currentLocation);

        // Load favorites tabs
        this.tabManager.updateTabs(favorites, this.currentLocation);
        
        // Load other cities
        this.loadOtherCitiesData();
    }
    
    setupEventListeners() {
        // Favorites button
        document.getElementById('favorites-button').addEventListener('click', () => this.addToFavorites());
        
        // Home button (refresh)
        document.getElementById('home-button').addEventListener('click', () => {
            window.location.href = "weather.html";
        });
        
        // Add location button
        const locationButton = document.createElement('button');
        locationButton.className = 'nav-button';
        locationButton.innerHTML = '<ion-icon name="compass-outline"></ion-icon>';
        locationButton.title = 'Use my location';
        locationButton.addEventListener('click', () => this.locationSearchUI.getUserLocation());
        document.querySelector('.nav-buttons').appendChild(locationButton);
    }
    
    setCurrentLocation(location) {
        this.currentLocation = location;
        document.getElementById('search-input').value = location.toString();
        this.loadWeatherData(location);
        
        // Update tabs with current location context
        const favorites = this.favoritesManager.getFavorites();
        this.tabManager.updateTabs(favorites, this.currentLocation);
    }
    
    async loadWeatherData(location) {
        try {
            // Fetch current weather data
            const currentData = await fetchCurrentWeather(location.lat, location.lon);
            this.currentWeatherDisplay.update(currentData);
            
            // Fetch forecast data
            const forecastData = await fetchForecast(location.lat, location.lon);
            this.forecastDisplay.update(forecastData);
            this.rainChancesDisplay.update(forecastData);
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.currentWeatherDisplay.showError();
            this.forecastDisplay.showError();
        }
    }
    
    async loadOtherCitiesData() {
        // Predefined cities
        const cities = [
            new Location('California', 'US', 36.78, -119.42),
            new Location('Beijing', 'CN', 39.91, 116.40),
            new Location('Jerusalem', 'IL', 31.77, 35.21)
        ];
        
        try {
            const cityDataPromises = cities.map(city => 
                fetchCurrentWeather(city.lat, city.lon)
            );
            
            const citiesData = await Promise.all(cityDataPromises);
            this.otherCitiesDisplay.update(citiesData);
            
        } catch (error) {
            console.error('Error loading other cities data:', error);
            this.otherCitiesDisplay.showError();
        }
    }
    
    async addToFavorites() {
        const cityInput = document.getElementById('search-input').value.trim();
        
        if (!cityInput) {
            alert('Please search and select a valid city first');
            return;
        }
    
        try {
            const added = this.favoritesManager.addFavorite(this.currentLocation);
            
            if (added) {
                alert('Added to favorites!');
                
                // Refresh UI elements
                const favorites = this.favoritesManager.getFavorites();
                this.tabManager.updateTabs(favorites, this.currentLocation); 
            } else {
                alert('This city is already in your favorites');
            }
        } catch (error) {
            console.error('Favorite error:', error);
            alert('Failed to add favorite. Please try again.');
        }
    }
    
    handleFavoriteRemoved(index) {
        const favorites = this.favoritesManager.getFavorites();
        this.tabManager.updateTabs(favorites, this.currentLocation);
    }
}

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherApp();
    window.weatherApp.initialize();
});

// Modal functionality (this was originally in inline script)
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("myModal");
    const settingsBtn = document.getElementById("settings-button");
    const closeModal = document.querySelector(".close");

    settingsBtn.addEventListener("click", () => {
        modal.style.display = "block";
    });

    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if(event.target.modal === 0) {
            modal.style.display = "none";
        }
    });
});


export default WeatherApp;