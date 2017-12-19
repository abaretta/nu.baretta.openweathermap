/* From Homey SDK 2.0 docs: The file device.js is a representation of an already paired device on Homey */
'use strict';

const Homey = require('homey');
const weather = require('index.js');

class openweathermap extends Homey.Device {


    onInit() {
            this.log('device init');

         //   console.dir("getSettings: "); // for debugging
         //   console.dir(this.getSettings()); // for debugging
         //   console.dir("getData: "); // for debugging
         //   console.dir(this.getData()); // for debugging

            let settings = this.getSettings();
            let intervalCurrent = 180;
            let intervalHourly = 600;
            let forecastInterval = this.getSetting('forecastInterval') || 0;
            let datasource = this.getSetting('datasource') || "current";

            settings["lat"] = Homey.ManagerGeolocation.getLatitude();
            settings["lon"] = Homey.ManagerGeolocation.getLongitude();
            settings["units"] = Homey.ManagerI18n.getUnits();
            settings["language"] = Homey.ManagerI18n.getLanguage();
            settings["intervalCurrent"] = intervalCurrent;
            settings["intervalHourly"] = intervalHourly;
            settings["forecastInterval"] = forecastInterval;
            settings["datasource"] = datasource;
            // updating settings object for settings dialogue
            this.setSettings({
                    language: Homey.ManagerI18n.getLanguage(),
                    units: Homey.ManagerI18n.getUnits(),
                    lat: Homey.ManagerGeolocation.getLatitude(),
                    lon: Homey.ManagerGeolocation.getLongitude(),
                    intervalCurrent: intervalCurrent,
                    intervalHourly: intervalHourly,
                    forecastInterval: forecastInterval,
                    datasource: datasource,
                })
                .then(this.log)
                .catch(this.error)

            if (settings.datasource == "forecast") {
                this.pollWeatherHourly(settings);
            } else if (settings.datasource == "current") {
                this.pollWeatherCurrent(settings);
            }

        } // end onInit

    onAdded() {
            let id = this.getData().id;
            this.log('device added: ', id);

        } // end onAdded

    onDeleted() {

            let id = this.getData().id;


            if (this.getSetting('datasource') == "forecast") {
                clearInterval(this.getSetting('intervalHourly'));
            } else if (this.getSettings('datasource') == "current") {
                clearInterval(this.getSetting('intervalCurrent'));
            }

            this.log('device deleted:', id);

        } // end onDeleted

    pollWeatherCurrent(settings) {
        //run once, then at interval
        clearInterval(settings.intervalCurrent);
        this.pollOpenWeatherMapCurrent(settings)
        this.pollingInterval = setInterval(() => {
            this.pollOpenWeatherMapCurrent(settings)
        }, 1000 * settings.intervalCurrent);
    }

    pollWeatherHourly(settings) {
        //run once, then at interval
        clearInterval(settings.intervalHourly);
        this.pollOpenWeatherMapHourly(settings)
        this.pollingInterval = setInterval(() => {
            this.pollOpenWeatherMapHourly(settings)
        }, 1000 * settings.intervalHourly);
    }

