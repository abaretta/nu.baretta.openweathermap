/* From Homey SDK 2.0 docs: The file device.js is a representation of an already paired device on Homey */
'use strict';

const Homey = require('homey');
const weather = require('index.js');
const intervalCurrent = 10;

class owmCurrent extends Homey.Device {

    async onInit() {
        this.log('device init');
        let settings = this.getSettings();
        let name = this.getName() + '_' + this.getData().id;

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
        this.pollWeatherCurrent(settings);

    } // end onInit

    onAdded() {
        let id = this.getData().id;
        this.log('device added: ', id);

    } // end onAdded

    onDeleted() {

        let id = this.getData().id;
        clearInterval(this.pollingIntervalCurrent);
        this.log('device deleted:', id);

    } // end onDeleted

    pollWeatherCurrent(settings) {
        //run once, then at interval
        var pollminutes = 10;

        this.pollingintervalcurrent = weather.setIntervalImmediately(_ => {
            this.pollOpenWeatherMapCurrent(settings)
        }, 60000 * pollminutes);
    }

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
                var hum = data.main.humidity;
                var pressure = data.main.pressure;
                // return the rain in mm if present, or precipitation
                if (data.precipitation) {
                    var rain = data.precipitation.value;
                }

                if (data.rain != undefined) {
                    if (data.rain['3h'] != undefined) {
                        var rain = data.rain['3h'] / 3;
                    }
                    if (data.rain['1h'] != undefined) {
                        var rain = data.rain['1h'];
                    } else {
                        var rain = 0;
                    }
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

                var date_txt = new Date(data.dt * 1e3).toString().slice(-24, -5);
                date_txt = date_txt.replace('T', ' ');

                var sunr = new Date(data.sys.sunrise * 1e3);
                var sunrise = sunr.getHours() + ":" + sunr.getMinutes();

                var suns = new Date(data.sys.sunset * 1e3);
                var sunset = suns.getHours() + ":" + suns.getMinutes();

                this.log("Comparing variables before and after current polling interval");

                // update each interval, even if unchanged.

                const capabilitySet = {
                    'conditioncode': conditioncode,
                    'measure_temperature': temp,
                    'date_txt': date_txt,
                    'measure_humidity': hum,
                    'measure_pressure': pressure,
                    'measure_rain': rain,
                    'measure_wind_combined': windcombined,
                    'measure_wind_strength': windstrength,
                    'measure_wind_angle': windangle,
                    'measure_windstrength_beaufort': windspeedbeaufort,
                    'measure_wind_direction_string': winddegcompass,
                    'measure_cloudiness': cloudiness,
                    'measure_visibility': visibility,
                    'description': description,
                    'sunrise': sunrise,
                    'sunset': sunset
                };

                this.getCapabilities().forEach(capability => {
                    //this.log("Capability: " + capability + ":" + capabilitySet[capability]);
                    if (capabilitySet[capability] != undefined) {
                        this.setCapabilityValue(capability, capabilitySet[capability])
                            .catch(err => this.log(err));
                    } else {
                        this.log("Capability undefined: " + capability)
                    }
                });

                if (this.getCapabilityValue('measure_windstrength_beaufort') != windspeedbeaufort) {
                    let state = {
                        "measure_windstrength_beaufort": windspeedbeaufort
                    };
                    let tokens = {
                        "measure_windstrength_beaufort": windspeedbeaufort,
                        "location": GEOlocation
                    };
                    this.triggerWindBeaufortChangedFlow(device, tokens, state);
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
            clearInterval(this.pollingintervalcurrent);
            this.pollWeatherCurrent(settings);
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