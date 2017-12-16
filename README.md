# OpenWeatherMap-app for Homey

This app allows you to poll the OpenWeatherMap API for localised weather data and use this in your Homey home automation flows. Several instances (locations) can run simultaneously. In version 0.0.6 forecast data is added from the OpenWeatherMap 5-day view, refer to http://openweathermap.org/forecast5. During pairing you can choose the 3-hour interval you want to have weather data from. Interval 0 gives you data from the currently running 3-hour interval (should be close to the current weather), interval 8 gives data 24 hours ahead, etc.   

The OpenWeatherMap polling is based on the 'openweather-apis', refer to https://github.com/CICCIOSGAMINO/openweather-apis. 

# Screenshots
The mobile interface looks as follows:

![](https://drive.google.com/uc?id=1hUEi4D0QGifNUfk5uqPaIDbdZuvmlZci)

![](https://drive.google.com/uc?id=1rfCh8ZXmo3WBmkYD-RPTQgHEgePtN3rK)

![](https://drive.google.com/uc?id=1k25X5gkiGLikZThAHJvAK_pb7h_dOmA6)

# Features
Current fully supported capabilities in flow (triggers) and the mobile interface:

- temperature
- humidity
- barometric pressure
- wind speed
- wind angle
- rain

Only supported in the mobile interface:

- cloudcover
- weather description
- visibility (only available in data for current weather conditions)

Forecast capabilities will be added in a later version.

# Requirements
To use the app, you need to get a (free) OpenWeatherMap API key at http://openweathermap.org.
