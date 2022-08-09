// DOM Elements
const addressInput = document.querySelector("[data-address-input]");
const searchBtn = document.querySelector("[data-search-btn]");

// Main-card
const cardMain = document.getElementById("card-main");
const cityName = document.querySelector("[data-city-name]");
const date = document.querySelector("[data-date]");
const temperature = document.querySelector("[data-temperature]");
const sky = document.querySelector("[data-sky]");
const sunrise = document.querySelector("[data-sunrise]");
const humidity = document.querySelector("[data-humidity]");
const sunset = document.querySelector("[data-sunset]");

// Main-card -- Temperatures
const tempMorning = document.querySelector("[data-temp-morning");
const tempDay = document.querySelector("[data-temp-day");
const tempEvening = document.querySelector("[data-temp-evening");
const tempNight = document.querySelector("[data-temp-night");

// Small Cards
const windData = document.querySelector("[data-wind-data]");
const rainChance = document.querySelector("[data-rain-chance]");
const pressure = document.querySelector("[data-pressure]");
const uvi = document.querySelector("[data-uvi]");

// All display elements
const variablesElements = [
    cityName,
    date,
    temperature,
    sky,
    sunrise,
    humidity,
    sunset,
    tempMorning,
    tempDay,
    tempEvening,
    tempNight,
    windData,
    rainChance,
    pressure,
    uvi
];

// Variables
let night = false;
const step = 0.01;

// Geocoding API
const GEOCODING_API_KEY = "483ee3e05aca5c61375fb0f20b0bf769";
const LIMIT = 1;

async function getCoordinatesByAddress(address) {
    const GEOCODING_URL = `http://api.positionstack.com/v1/forward?access_key=${GEOCODING_API_KEY}&query=${encodeURIComponent(address)}&limit=${LIMIT}`;
    console.log("🚀 ~ file: app.js ~ line 20 ~ getCoordinatesByAddress ~ GEOCODING_URL => ", GEOCODING_URL)
    let response = await fetch(GEOCODING_URL);
    console.log(response);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data = await response.json();

    return data.data[0];
}

// Weather API
const WEATHER_API_KEY = "0f2d4af59d8fa39de5f0b128b8488e00";
const EXCLUDE = "hourly,minutely";

async function getWeatherByCoordinates(placeData) {
    const WEATHER_URL = `https://api.openweathermap.org/data/2.5/onecall?lat=${placeData.latitude}&lon=${placeData.longitude}&exclude=${EXCLUDE}&appid=${WEATHER_API_KEY}`;
    console.log("🚀 ~ file: app.js ~ line 41 ~ getWeatherByCoordinates ~ WEATHER_URL => ", WEATHER_URL)
    const response = await fetch(WEATHER_URL);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return data;
}

// App

searchBtn.addEventListener('click', async () => {
    const ADDRESS = addressInput.value;
    if (ADDRESS == null || ADDRESS.trim() === '') return;
    togglePendingElements(variablesElements);
    await getWeatherData(ADDRESS);
    togglePendingElements(variablesElements);
})

function togglePendingElements(elements) {
    elements.forEach(el => {
        el.toggleAttribute("data-pending");
    });
}

async function getWeatherData(address) {
    const placeData = await getCoordinatesByAddress(address);
    const weatherData = await getWeatherByCoordinates(placeData);
    displayWeatherData(placeData, weatherData);
}

function displayWeatherData(placeData, weatherData) {
    console.log("Display Weather Data");
    console.log(placeData);
    console.log(weatherData);

    cityName.innerText = placeData.locality || placeData.county || placeData.country;

    let dateString = handleDateTime(weatherData.current.dt, weatherData.timezone);
    date.innerText = dateString;

    temperature.innerText = kelvinToCelcius(weatherData.current.temp) + "°";

    sky.innerText = weatherData.current.weather[0].main;

    let options = { timeZone: weatherData.timezone, hour: '2-digit', minute: '2-digit' }
    sunrise.innerText = new Date(weatherData.current.sunrise * 1000).toLocaleTimeString("fr", options);

    humidity.innerText = weatherData.current.humidity + "%";

    sunset.innerText = new Date(weatherData.current.sunset * 1000).toLocaleTimeString("fr", options);;

    displayTempInfos(weatherData.daily[0].temp);

    displayCardBg(weatherData.current.weather[0].icon);

    displayWindData(Math.round(weatherData.current.wind_speed * 3.6), weatherData.current.wind_deg);

    rainChance.innerText = Math.round(parseFloat(weatherData.daily[0].pop) * 100) + "%";

    pressure.innerText = weatherData.current.pressure + "hPa";

    uvi.innerText = weatherData.current.uvi;
}

function handleDateTime(dt, timezone) {
    let date = new Date(dt * 1000);
    let timeZoneDate = date.toLocaleString('en-US', { timeZone: `${timezone}` });
    timeZoneDate = new Date(timeZoneDate);

    if (timeZoneDate.getHours() < 6 || timeZoneDate.getHours() >= 21) night = true;

    let day = timeZoneDate.getDay();
    let today = new Date(Date.now()).getDay();
    let dateString = '';
    if (day === today) {
        let hour = timeZoneDate.getHours();
        let minute = String(timeZoneDate.getMinutes()).padStart(2, '0');
        dateString = `Today ${hour}:${minute}`;
    } else {
        dateString = new Intl.DateTimeFormat('default', {
            month: 'numeric',
            day: 'numeric',
            hc: 'h24',
            hour: 'numeric',
            minute: 'numeric'
        }).format(timeZoneDate);
    }

    return dateString;
}

