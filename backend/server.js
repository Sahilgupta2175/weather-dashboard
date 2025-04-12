const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Debug environment variables
console.log('Environment variables loaded:');
console.log('- PORT:', process.env.PORT);
console.log('- API KEY exists:', !!process.env.OPENWEATHERMAP_API_KEY);
console.log('- API KEY length:', process.env.OPENWEATHERMAP_API_KEY ? process.env.OPENWEATHERMAP_API_KEY.length : 0);

// Exit if no API key
if (!process.env.OPENWEATHERMAP_API_KEY) {
  console.error('ERROR: Missing OpenWeatherMap API key in .env file');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/weather', async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }
    
    console.log(`Fetching weather for: ${city}`);
    
    // URL encode the city name and trim API key
    const encodedCity = encodeURIComponent(city);
    const apiKey = process.env.OPENWEATHERMAP_API_KEY.trim();
    
    // Use axios config object instead of URL string
    const response = await axios({
      method: 'get',
      url: 'https://api.openweathermap.org/data/2.5/weather',
      params: {
        q: encodedCity,
        appid: apiKey,
        units: 'metric'
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('API response status:', response.status);
    
    const weatherData = {
      city: response.data.name,
      country: response.data.sys.country,
      temperature: response.data.main.temp,
      feels_like: response.data.main.feels_like,
      humidity: response.data.main.humidity,
      condition: response.data.weather[0].main, 
      description: response.data.weather[0].description,
      icon: response.data.weather[0].icon,
      wind_speed: response.data.wind.speed,
      timestamp: new Date(response.data.dt * 1000).toISOString()
    };
    
    res.json(weatherData);
  } catch (error) {
    console.error('Weather API Error:', error.message);
    
    // Detailed error logging
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- Data:', JSON.stringify(error.response.data));
      
      if (error.response.status === 401) {
        return res.status(500).json({ 
          error: 'API key authentication failed. Check your OpenWeatherMap API key.'
        });
      }
      
      if (error.response.status === 404) {
        return res.status(404).json({ error: 'City not found' });
      }
    }
    
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Weather API is running');
});

// API key verification function
const verifyApiKey = async () => {
  try {
    console.log('Verifying API key...');
    const apiKey = process.env.OPENWEATHERMAP_API_KEY.trim();
    
    const response = await axios({
      method: 'get',
      url: 'https://api.openweathermap.org/data/2.5/weather',
      params: {
        q: 'London',
        appid: apiKey,
        units: 'metric'
      }
    });
    
    console.log('API key verification successful! Response status:', response.status);
    return true;
  } catch (error) {
    console.error('API key verification failed:', error.message);
    if (error.response) {
      console.error('Error details:', JSON.stringify(error.response.data));
    }
    return false;
  }
};

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await verifyApiKey();
});