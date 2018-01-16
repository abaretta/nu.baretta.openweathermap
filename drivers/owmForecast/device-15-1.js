/* From Homey SDK 2.0 docs: The file device.js is a representation of an already paired device on Homey */
'use strict';

const Homey = require('homey');
const weather = require('index.js');

class owmForecast extends Homey.Device {

    onInit() {
        this.log('device init');

        //   console.dir("getSettings: "); // for debugging
        //   console.dir(this.getSettings()); // for debugging
        //   console.dir("getData: "); // for debugging
        //   console.dir(this.getData()); // for debugging

        let settings = this.getSettings();
        let intervalHourly = 600;
        let forecastInterval = this.getSetting('forecastInterval') || 0;

        settings["lat"] = Homey.ManagerGeolocation.getLatitude();
        settings["lon"] = Homey.ManagerGeolocation.getLongitude();
        settings["units"] = Homey.ManagerI18n.getUnits();
        settings["language"] = Homey.ManagerI18n.getLanguage();
        settings["intervalHourly"] = intervalHourly;
        settings["forecastInterval"] = forecastInterval;
        // updating settings object for settings dialogue
        this.setSettings({
                language: Homey.ManagerI18n.getLanguage(),
                units: Homey.ManagerI18n.getUnits(),
                lat: Homey.ManagerGeolocation.getLatitude(),
                lon: Homey.ManagerGeolocation.getLongitude(),
                intervalHourly: intervalHourly,
                forecastInterval: forecastInterval,
            })
            //.then(this.log)
            .catch(this.error)

            this.pollWeatherHourly(settings);
/*
        let rainingCondition = new Homey.FlowCardCondition('is_raining');
        rainingCondition
            .register()
            .registerRunListener(( args, state ) => {
            
            if (this.getCapabilityValue('measure_rain') > 0 ) {    
                let raining = true;
            } else { let raining = false; }
            return Promise.resolve( raining );
                
            })
                
        let stopRainingAction = new Homey.FlowCardAction('stop_raining');
        stopRainingAction
            .register()
            .registerRunListener(( args, state ) => {
                
            let isStopped = rain.stop(); // true or false
            return Promise.resolve( isStopped );
                
            })
            */

    } // end onInit

    onAdded() {
        let id = this.getData().id;
        this.log('device added: ', id);

    } // end onAdded

    onDeleted() {

        let id = this.getData().id;

        clearInterval(this.pollingIntervalHourly);

        this.log('device deleted:', id);

    } // end onDeleted

    pollWeatherHourly(settings) {
        //run once, then at interval
        clearInterval(this.pollingIntervalHourly);
        this.pollOpenWeatherMapHourly(settings)
        this.pollingIntervalHourly = this.setIntervalImmediately( _ => {
            this.pollOpenWeatherMapHourly(settings)
        }, 1000 * settings.intervalHourly);
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
                    //.then(this.log)
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
                    if (settings["units"] == "metric") {
                        // convert from m/s to km/h
                        var windstrength = 3.6 * data.list[forecastInterval].wind.speed;
                    } else {
                        // windspeed in mph
                        var windstrength = data.list[forecastInterval].wind.speed;
                    }
                } else {
                    var windstrength = {};
                }

                if (data.list[forecastInterval].wind.deg) {
                    var windangle = data.list[forecastInterval].wind.deg;
                } else {
                    var windangle = null;
                }
                if (settings["units"] == "metric") {
                    // convert to beaufort and concatenate in a string with wind direction
                    var windcombined = this.degToCompass(settings, windangle) + " " + this.beaufortFromKmh(windstrength)
                } else {
                    var windcombined = this.degToCompass(settings, windangle) + " " + this.beaufortFromMph(windstrength)
                }
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

                    case 'forecastInterval':
                        this.log('forecastInterval changed to ' + newSettingsObj.forecastInterval);
                        settings.forecastInterval = newSettingsObj.forecastInterval;
                        break;

                    default:
                        this.log("Key not matched: " + i);
                        break;
                    }
                }
                    this.pollWeatherHourly(settings);
            callback(null, true)
        } catch (error) {
            callback(error, null)
        }
    }

    // function to make setInterval run once, then at interval
    setIntervalImmediately(func, interval) {
        func();
        return setInterval(func, interval);
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

    beaufortFromMph(mph) {
        var beaufortMphLimits = [1, 4, 8, 13, 19, 25, 32, 39, 47, 55, 64, 73, 111, 155, 208, 261, 320];
        // undefined for negative values...
        if (mph < 0 || mph == undefined) return undefined;

        var beaufortNum = beaufortMphLimits.reduce(function(previousValue, currentValue, index, array) {
            return previousValue + (mph > currentValue ? 1 : 0);
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
module.exports = owmForecast; 