function kelvinToCelcius(kelvin) {
    return Math.round(kelvin - 273.15);
}

function displayTempInfos(temps) {
    let tempMorn = kelvinToCelcius(temps.morn);
    let tempDay = kelvinToCelcius(temps.day);
    let tempEvening = kelvinToCelcius(temps.eve);
    let tempNight = kelvinToCelcius(temps.night);

    let tempsArray = [];

    let keys = Object.keys(temps);
    let values = Object.values(temps);

    for (let i = 0; i < keys.length; i++) {
        if (keys[i] !== "min" && keys[i] !== "max") tempsArray[keys[i]] = kelvinToCelcius(values[i]);
    }

    displayDayTemps(tempsArray);

    displayTempGraph(tempsArray);
}

function displayDayTemps(temps) {
    tempMorning.innerText = temps['morn'] + "°";
    tempDay.innerText = temps['day'] + "°";
    tempEvening.innerText = temps['eve'] + "°";
    tempNight.innerText = temps['night'] + "°";
}

function displayTempGraph(temps) {
    let max = 0;
    let min = Infinity;
    for (const key in temps) {
        if (temps[key] > max) max = temps[key];
        if (temps[key] < min) min = temps[key];
    }

    let scaledTemp = [];
    let scaleMin = -5 < min ? -5 : min;
    let scaleMax = 40 > max ? 40 : max;
    for (const key in temps) {
        scaledTemp[key] = scale(temps[key], scaleMin, scaleMax, 0.1, 0.9).toFixed(2);
    }

    const earlyEl = document.querySelector('[data-early-temp]');
    const mornEl = document.querySelector('[data-morn-temp]');
    const dayEl = document.querySelector('[data-day-temp]');
    const eveEl = document.querySelector('[data-eve-temp]');
    const nightEl = document.querySelector('[data-night-temp]');

    function increaseValue(el, position, target, incrementer) {
        // Previous value
        let previous = parseFloat(getComputedStyle(el).getPropertyValue('--' + position));

        // Increase Value
        if (previous < target) el.style.setProperty('--' + position, previous + (step * (Math.abs(previous - target)) * 10));
        if (previous > target) el.style.setProperty('--' + position, previous - (step * (Math.abs(previous - target)) * 10));

        // If value is reached
        if (parseFloat(previous).toFixed(2) == parseFloat(target).toFixed(2)) {
            clearInterval(eval(incrementer));
        }
    }

    incrementerEarlyStart = setInterval(function () { increaseValue(earlyEl, 'start', (scaledTemp['morn'] - 0.05), 'incrementerEarlyStart') }, 50);
    incrementerEarlyEnd = setInterval(function () { increaseValue(earlyEl, 'end', scaledTemp['morn'], 'incrementerEarlyEnd') }, 50);
    incrementerMornStart = setInterval(function () { increaseValue(mornEl, 'start', scaledTemp['morn'], 'incrementerMornStart') }, 50);
    incrementerMornEnd = setInterval(function () { increaseValue(mornEl, 'end', scaledTemp['day'], 'incrementerMornEnd') }, 50);
    incrementerDayStart = setInterval(function () { increaseValue(dayEl, 'start', scaledTemp['day'], 'incrementerDayStart') }, 50);
    incrementerDayEnd = setInterval(function () { increaseValue(dayEl, 'end', scaledTemp['eve'], 'incrementerDayEnd') }, 50);
    incrementerEveStart = setInterval(function () { increaseValue(eveEl, 'start', scaledTemp['eve'], 'incrementerEveStart') }, 50);
    incrementerEveEnd = setInterval(function () { increaseValue(eveEl, 'end', scaledTemp['night'], 'incrementerEveEnd') }, 50);
    incrementerNightStart = setInterval(function () { increaseValue(nightEl, 'start', scaledTemp['night'], 'incrementerNightStart') }, 50);
    incrementerNightEnd = setInterval(function () { increaseValue(nightEl, 'end', (scaledTemp['night'] - 0.05), 'incrementerNightEnd') }, 50);
}

function scale(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function displayCardBg(weatherCode){
    const clearBackgrounds = ["01d", "02d", "03d", "04d", "09d", "10d", "13d"];
    if (clearBackgrounds.includes(weatherCode)) {
        cardMain.style.color = "#201F2E";
    } else {
        cardMain.style.color = "#ECF3F8";
    }
    
    cardMain.style.backgroundImage = `url('../img/${weatherCode}.jpg')`;
}

function displayWindData(windSpeed, windDegrees) {
    let direction = degreesToDirection(windDegrees);
    windData.innerText = `${windSpeed}km/h 🧭${direction}`;
}

function degreesToDirection(degrees) {
    console.log(degrees);
    var directions = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"]
    var index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 45) % 8;
    return directions[index];
}