    pollOpenWeatherMapCurrent(settings) {
        this.log("polling weather..." + settings.GEOlocation);

        weather.getURLCurrent(settings).then(url => {
                return weather.getWeatherData(url);
            })
            .then(data => {
                //   this.log(settings);
                //   this.log(data);

                var GEOlocation = data.name + ", " + data.sys.country

                this.setSettings({
                        GEOlocation: GEOlocation,
                    })
                    .then(this.log)
                    .catch(this.error)

                var temp = data.main.temp
                var temp_min = data.main.temp_min
                var temp_max = data.main.temp_max
                var hum = data.main.humidity
                var pressure = data.main.pressure
                    // return the rain in mm if present
                if (data.precipitation) {
                    var rain = data.precipitation.value;
                } else {
                    var rain = 0;
                }

                if (data.rain) {
                    var rain3h = data.rain;
                    //  smartJSON.rain = Math.round(rain3h['3h'] / 3);
                    var rain = rain3h['3h'] / 3;
                }
                if (data.wind.speed) {
                    // convert from m/s to km/h
                    var windstrength = 3.6 * data.wind.speed;
                } else {
                    var windstrength = {};
                }

                if (data.wind.deg) {
                    var windangle = data.wind.deg;
                } else {
                    var windangle = null;
                }
                // convert to beaufort and concatenate in a string with wind direction
                var windcombined = this.degToCompass(settings, windangle) + " " + this.beaufortFromKmh(windstrength)
                var cloudiness = data.clouds.all
                var visibility = data.visibility
                var description = data.weather[0].description

                var date_txt = new Date(data.dt * 1e3).toISOString().slice(-24, -5);
                date_txt = date_txt.replace('T', ' ');

                if (this.getSetting('datasource') == "current") {

                    this.setCapabilityValue('measure_temperature', temp)
                    this.setCapabilityValue('measure_temp_min', temp_min)
                    this.setCapabilityValue('measure_temp_max', temp_max)
                    this.setCapabilityValue('date_txt', date_txt)
                    this.setCapabilityValue('measure_humidity', hum)
                    this.setCapabilityValue('measure_pressure', pressure)
                    this.setCapabilityValue('measure_rain', rain)
                    this.setCapabilityValue('measure_wind_combined', windcombined)
                    this.setCapabilityValue('measure_wind_strength', windstrength)
                    this.setCapabilityValue('measure_wind_angle', windangle)
                    this.setCapabilityValue('measure_cloudiness', cloudiness)
                    this.setCapabilityValue('measure_visibility', visibility)
                    this.setCapabilityValue('description', description)
                }
            })
            .catch(error => {
                this.log(error);
            });
    }

    pollOpenWeatherMapHourly(settings) {
        this.log("polling weather..." + settings.GEOlocation);

        weather.getURLHourly(settings).then(url => {
                return weather.getWeatherData(url);
            })
            .then(data => {
               // this.log(settings);
               // this.log(data);

                var GEOlocation = data.city.name + ", " + data.city.country

                this.setSettings({
                        GEOlocation: GEOlocation,
                    })
                    .then(this.log)
                    .catch(this.error)

                var forecastInterval = this.getSetting('forecastInterval');
                var temp = data.list[forecastInterval].main.temp
                var temp_min = data.list[forecastInterval].main.temp_min
                var temp_max = data.list[forecastInterval].main.temp_max
                var pressure = data.list[forecastInterval].main.pressure
                var hum = data.list[forecastInterval].main.humidity
                var cloudiness = data.list[forecastInterval].clouds.all
                var description = data.list[forecastInterval].weather[0].description

                if (data.list[forecastInterval].precipitation) {
                    var rain = data.list[forecastInterval].precipitation.value;
                } else {
                    var rain = 0;
                }

                if (data.list[forecastInterval].rain) {
                    if (data.list[forecastInterval].rain == undefined) {
                        var rain = 0;
                    }
                } else {
                    var rain3h = data.list[forecastInterval].rain;
                    //  smartJSON.rain = Math.round(rain3h['3h'] / 3);
                    var rain = rain3h['3h'] / 3;
                }
                if (data.list[forecastInterval].wind.speed) {
                    var windstrength = 3.6 * data.list[forecastInterval].wind.speed;
                } else {
                    var windstrength = {};
                }

                if (data.list[forecastInterval].wind.deg) {
                    var windangle = data.list[forecastInterval].wind.deg;
                } else {
                    var windangle = null;
                }
                var windcombined = this.degToCompass(settings, windangle) + " " + this.beaufortFromKmh(windstrength)
                var date_txt = data.list[forecastInterval].dt_txt;

/*
                this.log("forecast interval")
                this.log(forecastInterval)
                this.log("temp forecast")
                this.log(temp)
                this.log("forecast description")
                this.log(description)
                this.log("date_txt")
                this.log(date_txt)
                this.log("forecast rain")
                this.log(rain)
                this.log("temp_min")
                this.log(temp_min)
                this.log("temp_max")
                this.log(temp_max)
                this.log("City")
                this.log(data.city.name)
                this.log("Country")
                this.log(data.city.country)
                this.log("GEOlocation")
                this.log(GEOlocation)
                this.log("getSetting(datasource)")
                this.log(this.getSetting('datasource')) 
*/

                if (this.getSetting('datasource') == "forecast") {

                    this.setCapabilityValue('measure_temperature', temp)
                    this.setCapabilityValue('measure_temp_min', temp_min)
                    this.setCapabilityValue('measure_temp_max', temp_max)
                    this.setCapabilityValue('date_txt', date_txt)
                    this.setCapabilityValue('measure_humidity', hum)
                    this.setCapabilityValue('measure_pressure', pressure)
                    this.setCapabilityValue('measure_rain', rain)
                    this.setCapabilityValue('measure_wind_combined', windcombined)
                    this.setCapabilityValue('measure_wind_strength', windstrength)
                    this.setCapabilityValue('measure_wind_angle', windangle)
                    this.setCapabilityValue('measure_cloudiness', cloudiness)
                 // not available in hourly API data
                 // this.setCapabilityValue('measure_visibility', visibility)
                    this.setCapabilityValue('description', description)

                }
            })
            .catch(error => {
                this.log(error);
            });
    }

