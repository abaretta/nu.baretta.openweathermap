# OpenWeatherMap-app for Homey

This app allows you to poll the OpenWeatherMap API for localised weather data and use this in your Homey home automation flows. Several instances (locations) can run simultaneously. Note that the current version is no longer backward compatible with Homey V1. For V1 users an alpha version is able on request.

# Current weather

The 'current weather' data comes from the OWM current weather data, refer to http://openweathermap.org/current. It includes visibility, sunrise and sunset data which are not included in the forecast tables. Note that the max. and min. temperatures in the current data indicate the possible range in which the actual temperature is expected, it can be seen as a measure for the standard deviation of the current temperature.

# Forecast up to 5 days

The five day forecast data (refer to http://openweathermap.org/forecast5) includes forecasts in 3-hour intervals up to 5 days in the future. During pairing you can choose the 3-hour interval you want to have weather data from. Interval 1 gives you data from the currently running 3-hour interval (between one hour ago/two hours ahead) which should be close to the current weather. Interval 8 gives data 24 hours ahead, etc. In this dataset the maximum and minimum temperatures are the expected maximum and minimum temperature, as you would expect.

# Long term weather

The long term weather forecast gives data for up to 16 days in the future, in daily intervals (refer to http://openweathermap.org/forecast16). Included in the data is the daily, morning, evening and night temperature.

The OpenWeatherMap polling is inspired by the 'openweather-apis', refer to https://github.com/CICCIOSGAMINO/openweather-apis. 

Please use the forum for questions and comments related to the app: https://forum.athom.com/discussion/4225/.

# Pairing
Settings can be changed after pairing. By default Homey's location is used, optionally a different location can be entered, either by name (city and countrycode, e.g. 'Paris,FR'), or by entering a zip code.

Both methods can be tested by querying the OpenWeathMap site directly. For testing a location by location, enter the following (fill in your own <city,country> combination as well as the API key):
`https://api.openweathermap.org/data/2.5/weather?q=<city,countrycode>&APPID=<API key>`

For testing a zip code, enter the following in a browser (fill in your <zipcode,country> combination as well as the API key):
`https://api.openweathermap.org/data/2.5/weather?zip=<zipcode,country>&APPID=<API key>`

# Flow cards
For nearly all parameters trigger and condition cards are included, see screenshot for most flowcards available for the current weather (V1):

<img src="https://drive.google.com/uc?id=1EY31UQeJNCxVy34wmswthY81SVVjqJCT">

# Requirements
To use the app, you need to get a (free) OpenWeatherMap API key at http://openweathermap.org. A single API key is sufficient for adding dozens of locations in the app.. 
