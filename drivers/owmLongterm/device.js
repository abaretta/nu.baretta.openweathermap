/* From Homey SDK 2.0 docs: The file device.js is a representation of an already paired device on Homey */
'use strict';

const Homey = require('homey');
const weather = require('index.js');

class owmForecast extends Homey.Device {

    onInit() {
        this.log('device init');
        let settings = this.getSettings();
        let forecastInterval = this.getSetting('forecastInterval') || 0;
        let name = this.getName() + '_' + this.getData().id;
        let cronName = name.toLowerCase();

        settings["lat"] = Homey.ManagerGeolocation.getLatitude();
        settings["lon"] = Homey.ManagerGeolocation.getLongitude();
        settings["units"] = Homey.ManagerI18n.getUnits();
        settings["language"] = Homey.ManagerI18n.getLanguage();
        settings["forecastInterval"] = forecastInterval;

        // updating settings object for settings dialogue
        this.setSettings({
                language: Homey.ManagerI18n.getLanguage(),
                units: Homey.ManagerI18n.getUnits(),
                lat: Homey.ManagerGeolocation.getLatitude(),
                lon: Homey.ManagerGeolocation.getLongitude(),
                forecastInterval: forecastInterval,
            })
            .catch(this.error)

        Homey.ManagerCron.getTask(cronName)
            .then(task => {
                this.log("The task exists: " + cronName);
                task.on('run', () => this.pollOpenWeatherMapDaily(settings));
            })
            .catch(err => {
                if (err.code == 404) {
                    this.log("The task has not been registered yet, registering task: " + cronName);
                    Homey.ManagerCron.registerTask(cronName, "14 * * * *", settings)
                        .then(task => {
                            task.on('run', () => this.pollOpenWeatherMapDaily(settings));
                        })
                        .catch(err => {
                            this.log(`problem with registering cronjob: ${err.message}`);
                        });
                } else {
                    this.log(`other cron error: ${err.message}`);
                }
            });

        // Flows

        this._flowTriggerWeatherChanged = new Homey.FlowCardTriggerDevice('WeatherChanged')
            .register()

        this._flowTriggerMinTempChanged = new Homey.FlowCardTriggerDevice('MintempChanged')
            .register()

        this._flowTriggerMaxTempChanged = new Homey.FlowCardTriggerDevice('MaxtempChanged')
            .register()

        this._flowTriggerMornTempChanged = new Homey.FlowCardTriggerDevice('MorntempChanged')
            .register()

        this._flowTriggerEveTempChanged = new Homey.FlowCardTriggerDevice('EvetempChanged')
            .register()

        this._flowTriggerNightTempChanged = new Homey.FlowCardTriggerDevice('NighttempChanged')
            .register()

        this._flowTriggerWindBeaufortChanged = new Homey.FlowCardTriggerDevice('WindBeaufortChanged')
            .register()

        this._flowTriggerWindDirectionCompassChanged = new Homey.FlowCardTriggerDevice('WindDirectionCompassChanged')
            .register()

        this._flowTriggerCloudinessChanged = new Homey.FlowCardTriggerDevice('CloudinessChanged')
            .register()

        // Register conditions for flows

        this.weatherCondition = new Homey.FlowCardCondition('conditioncode').register()
            .registerRunListener((args, state) => {
                var result = (weather.conditionToString(this.getCapabilityValue('conditioncode')) == args.argument_main)
                return Promise.resolve(result);
            })

        this._conditionTemp = new Homey.FlowCardCondition("Temp").register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_temperature') >= args.degrees);
                return Promise.resolve(result);
            })

        this._conditionTempmin = new Homey.FlowCardCondition("Tempmin").register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_temp_min') >= args.degrees);
                return Promise.resolve(result);
            })

        this._conditionTempmax = new Homey.FlowCardCondition("Tempmax").register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_temp_max') >= args.degrees);
                return Promise.resolve(result);
            })

        this._conditionTempeve = new Homey.FlowCardCondition("Tempeve").register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_temp_evening') >= args.degrees);
                return Promise.resolve(result);
            })

        this._conditionTempmorn = new Homey.FlowCardCondition("Tempmorn").register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_temp_morning') >= args.degrees);
                return Promise.resolve(result);
            })

        this._conditionTempnight = new Homey.FlowCardCondition("Tempnight").register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_temp_night') >= args.degrees);
                return Promise.resolve(result);
            })

        this._conditionPressure = new Homey.FlowCardCondition("Pressure").register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_pressure') >= args.bar);
                return Promise.resolve(result);
            })

        this._conditionClouds = new Homey.FlowCardCondition("Clouds").register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_cloudiness') >= args.cloudiness);
                return Promise.resolve(result);
            })

        this._conditionHumidity = new Homey.FlowCardCondition("Humidity").register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_humidity') >= args.humidity);
                return Promise.resolve(result);
            })

        this._conditionWindspeed = new Homey.FlowCardCondition("Windspeed").register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_wind_strength') >= args.windspeed);
                return Promise.resolve(result);
            })

        this._conditionWindforce = new Homey.FlowCardCondition("Windforce").register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_windstrength_beaufort') >= args.windforce);
                return Promise.resolve(result);
            })

        this._conditionWinddirection = new Homey.FlowCardCondition("Winddirection").register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_wind_direction_string') == args.winddirection);
                return Promise.resolve(result);
            })

        //run once to get the first data
        this.pollOpenWeatherMapDaily(settings);

    } // end onInit

    onAdded() {
        let id = this.getData().id;
        this.log('device added: ', id);

    } // end onAdded

    onDeleted() {

        let id = this.getData().id;
        let name = this.getName() + '_' + this.getData().id;
        let cronName = name.toLowerCase();
        this.log('Unregistering cron:', cronName);
        Homey.ManagerCron.unregisterTask(cronName, function (err, success) {});
        // Homey.ManagerCron.unregisterAllTasks(function (err, success) {});

        this.log('device deleted:', id);

    } // end onDeleted

    pollOpenWeatherMapDaily(settings) {

        weather.getURLDaily(settings).then(url => {
                return weather.getWeatherData(url);
            })
            .then(data => {
                let device = this;
                let forecastInterval = this.getSetting('forecastInterval');
                this.log("Received OWM data");

                var GEOlocation = data.city.name + ", " + data.city.country;

                this.setSettings({
                        GEOlocation: GEOlocation,
                    })
                    .catch(this.error);

                var conditioncode = data.list[forecastInterval].weather[0].id;
                this.log("current condition: ")
                this.log(weather.conditionToString(conditioncode));

                var temp = data.list[forecastInterval].temp.day
                var temp_min = data.list[forecastInterval].temp.min
                var temp_max = data.list[forecastInterval].temp.max
                var temp_night = data.list[forecastInterval].temp.night
                var temp_eve = data.list[forecastInterval].temp.eve
                var temp_morn = data.list[forecastInterval].temp.morn
                var pressure = data.list[forecastInterval].pressure
                var hum = data.list[forecastInterval].humidity
                var cloudiness = data.list[forecastInterval].clouds
                this.log("cloudiness: ");
                this.log(cloudiness);
                var description = data.list[forecastInterval].weather[0].description

                if (data.list[forecastInterval].rain) {
                    var rain3h = data.list[forecastInterval].rain;
                    var rain = rain3h / 3;
                } else {
                    var rain = 0;
                }

                if (data.list[forecastInterval].deg) {
                    var windangle = data.list[forecastInterval].deg;
                } else {
                    var windangle = null;
                }

                if (data.list[forecastInterval].speed) {
                    var winddegcompass = weather.degToCompass(settings, windangle);
                    if (settings["units"] == "metric") {
                        // convert from m/s to km/h
                        var windstrength = 3.6 * data.list[forecastInterval].speed;
                    } else {
                        // windspeed in mph
                        var windstrength = data.list[forecastInterval].speed;
                    }
                } else {
                    var windstrength = {};
                }

                if (settings["units"] == "metric") {
                    // convert to beaufort and concatenate in a string with wind direction
                    var windspeedbeaufort = weather.beaufortFromKmh(windstrength);
                    var windcombined = weather.degToCompass(settings, windangle) + " " + weather.beaufortFromKmh(windstrength)
                } else {
                    var windspeedbeaufort = weather.beaufortFromMph(windstrength);
                    var windcombined = weather.degToCompass(settings, windangle) + " " + weather.beaufortFromMph(windstrength)
                }

                var date_txt = new Date(data.list[forecastInterval].dt * 1e3).toISOString().slice(-24, -5);
                date_txt = date_txt.replace('T', ' ');

                this.log("Comparing variables before and after current polling interval");

                if (this.getCapabilityValue('conditioncode') != conditioncode) {
                    this.setCapabilityValue('conditioncode', conditioncode);
                }
                if (this.getCapabilityValue('measure_temperature') != temp) {
                    this.setCapabilityValue('measure_temperature', temp);
                }
                if (this.getCapabilityValue('measure_temp_min') != temp_min) {
                    this.log("temp_min has changed. Old min_temp: " + this.getCapabilityValue('measure_temperature_min') + " New min temp: " + temp_min);
                    let state = {
                        "measure_temp_min": temp_min
                    };
                    let tokens = {
                        "measure_temp_min": temp_min,
                        "location": GEOlocation
                    };
                    this.triggerMinTempChangedFlow(device, tokens, state);
                    this.setCapabilityValue('measure_temp_min', temp_min);
                }
                if (this.getCapabilityValue('measure_temp_max') != temp_max) {
                    this.log("temp_max has changed. Old max_temp: " + this.getCapabilityValue('measure_temperature_max') + " New max temp: " + temp_max);
                    let state = {
                        "measure_temperature_max": temp_max
                    };
                    let tokens = {
                        "measure_temperature_max": temp_max,
                        "location": GEOlocation
                    };
                    this.triggerMaxTempChangedFlow(device, tokens, state);
                    this.setCapabilityValue('measure_temp_max', temp_max);
                }
                if (this.getCapabilityValue('measure_temp_morning') != temp_morn) {
                    let state = {
                        "measure_temp_morning": temp_morn
                    };
                    let tokens = {
                        "measure_temp_morning": temp_morn,
                        "location": GEOlocation
                    };
                    this.triggerMornTempChangedFlow(device, tokens, state);
                    this.setCapabilityValue('measure_temp_morning', temp_morn);
                }
                if (this.getCapabilityValue('measure_temp_evening') != temp_eve) {
                    let state = {
                        "measure_temp_evening": temp_eve
                    };
                    let tokens = {
                        "measure_temp_evening": temp_eve,
                        "location": GEOlocation
                    };
                    this.triggerEveTempChangedFlow(device, tokens, state);
                    this.setCapabilityValue('measure_temp_evening', temp_eve);
                }
                if (this.getCapabilityValue('measure_temp_night') != temp_night) {
                    let state = {
                        "measure_temp_night": temp_night
                    };
                    let tokens = {
                        "measure_temp_night": temp_night,
                        "location": GEOlocation
                    };
                    this.triggerNightTempChangedFlow(device, tokens, state);
                    this.setCapabilityValue('measure_temp_night', temp_night);
                }
                if (this.getCapabilityValue('date_txt') != date_txt) {
                    this.setCapabilityValue('date_txt', date_txt);
                }
                if (this.getCapabilityValue('measure_humidity') != hum) {
                    this.setCapabilityValue('measure_humidity', hum);
                }
                if (this.getCapabilityValue('measure_pressure') != pressure) {
                    this.setCapabilityValue('measure_pressure', pressure);
                }
                if (this.getCapabilityValue('measure_rain') != rain) {
                    this.setCapabilityValue('measure_rain', rain);
                }
                if (this.getCapabilityValue('measure_wind_combined') != windcombined) {
                    this.setCapabilityValue('measure_wind_combined', windcombined);
                }
                if (this.getCapabilityValue('measure_wind_strength') != windstrength) {
                    this.setCapabilityValue('measure_wind_strength', windstrength);
                }
                if (this.getCapabilityValue('measure_wind_angle') != windangle) {
                    this.setCapabilityValue('measure_wind_angle', windangle);
                }
                if (this.getCapabilityValue('measure_windstrength_beaufort') != windspeedbeaufort) {
                    let state = {
                        "measure_windstrength_beaufort": windspeedbeaufort
                    };
                    let tokens = {
                        "measure_windstrength_beaufort": windspeedbeaufort,
                        "location": GEOlocation
                    };
                    this.triggerWindBeaufortChangedFlow(device, tokens, state);
                    this.setCapabilityValue('measure_windstrength_beaufort', windspeedbeaufort);
                }
                if (this.getCapabilityValue('measure_wind_direction_string') != winddegcompass) {
                    let state = {
                        "measure_wind_direction_string": winddegcompass
                    };
                    let tokens = {
                        "measure_wind_direction_string": winddegcompass,
                        "location": GEOlocation
                    };
                    this.triggerWindDirectionCompassChangedFlow(device, tokens, state);
                    this.setCapabilityValue('measure_wind_direction_string', winddegcompass);
                }
                if (this.getCapabilityValue('measure_cloudiness') != cloudiness) {
                    this.log("cloudiness has changed. Previous cloudiness: " + this.getCapabilityValue('measure_cloudiness') + " New cloudiness: " + cloudiness);
                    let state = {
                        "measure_cloudiness": cloudiness
                    };
                    let tokens = {
                        "measure_cloudiness": cloudiness,
                        "location": GEOlocation
                    };
                    this.triggerCloudinessChangedFlow(device, tokens, state);
                    this.setCapabilityValue('measure_cloudiness', cloudiness);
                }
                if (this.getCapabilityValue('description') != description) {
                    this.log("description has changed. Previous description: " + this.getCapabilityValue('description') + " New description: " + description);
                    let state = {
                        "description": description
                    };
                    let tokens = {
                        "description": description,
                        "location": GEOlocation
                    };
                    this.triggerWeatherChangedFlow(device, tokens, state);
                    this.setCapabilityValue('description', description);
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

                    case 'forecastInterval':
                        this.log('forecastInterval changed to ' + newSettingsObj.forecastInterval);
                        settings.forecastInterval = newSettingsObj.forecastInterval;
                        break;

                    default:
                        this.log("Key not matched: " + i);
                        break;
                }
            }
            this.pollOpenWeatherMapDaily(settings);
            callback(null, true)
        } catch (error) {
            callback(error, null)
        }
    }

    // flow triggers
    triggerWeatherChangedFlow(device, tokens, state) {
        this._flowTriggerWeatherChanged
            .trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error)
    }

    triggerMinTempChangedFlow(device, tokens, state) {
        this._flowTriggerMinTempChanged
            .trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error)
    }

    triggerMaxTempChangedFlow(device, tokens, state) {
        this._flowTriggerMaxTempChanged
            .trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error)
    }

    triggerMornTempChangedFlow(device, tokens, state) {
        this._flowTriggerMornTempChanged
            .trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error)
    }

    triggerEveTempChangedFlow(device, tokens, state) {
        this._flowTriggerEveTempChanged
            .trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error)
    }

    triggerNightTempChangedFlow(device, tokens, state) {
        this._flowTriggerNightTempChanged
            .trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error)
    }

    triggerWindBeaufortChangedFlow(device, tokens, state) {
        this._flowTriggerWindBeaufortChanged
            .trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error)
    }

    triggerWindDirectionCompassChangedFlow(device, tokens, state) {
        this._flowTriggerWindDirectionCompassChanged
            .trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error)
    }

    triggerCloudinessChangedFlow(device, tokens, state) {
        this._flowTriggerCloudinessChanged
            .trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error)
    }

    triggerVisibilityChangedFlow(device, tokens, state) {
        this._flowTriggerVisibilityChanged
            .trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error)
    }

}
module.exports = owmForecast;