    onSettings(settings, newSettingsObj, changedKeysArr, callback) {
        try {
            for (var i = 0; i < changedKeysArr.length; i++) {
                switch (changedKeysArr[i]) {
                    case 'APIKey':
                        this.log('APIKey changed to ' + newSettingsObj.APIKey);
                        settings.APIKey = newSettingsObj.APIKey;
                        break;

                    case 'GEOlocationCity':
                        this.log('GEOlocationCity changed to ' + newSettingsObj.GEOlocationCity);
                        settings.GEOlocationCity = newSettingsObj.GEOlocationCity;
                        break;

                    case 'GEOlocationZip':
                        this.log('GEOlocationZip changed to ' + newSettingsObj.GEOlocationZip);
                        settings.GEOlocationZip = newSettingsObj.GEOlocationZip;
                        break;

                    case 'language':
                        this.log('language changed to ' + newSettingsObj.language);
                        settings.language = newSettingsObj.language;
                        break;

                    case 'units':
                        this.log('units changed to ' + newSettingsObj.units);
                        settings.units = newSettingsObj.units;
                        break;

                    case 'forecastInterval':
                        this.log('forecastInterval changed to ' + newSettingsObj.forecastInterval);
                        settings.forecastInterval = newSettingsObj.forecastInterval;
                        break;

                    case 'datasource':
                        this.log('datasource changed to ' + newSettingsObj.datasource);
                        settings.datasource = newSettingsObj.datasource;
                        break;

                    default:
                        this.log("Key not matched: " + i);
                }
                if (newSettingsObj.datasource == "forecast") {
                    clearInterval(settings.intervalCurrent);
                    this.pollWeatherHourly(settings);
                } else if (newSettingsObj.datasource == "current") {
                    clearInterval(settings.intervalHourly);
                    this.pollWeatherCurrent(settings);
                }
            }
            callback(null, true)
        } catch (error) {
            callback(error)
        }
    }



    beaufortFromKmh(kmh) {
        var beaufortKmhLimits = [1, 6, 11, 19, 30, 39, 50, 61, 74, 87, 102, 117, 177, 249, 332, 418, 512];
        // undefined for negative values...
        if (kmh < 0 || kmh == undefined) return undefined;

        var beaufortNum = beaufortKmhLimits.reduce(function(previousValue, currentValue, index, array) {
            return previousValue + (kmh > currentValue ? 1 : 0);
        }, 0);
        return beaufortNum;
    }

    degToCompass(settings, num) {
        while (num < 0) num += 360;
        while (num >= 360) num -= 360;
        var val = Math.round((num - 11.25) / 22.5);
        if (settings['language'] == "nl") {
            var arr = ["N", "NNO", "NO", "ONO", "O", "OZO", "ZO", "ZZO", "Z", "ZZW", "ZW", "WZW", "W", "WNW", "NW", "NNW"];
        } else {
            var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        }
        return arr[Math.abs(val)];
    }
}
module.exports = openweathermap;
