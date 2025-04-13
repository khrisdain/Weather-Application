// weather-location.js
import { searchLocationsByQuery, getLocationNameFromCoords } from './api.js';
import { debounce } from './utils.js';

// Class for managing location data
export class Location {
    constructor(city, country, lat, lon) {
        this.city = city;
        this.country = country;
        this.lat = lat;
        this.lon = lon;
    }

    toString() {
        return `${this.city}, ${this.country}`;
    }
}

// Class for managing favorites
export class FavoritesManager {
    constructor() {
        this.storageKey = 'weatherFavorites';
    }

    // Get all favorites
    getFavorites() {
        const favoritesData = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        return favoritesData.map(f => new Location(f.name, f.country, f.lat, f.lon));
    }

    // Add a location to favorites
    addFavorite(location) {
        const favorites = this.getFavorites();
        
        // Check for duplicates
        const exists = favorites.some(f => 
            f.lat === location.lat && f.lon === location.lon
        );

        if (!exists) {
            const favoriteToAdd = {
                name: location.city,
                country: location.country,
                lat: location.lat,
                lon: location.lon
            };
            
            const favoritesData = JSON.parse(localStorage.getItem(this.storageKey)) || [];
            favoritesData.push(favoriteToAdd);
            localStorage.setItem(this.storageKey, JSON.stringify(favoritesData));
            return true;
        }
        
        return false;
    }

    // Remove a favorite by index
    removeFavorite(index) {
        const favoritesData = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        if (index >= 0 && index < favoritesData.length) {
            favoritesData.splice(index, 1);
            localStorage.setItem(this.storageKey, JSON.stringify(favoritesData));
            return true;
        }
        return false;
    }
}

// Location search UI handler
export class LocationSearchUI {
    constructor(onLocationSelected) {
        this.locationPopup = document.getElementById('location-popup');
        this.closePopupBtn = document.getElementById('close-popup');
        this.searchInput = document.getElementById('popup-search');
        this.searchResults = document.getElementById('search-results');
        this.locationSearch = document.getElementById('location-search');
        this.onLocationSelected = onLocationSelected;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Location search popup
        this.locationSearch.addEventListener('click', () => this.openPopup());
        this.closePopupBtn.addEventListener('click', () => this.closePopup());
        this.searchInput.addEventListener('input', debounce(() => this.searchLocations(), 500));
    }
    
    openPopup() {
        this.locationPopup.style.display = 'flex';
        this.searchInput.focus();
    }
    
    closePopup() {
        this.locationPopup.style.display = 'none';
    }
    
    async searchLocations() {
        const query = this.searchInput.value.trim();
        
        if (query.length < 3) {
            this.searchResults.innerHTML = '<div class="search-item">Enter at least 3 characters</div>';
            return;
        }
        
        try {
            this.searchResults.innerHTML = '<div class="loader"></div>';
            
            const data = await searchLocationsByQuery(query);
            
            if (data.length === 0) {
                this.searchResults.innerHTML = '<div class="search-item">No locations found</div>';
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
            
            this.searchResults.innerHTML = resultsHTML;
            
            // Add click event for each search result
            document.querySelectorAll('.search-item').forEach(item => {
                item.addEventListener('click', () => {
                    const lat = item.getAttribute('data-lat');
                    const lon = item.getAttribute('data-lon');
                    const city = item.getAttribute('data-name');
                    const country = item.getAttribute('data-country');
                    
                    const selectedLocation = new Location(
                        city, 
                        country, 
                        parseFloat(lat), 
                        parseFloat(lon)
                    );
                    
                    document.getElementById('search-input').value = selectedLocation.toString();
                    
                    if (this.onLocationSelected) {
                        this.onLocationSelected(selectedLocation);
                    }
                    
                    this.closePopup();
                });
            });
            
        } catch (error) {
            console.error('Error searching locations:', error);
            this.searchResults.innerHTML = '<div class="search-item">Error searching locations</div>';
        }
    }
    
    // Get user's current geolocation
    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    
                    try {
                        // Get city name from coordinates
                        const data = await getLocationNameFromCoords(lat, lon);
                        
                        if (data && data.length > 0) {
                            const location = new Location(
                                data[0].name,
                                data[0].country,
                                lat,
                                lon
                            );
                            
                            document.getElementById('search-input').value = location.toString();
                            
                            if (this.onLocationSelected) {
                                this.onLocationSelected(location);
                            }
                        }
                    } catch (error) {
                        console.error('Error getting location name:', error);
                    }
                },
                (error) => {
                    console.error('Error getting user location:', error);
                }
            );
        }
    }
}