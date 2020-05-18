/* From Homey SDK 2.0 docs: The file device.js is a representation of an already paired device on Homey */
'use strict';

const Homey = require('homey');
const weather = require('index.js');

class owmLongterm extends Homey.Device {

    async onInit() {
        this.log('device init');
        let settings = this.getSettings();
        let forecastInterval = this.getSetting('forecastInterval') || 0;

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

        // Flows
        this._flowTriggerConditionChanged = new Homey.FlowCardTriggerDevice('ConditionChanged')
            .register()

        this._flowTriggerConditionDetailChanged = new Homey.FlowCardTriggerDevice('ConditionDetailChanged').register()

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

        this._flowTriggerSnowChanged = new Homey.FlowCardTriggerDevice('SnowChanged')
            .register()

        // Register conditions for flows

        this._weatherCondition = new Homey.FlowCardCondition('Conditioncode').register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('conditioncode') == args.argument_main)
                return Promise.resolve(result);
            })

        this._weatherConditionDetail = new Homey.FlowCardCondition('Conditioncode_detail').register()
            .registerRunListener(async (args, state) => {
                let result = (await state.conditioncode == args.argument_main);
                return Promise.resolve(result);
            })

        this._conditionTemp = new Homey.FlowCardCondition("Temp").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_temperature') >= args.degrees);
                return Promise.resolve(result);
            })

        this._conditionTempmin = new Homey.FlowCardCondition("Tempmin").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_temperature.min') >= args.degrees);
                return Promise.resolve(result);
            })

        this._conditionTempmax = new Homey.FlowCardCondition("Tempmax").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_temperature.max') >= args.degrees);
                return Promise.resolve(result);
            })

        this._conditionTempeve = new Homey.FlowCardCondition("Tempeve").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_temperature.evening') >= args.degrees);
                return Promise.resolve(result);
            })

        this._conditionTempmorn = new Homey.FlowCardCondition("Tempmorn").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_temperature.morning') >= args.degrees);
                return Promise.resolve(result);
            })

        this._conditionTempnight = new Homey.FlowCardCondition("Tempnight").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_temperature.night') >= args.degrees);
                return Promise.resolve(result);
            })

        this._conditionPressure = new Homey.FlowCardCondition("Pressure").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_pressure') >= args.bar);
                return Promise.resolve(result);
            })

        this._conditionClouds = new Homey.FlowCardCondition("Clouds").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_cloudiness') >= args.cloudiness);
                return Promise.resolve(result);
            })

        this._conditionHumidity = new Homey.FlowCardCondition("Humidity").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_humidity') >= args.humidity);
                return Promise.resolve(result);
            })

        this._conditionWindspeed = new Homey.FlowCardCondition("Windspeed").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_wind_strength') >= args.windspeed);
                return Promise.resolve(result);
            })

        this._conditionWindforce = new Homey.FlowCardCondition("Windforce").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_windstrength_beaufort') >= args.windforce);
                return Promise.resolve(result);
            })

        this._conditionWinddirection = new Homey.FlowCardCondition("Winddirection").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_wind_direction_string') == args.winddirection);
                return Promise.resolve(result);
            })

        this._conditionSnow = new Homey.FlowCardCondition("Snow").register()
            .registerRunListener((args, state) => {
                let result = (this.getCapabilityValue('measure_snow') == args.snow);
                return Promise.resolve(result);
            })

        // start polling
        this.pollWeatherDaily(settings);

    } // end onInit

    onAdded() {
        let id = this.getData().id;
        this.log('device added: ', id);

    } // end onAdded

    onDeleted() {

        let id = this.getData().id;
        clearInterval(this.pollingintervalDaily);
        this.log('device deleted:', id);

    } // end onDeleted

    pollWeatherDaily(settings) {
        //run once, then at interval
        let pollminutes = 15;

        this.pollingintervalDaily = weather.setIntervalImmediately(_ => {
            this.pollOpenWeatherMapDaily(settings)
        }, 60000 * pollminutes);
    }

    pollOpenWeatherMapDaily(settings) {

        weather.getURLDaily(settings).then(url => {
                return weather.getWeatherData(url);
            })
            .then(data => {
                let device = this;
                let forecastInterval = this.getSetting('forecastInterval');
                this.log("Received OWM data");

                let GEOlocation = data.city.name + ", " + data.city.country;

                this.setSettings({
                        GEOlocation: GEOlocation,
                    })
                    .catch(this.error);

                //var conditioncode = data.list[forecastInterval].weather[0].id;
                var conditioncode = data.list[forecastInterval].weather[0].main;
                this.log("Main condition: ")
                //this.log(weather.conditionToString(conditioncode));
                this.log(conditioncode);

                var conditioncode_detail = data.list[forecastInterval].weather[0].id;
                this.log("Specific conditioncode: " + data.list[forecastInterval].weather[0].id);

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

                if (data.list[forecastInterval].rain != undefined) {
                    if (typeof (data.list[forecastInterval].rain) === "number") {
                        var rain = data.list[forecastInterval].rain
                    } else if (typeof (data.list[forecastInterval].rain) === "object") {
                        if (data.list[forecastInterval].rain['3h'] != undefined) {
                            var rain = data.list[forecastInterval].rain['3h'] / 3;
                        }
                        if (data.list[forecastInterval].rain['1h'] != undefined) {
                            var rain = data.list[forecastInterval].rain['1h'];
                        }
                        // Sometimes OWM returns an empty rain object
                        if (Object.keys(data.list[forecastInterval].rain).length == 0) {
                            var rain = 0;
                        }
                    }
                } else {
                    var rain = 0;
                }

                if (data.list[forecastInterval].snow != undefined) {
                    if (typeof (data.list[forecastInterval].snow) === "number") {
                        var snow = data.list[forecastInterval].snow
                    } else if (typeof (data.list[forecastInterval].snow) === "object") {
                        if (data.list[forecastInterval].snow['3h'] != undefined) {
                            var snow = data.list[forecastInterval].snow['3h'] / 3;
                        }
                        if (data.list[forecastInterval].snow['1h'] != undefined) {
                            var snow = data.list[forecastInterval].snow['1h'];
                        }
                        // Sometimes OWM returns an empty rain object
                        if (Object.keys(data.list[forecastInterval].snow).length == 0) {
                            var snow = 0;
                        }
                    }
                } else {
                    var snow = 0;
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
                        var windstrength = Math.round(3.6 * data.list[forecastInterval].speed);
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

                this.log("Comparing variables before and after current polling interval");
                // update each interval, even if unchanged.


                if (this.getCapabilityValue('measure_temperature.min') != temp_min) {
                    this.log("temp_min has changed. Old min_temp: " + this.getCapabilityValue('measure_temperature.min') + " New min temp: " + temp_min);
                    let state = {
                        "measure_temperature.min": temp_min
                    };
                    let tokens = {
                        "measure_temperature.min": temp_min,
                        "location": GEOlocation
                    };
                    this._flowTriggerMinTempChanged.trigger(device, tokens).catch(this.error)
                }
                if (this.getCapabilityValue('measure_temperature.max') != temp_max) {
                    this.log("temp_max has changed. Old max_temp: " + this.getCapabilityValue('measure_temperature.max') + " New max temp: " + temp_max);
                    let state = {
                        "measure_temperature.max": temp_max
                    };
                    let tokens = {
                        "measure_temperature.max": temp_max,
                        "location": GEOlocation
                    };
                    this._flowTriggerMaxTempChanged.trigger(device, tokens).catch(this.error)
                }
                if (this.getCapabilityValue('measure_temperature.morning') != temp_morn) {
                    let state = {
                        "measure_temperature.morning": temp_morn
                    };
                    let tokens = {
                        "measure_temperature.morning": temp_morn,
                        "location": GEOlocation
                    };
                    this._flowTriggerMornTempChanged.trigger(device, tokens).catch(this.error)
                }
                if (this.getCapabilityValue('measure_temperature.evening') != temp_eve) {
                    let state = {
                        "measure_temperature.evening": temp_eve
                    };
                    let tokens = {
                        "measure_temperature.evening": temp_eve,
                        "location": GEOlocation
                    };
                    this._flowTriggerEveTempChanged.trigger(device, tokens).catch(this.error)
                }
                if (this.getCapabilityValue('measure_temperature.night') != temp_night) {
                    let state = {
                        "measure_temperature.night": temp_night
                    };
                    let tokens = {
                        "measure_temperature.night": temp_night,
                        "location": GEOlocation
                    };
                    this._flowTriggerNightTempChanged.trigger(device, tokens).catch(this.error)
                }
                if (this.getCapabilityValue('measure_windstrength_beaufort') != windspeedbeaufort) {
                    let state = {
                        "measure_windstrength_beaufort": windspeedbeaufort
                    };
                    let tokens = {
                        "measure_windstrength_beaufort": windspeedbeaufort,
                        "location": GEOlocation
                    };
                    this._flowTriggerWindBeaufortChanged.trigger(device, tokens).catch(this.error)
                }
                if (this.getCapabilityValue('measure_wind_direction_string') != winddegcompass) {
                    let state = {
                        "measure_wind_direction_string": winddegcompass
                    };
                    let tokens = {
                        "measure_wind_direction_string": winddegcompass,
                        "location": GEOlocation
                    };
                    this._flowTriggerWindDirectionCompassChanged.trigger(device, tokens).catch(this.error)
                }
                if (this.getCapabilityValue('measure_snow') != snow) {
                    this.log("snow has changed. Previous snow: " + this.getCapabilityValue('measure_snow') + " New snow: " + snow);
                    let state = {
                        "measure_snow": snow
                    };
                    let tokens = {
                        "measure_snow": snow,
                        "location": GEOlocation
                    };
                    this._flowTriggerSnowChanged.trigger(device, tokens).catch(this.error)
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
                    this._flowTriggerCloudinessChanged.trigger(device, tokens).catch(this.error)
                }
                if (this.getCapabilityValue('conditioncode') != conditioncode) {
                    this.log("conditioncode has changed. Previous conditioncode: " + this.getCapabilityValue('conditioncode') + " New conditioncode: " + conditioncode);
                    let state = {
                        "conditioncode": conditioncode
                    };
                    let tokens = {
                        "conditioncode": conditioncode,
                        "location": GEOlocation
                    };
                    this._flowTriggerConditionChanged.trigger(device, tokens).catch(this.error)
                }
                if (this.getCapabilityValue('conditioncode_detail') !== conditioncode_detail && conditioncode_detail !== undefined) {
                    this.log("Specific weatherconditioncode has changed. Previous conditioncode: " + this.getCapabilityValue('conditioncode_detail') + " New conditioncode: " + conditioncode_detail);
                    let state = {
                        "conditioncode": conditioncode_detail
                    };
                    let tokens = {
                        "conditioncode": conditioncode_detail,
                        "location": GEOlocation
                    };
                    this._flowTriggerConditionDetailChanged.trigger(device, tokens, state).catch(this.error)
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
                    this._flowTriggerWeatherChanged.trigger(device, tokens).catch(this.error)
                }

                // update each interval, even if unchanged.

                const capabilitySet = {
                    'conditioncode': conditioncode,
                    'conditioncode_detail': conditioncode_detail,
                    'measure_temperature': temp,
                    'measure_temperature.min': temp_min,
                    'measure_temperature.max': temp_max,
                    'measure_temperature.morning': temp_morn,
                    'measure_temperature.evening': temp_eve,
                    'measure_temperature.night': temp_night,
                    'measure_humidity': hum,
                    'measure_pressure': pressure,
                    'measure_rain': rain,
                    'measure_snow': snow,
                    'measure_wind_combined': windcombined,
                    'measure_wind_strength': windstrength,
                    'measure_wind_angle': windangle,
                    'measure_windstrength_beaufort': windspeedbeaufort,
                    'measure_wind_direction_string': winddegcompass,
                    'measure_cloudiness': cloudiness,
                    'description': description
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
            })
            .catch(error => {
                this.log(error);
            });
    }

    onSettings(settings, newSettingsObj, changedKeysArr, callback) {
        try {
            for (let i = 0; i < changedKeysArr.length; i++) {
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
            clearInterval(this.pollingintervalDaily);
            this.pollWeatherDaily(settings);
            callback(null, true)
        } catch (error) {
            callback(error, null)
        }
    }
}
module.exports = owmLongterm;