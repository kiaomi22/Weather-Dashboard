const API_KEY = '10cfd092f533bce4a4cba799d80cd149';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

let currentCity = 'Jakarta';
let units = 'metric'; 

const cityInput = document.getElementById('cityInput');
const loading = document.getElementById('loading');
const weatherContent = document.getElementById('weatherContent');

window.addEventListener('load', () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dateDisplay').textContent = new Date().toLocaleDateString('en-US', options);

    loadFavorites();
    fetchWeatherData(currentCity);
});

document.querySelector('.search-box i').addEventListener('click', () => searchCity());
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchCity();
});

document.getElementById('unitToggle').addEventListener('click', function() {
    units = units === 'metric' ? 'imperial' : 'metric';
    this.textContent = units === 'metric' ? '°C' : '°F';
    fetchWeatherData(currentCity);
});

document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

document.getElementById('saveCityBtn').addEventListener('click', saveFavorite);

function searchCity() {
    const city = cityInput.value.trim();
    if(city) {
        currentCity = city;
        fetchWeatherData(city);
    }
}

async function fetchWeatherData(city) {
    loading.classList.remove('hidden');
    weatherContent.style.opacity = '0.5';

    try {
        const currentRes = await fetch(`${BASE_URL}/weather?q=${city}&units=${units}&appid=${API_KEY}`);
        if (!currentRes.ok) throw new Error('City not found');
        const currentData = await currentRes.json();

        const forecastRes = await fetch(`${BASE_URL}/forecast?q=${city}&units=${units}&appid=${API_KEY}`);
        const forecastData = await forecastRes.json();

        updateUI(currentData, forecastData);
        saveToHistory(city);

    } catch (error) {
        alert(error.message);
    } finally {
        loading.classList.add('hidden');
        weatherContent.style.opacity = '1';
    }
}

function updateUI(current, forecast) {
    document.getElementById('cityName').textContent = `${current.name}, ${current.sys.country}`;
    document.getElementById('condition').textContent = current.weather[0].main;
    document.getElementById('temperature').textContent = Math.round(current.main.temp) + '°';
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;
    
    document.getElementById('windSpeed').textContent = `${Math.round(current.wind.speed)} ${units==='metric'?'m/s':'mph'}`;
    document.getElementById('humidity').textContent = `${current.main.humidity}%`;
    document.getElementById('visibility').textContent = `${(current.visibility/1000).toFixed(1)} km`;

    const dailyData = forecast.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';

    dailyData.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        const html = `
        <div class="forecast-item">
            <div class="day-name">${dayName}</div>
            <div class="forecast-condition">
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" width="30">
                <small>${day.weather[0].main}</small>
            </div>
            <div class="forecast-temps">${Math.round(day.main.temp)}°</div>
        </div>`;
        forecastGrid.innerHTML += html;
    });

    updateChart(forecast.list.slice(0, 8));
}

function updateChart(hourlyData) {
    const container = document.getElementById('chartContainer');
    const labels = document.getElementById('chartLabels');
    container.innerHTML = '';
    labels.innerHTML = '';

    const maxTemp = Math.max(...hourlyData.map(d => d.main.temp));

    hourlyData.forEach(item => {
        const temp = Math.round(item.main.temp);
        const time = item.dt_txt.split(' ')[1].substring(0, 5); 
        
        const height = (temp / (maxTemp + 5)) * 100; 

        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${height}%`;
        bar.innerHTML = `<span class="bar-tooltip">${temp}°</span>`;
        container.appendChild(bar);

        const label = document.createElement('div');
        label.innerText = time;
        labels.appendChild(label);
    });
}

function saveFavorite() {
    let favorites = JSON.parse(localStorage.getItem('pastelFav')) || [];
    if (!favorites.includes(currentCity)) {
        favorites.push(currentCity);
        localStorage.setItem('pastelFav', JSON.stringify(favorites));
        loadFavorites();
    }
}

function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('pastelFav')) || [];
    const container = document.getElementById('favoritesList');
    container.innerHTML = '';

    if(favorites.length === 0) {
        container.innerHTML = '<div class="empty-state" style="grid-column: span 3; text-align:center; color:#aaa;">No favorites yet</div>';
        return;
    }

    favorites.forEach(city => {
        const div = document.createElement('div');
        div.className = 'mini-card';
        div.innerHTML = `<b>${city}</b>`;
        div.onclick = () => {
            currentCity = city;
            fetchWeatherData(city);
        };
        container.appendChild(div);
    });
}

function saveToHistory(city) {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    if (!history.includes(city)) {
        history.push(city);
        localStorage.setItem('searchHistory', JSON.stringify(history));
        
        const datalist = document.getElementById('citySuggestions');
        datalist.innerHTML = '';
        history.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            datalist.appendChild(opt);
        });
    }
}