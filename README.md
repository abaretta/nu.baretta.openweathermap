# OpenWeatherMap-app for Homey

This app allows you to poll the OpenWeatherMap API for localised weather data and use this in your Homey home automation flows. Several instances (locations) can run simultaneously. 

Forecast data has been added to the app from the OpenWeatherMap 5-day view, refer to http://openweathermap.org/forecast5. During pairing you can choose the 3-hour interval you want to have weather data from. Interval 0 gives you data from the currently running 3-hour interval (should be close to the current weather), interval 8 gives data 24 hours ahead, etc.   

The OpenWeatherMap polling is inspired by the 'openweather-apis', refer to https://github.com/CICCIOSGAMINO/openweather-apis. 

Please use the forum for questions and comments related to the app.

# Screenshots
The mobile interface looks as follows:

<img src="https://drive.google.com/uc?id=1Ns1SEdjUOFKDwErjlksOl9HkWFK36zRv" width="500" height="400">
<img src="https://drive.google.com/uc?id=1Q4YnBOGltirnj6uILvRH2-ph8BoCSCkA" width="500" height="400">
<img src="https://drive.google.com/uc?id=1NwVUnUOZWukPqsuItX67Wskljd1_7sHV" width="500" height="400">

The pairing view:

<img src="https://drive.google.com/uc?id=1r_MclxSsvWH_LMkfDEbFgll73eKEGyTL" >

Settings can be changed after pairing:

<img src="https://drive.google.com/uc?id=1sqyaFJEKcFdo9L-MFsyawKvWUlY3bhrn" >

# Features
Current fully supported capabilities in flow (triggers) and the mobile interface:

- temperature
- humidity
- barometric pressure
- wind speed
- wind angle
- rain

Tracked in insights but not useable in flows yet:

- minimum temperature
- maximum temperature

Only supported in the mobile interface:

- weather description
- visibility (only available in data for current weather conditions)
- date (timestamp for API data)


# Requirements
To use the app, you need to get a (free) OpenWeatherMap API key at http://openweathermap.org.
