/* From Homey SDK 2.0 docs: The file device.js is a representation of an already paired device on Homey */
'use strict';

const Homey = require('homey');
const weather = require('index.js');

class owmCurrent extends Homey.Device {

    onInit() {
        this.log('device init');
        let settings = this.getSettings();
        let name = this.getName() + '_' + this.getData().id;
        let cronName = name.toLowerCase();

        settings["lat"] = Homey.ManagerGeolocation.getLatitude();
        settings["lon"] = Homey.ManagerGeolocation.getLongitude();
        settings["units"] = Homey.ManagerI18n.getUnits();
        settings["language"] = Homey.ManagerI18n.getLanguage();

        // updating settings object for settings dialogue
        this.setSettings({
                language: Homey.ManagerI18n.getLanguage(),
                units: Homey.ManagerI18n.getUnits(),
                lat: Homey.ManagerGeolocation.getLatitude(),
                lon: Homey.ManagerGeolocation.getLongitude(),
            })
            .catch(this.error)

        Homey.ManagerCron.getTask(cronName)
            .then(task => {
                this.log("The task exists: " + cronName);
                task.on('run', () => this.pollOpenWeatherMapCurrent(settings));
            })
            .catch(err => {
                if (err.code == 404) {
                    this.log("The task has not been registered yet, registering task: " + cronName);
                    Homey.ManagerCron.registerTask(cronName, "5-59/15 * * * *", settings)
                        .then(task => {
                            task.on('run', () => this.pollOpenWeatherMapCurrent(settings));
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

        this._flowTriggerWindBeaufortChanged = new Homey.FlowCardTriggerDevice('WindBeaufortChanged')
            .register()

        this._flowTriggerWindDirectionCompassChanged = new Homey.FlowCardTriggerDevice('WindDirectionCompassChanged')
            .register()

        this._flowTriggerCloudinessChanged = new Homey.FlowCardTriggerDevice('CloudinessChanged')
            .register()

        this._flowTriggerVisibilityChanged = new Homey.FlowCardTriggerDevice('VisibilityChanged')
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

        this.conditionVisibility = new Homey.FlowCardCondition('Visibility').register()
            .registerRunListener((args, state) => {
                var result = (this.getCapabilityValue('measure_visibility') >= args.visibility) 
                return Promise.resolve(result);
            })

        //run once to get the first data
        this.pollOpenWeatherMapCurrent(settings);

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

    pollOpenWeatherMapCurrent(settings) {

        weather.getURLCurrent(settings).then(url => {
                return weather.getWeatherData(url);
            })
            .then(data => {
                let device = this;
                this.log("Received OWM data");

                var GEOlocation = data.name + ", " + data.sys.country;

                this.setSettings({
                        GEOlocation: GEOlocation,
                    })
                    .catch(this.error);
                var conditioncode = data.weather[0].id;
                this.log("current condition: ")
                this.log(weather.conditionToString(conditioncode));

                var temp = data.main.temp;
                var temp_min = data.main.temp_min;
                var temp_max = data.main.temp_max;
                var hum = data.main.humidity;
                var pressure = data.main.pressure;
                // return the rain in mm if present
                if (data.precipitation) {
                    var rain = data.precipitation.value;
                } 

                if (data.rain) {
                    var rain3h = data.rain;
                    //  smartJSON.rain = Math.round(rain3h['3h'] / 3);
                    var rain = rain3h / 3;
                }
                if (data.wind.speed) {
                    if (settings["units"] == "metric") {
                        // convert from m/s to km/h
                        var windstrength = 3.6 * data.wind.speed;
                    } else {
                        // windspeed in mph
                        var windstrength = data.wind.speed;
                    }
                } else {
                    var windstrength = {};
                }

                if (data.wind.deg) {
                    var windangle = data.wind.deg;
                } else {
                    var windangle = null;
                }
                var winddegcompass = weather.degToCompass(settings, windangle);
                if (settings["units"] == "metric") {
                    // convert to beaufort and concatenate in a string with wind direction
                    var windspeedbeaufort = weather.beaufortFromKmh(windstrength);
                    var windcombined = winddegcompass + " " + windspeedbeaufort;
                } else {
                    var windspeedbeaufort = weather.beaufortFromMph(windstrength);
                    var windcombined = winddegcompass + " " + windspeedbeaufort;
                }
                var cloudiness = data.clouds.all;
                var visibility = data.visibility;
                var description = data.weather[0].description;

                var date_txt = new Date(data.dt * 1e3).toISOString().slice(-24, -5);
                date_txt = date_txt.replace('T', ' ');

                var sunrise = new Date(data.sys.sunrise * 1e3).toString().slice(-23, -18);

                var sunset = new Date(data.sys.sunset * 1e3).toString().slice(-23, -18);

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
                if (this.getCapabilityValue('measure_visibility') != visibility) {
                    this.log("visibility has changed. Previous visibility: " + this.getCapabilityValue('measure_visibility') + " New visibility: " + visibility);
                    let state = {
                        "measure_visibility": visibility
                    };
                    let tokens = {
                        "measure_visibility": visibility,
                        "location": GEOlocation
                    };
                    this.triggerVisibilityChangedFlow(device, tokens, state);
                    this.setCapabilityValue('measure_visibility', visibility);
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
                if (this.getCapabilityValue('sunrise') != sunrise) {
                    this.setCapabilityValue('sunrise', sunrise);
                }
                if (this.getCapabilityValue('sunset') != sunset) {
                    this.setCapabilityValue('sunset', sunset);
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

                    default:
                        this.log("Key not matched: " + i);
                        break;
                }
            }
            this.pollOpenWeatherMapCurrent(settings);
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
module.exports = owmCurrent;
