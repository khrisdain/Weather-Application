// weather-utils.js

// Get weather icon based on condition ID
export function getWeatherIcon(weatherId) {
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
export function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

// Format timestamp to time
export function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Helper function to find most frequent item in array
export function mode(arr) {
    return arr.sort((a,b) => 
        arr.filter(v => v === a).length - 
        arr.filter(v => v === b).length
    ).pop();
}

// Utility function to debounce input
export function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}