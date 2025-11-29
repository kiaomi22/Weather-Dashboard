const API_KEY = '10cfd092f533bce4a4cba799d80cd149'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

let currentCity = 'Jakarta';
let units = 'metric'; 
let isDarkMode = false;
let updateInterval;

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const unitToggle = document.getElementById('unitToggle');
const themeToggle = document.getElementById('themeToggle');
const saveCityBtn = document.getElementById('saveCityBtn');
const loading = document.getElementById('loading');
const errorMsg = document.getElementById('errorMessage');
const weatherContainer = document.getElementById('weatherContainer');

window.addEventListener('load', () => {
    loadFavorites();
    fetchWeatherData(currentCity);
    startAutoUpdate();
});

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        currentCity = city;
        fetchWeatherData(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

refreshBtn.addEventListener('click', () => fetchWeatherData(currentCity));

unitToggle.addEventListener('click', () => {
    units = units === 'metric' ? 'imperial' : 'metric';
    unitToggle.textContent = units === 'metric' ? '°C' : '°F';
    fetchWeatherData(currentCity);
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

saveCityBtn.addEventListener('click', saveFavorite);

async function fetchWeatherData(city) {
    showLoading(true);
    errorMsg.classList.add('hidden');
    
    try {
        const weatherRes = await fetch(`${BASE_URL}/weather?q=${city}&units=${units}&appid=${API_KEY}`);
        if (!weatherRes.ok) throw new Error('Kota tidak ditemukan atau API Key belum aktif.');
        const weatherData = await weatherRes.json();

        const forecastRes = await fetch(`${BASE_URL}/forecast?q=${city}&units=${units}&appid=${API_KEY}`);
        const forecastData = await forecastRes.json();

        updateHeroUI(weatherData);
        updateDetailsUI(weatherData);
        updateForecastUI(forecastData.list);
        
        saveToHistory(city);
        showLoading(false);

    } catch (error) {
        showLoading(false);
        errorMsg.textContent = error.message;
        errorMsg.classList.remove('hidden');
        weatherContainer.classList.add('hidden');
    }
}

function updateHeroUI(data) {
    weatherContainer.classList.remove('hidden');
    
    document.getElementById('cityName').textContent = data.name;
    document.getElementById('temperature').textContent = Math.round(data.main.temp);
    document.getElementById('condition').textContent = data.weather[0].description;
    
    document.getElementById('tempMax').textContent = Math.round(data.main.temp_max);
    document.getElementById('tempMin').textContent = Math.round(data.main.temp_min);
}

function updateDetailsUI(data) {
    document.getElementById('humidity').textContent = data.main.humidity;
    document.getElementById('windSpeed').textContent = data.wind.speed;
    document.getElementById('speedUnit').textContent = units === 'metric' ? 'm/s' : 'mph';
    document.getElementById('feelsLike').textContent = Math.round(data.main.feels_like);
    document.getElementById('pressure').textContent = data.main.pressure;
}

function updateForecastUI(forecastList) {
    const grid = document.getElementById('forecastGrid');
    grid.innerHTML = ''; 

    const dailyData = forecastList.filter(item => item.dt_txt.includes("12:00:00"));

    dailyData.slice(0, 5).forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
        const iconCode = day.weather[0].icon;
        
        const row = document.createElement('div');
        row.className = 'forecast-item';
        row.innerHTML = `
            <div class="day-name">${dayName}</div>
            <img src="https://openweathermap.org/img/wn/${iconCode}.png" class="forecast-icon" alt="icon">
            <div class="forecast-temp">
                <span>${Math.round(day.main.temp)}°</span>
            </div>
        `;
        grid.appendChild(row);
    });
}

function showLoading(isLoading) {
    if (isLoading) {
        loading.classList.remove('hidden');
        weatherContainer.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function saveFavorite() {
    let favorites = JSON.parse(localStorage.getItem('iosWeatherFav')) || [];
    if (!favorites.includes(currentCity)) {
        favorites.push(currentCity);
        localStorage.setItem('iosWeatherFav', JSON.stringify(favorites));
        loadFavorites();
    }
}

function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('iosWeatherFav')) || [];
    const list = document.getElementById('favoritesList');
    const container = document.getElementById('favoritesSection');
    
    list.innerHTML = '';
    
    if (favorites.length > 0) {
        container.classList.remove('hidden');
        favorites.forEach(city => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.innerHTML = `${city} <i class="fas fa-times" style="font-size:0.8em"></i>`;
            
            chip.addEventListener('click', (e) => {
                if (e.target.tagName === 'I') {
                    removeFavorite(city);
                } else {
                    currentCity = city;
                    fetchWeatherData(city);
                }
            });
            list.appendChild(chip);
        });
    } else {
        container.classList.add('hidden');
    }
}

function removeFavorite(city) {
    let favorites = JSON.parse(localStorage.getItem('iosWeatherFav')) || [];
    favorites = favorites.filter(c => c !== city);
    localStorage.setItem('iosWeatherFav', JSON.stringify(favorites));
    loadFavorites();
}

function saveToHistory(city) {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    if (!history.includes(city)) {
        history.push(city);
        localStorage.setItem('searchHistory', JSON.stringify(history));
        updateSuggestions();
    }
}

function updateSuggestions() {
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    const datalist = document.getElementById('citySuggestions');
    datalist.innerHTML = '';
    history.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        datalist.appendChild(option);
    });
}

function startAutoUpdate() {
    updateInterval = setInterval(() => {
        console.log('Auto-updating...');
        fetchWeatherData(currentCity);
    }, 300000);
}