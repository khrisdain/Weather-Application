// weather-display.js
import { getWeatherIcon, getWindDirection, formatTime, mode } from './utils.js';

// Base class for weather displays
export class WeatherDisplay {
    constructor() {
        // Common initialization
    }
    
    showError(message) {
        console.error(message);
    }
}

// Class for current weather display
export class CurrentWeatherDisplay extends WeatherDisplay {
    constructor() {
        super();
        this.currentDayTime = document.getElementById('current-day-time');
        this.currentTemp = document.getElementById('current-temp');
        this.currentDayRange = document.getElementById('current-day-range');
        this.currentWeatherIcon = document.getElementById('current-weather-icon');
        this.weatherDetails = document.getElementById('weather-details');
        
        // Update date and time
        this.updateDateTime();
    }
    
    updateDateTime() {
        const now = new Date();
        const options = { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
        this.currentDayTime.textContent = now.toLocaleDateString('en-US', options);
    }
    
    update(data) {
        const temp = Math.round(data.main.temp);
        this.currentTemp.textContent = `${temp}°`;
        
        // Add high/low temperature display for current day
        const highTemp = Math.round(data.main.temp_max);
        const lowTemp = Math.round(data.main.temp_min);
        this.currentDayRange.innerHTML = `
            <span class="high-temp">${highTemp}°</span>
            <span class="low-temp">${lowTemp}°</span>
        `;
        
        // Update weather icon based on condition
        const weatherId = data.weather[0].id;
        this.currentWeatherIcon.innerHTML = getWeatherIcon(weatherId);
        
        // Update weather details
        this.weatherDetails.innerHTML = `
            <div>Real feel: ${Math.round(data.main.feels_like)}°</div>
            <div>Wind: ${getWindDirection(data.wind.deg)} ${Math.round(data.wind.speed)} km/h</div>
            <div>Humidity: ${data.main.humidity}%</div>
            <div>Sunrise: ${formatTime(data.sys.sunrise)}</div>
            <div>Sunset: ${formatTime(data.sys.sunset)}</div>
        `;
    }
    
    showError() {
        this.currentTemp.textContent = '–°';
        this.currentWeatherIcon.innerHTML = '<ion-icon name="alert-circle-outline"></ion-icon>';
        this.weatherDetails.innerHTML = '<div>Weather data not available</div>';
    }
}

// Class for forecast display
export class ForecastDisplay extends WeatherDisplay {
    constructor() {
        super();
        this.forecastElement = document.getElementById('forecast');
    }
    
    update(data) {
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
        
        this.forecastElement.innerHTML = forecastHTML;
    }
    
    showError() {
        this.forecastElement.innerHTML = '<div style="grid-column: span 6; text-align: center;">Forecast data not available</div>';
    }
}

// Class for rain chances display
export class RainChancesDisplay extends WeatherDisplay {
    constructor() {
        super();
        this.rainGraph = document.getElementById('rain-graph');
    }
    
    update(forecastData) {
        // Get the next 6 forecast periods (3-hour intervals)
        const next6Periods = forecastData.list.slice(0, 6);
        
        let rainGraphHTML = '';
        
        next6Periods.forEach((period) => {
            // Get the time for this period
            const date = new Date(period.dt * 1000);
            const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
            
            // Get the precipitation probability - multiply by 100 to get percentage
            const rainProbability = Math.round((period.pop || 0) * 100);
            
            // Calculate bar height (10% minimum for visibility)
            const barHeight = Math.max(10, rainProbability);
            
            rainGraphHTML += `
                <div class="rain-bar">
                    <div class="rain-percentage">${rainProbability}%</div>
                    <div class="bar" style="height: ${barHeight}%;"></div>
                    <div class="time">${timeString}</div>
                </div>
            `;
        });
        
        this.rainGraph.innerHTML = rainGraphHTML;
    }
}

// Class for other cities display
export class OtherCitiesDisplay extends WeatherDisplay {
    constructor() {
        super();
        this.citiesGrid = document.getElementById('cities-grid');
    }
    
    update(citiesData) {
        let citiesHTML = '';
        
        citiesData.forEach(data => {
            const temp = Math.round(data.main.temp);
            const condition = data.weather[0].main;
            citiesHTML += `
                <div class="city-card">
                    <div class="city-name">${data.name}</div>
                    <div class="city-condition">${condition}</div>
                    <div class="city-temp">${temp}°</div>
                </div>
            `;
        });
        
        this.citiesGrid.innerHTML = citiesHTML;
    }
    
    showError() {
        this.citiesGrid.innerHTML = '<div>Unable to load city data</div>';
    }
}