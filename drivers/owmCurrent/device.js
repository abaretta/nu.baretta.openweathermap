/* From Homey SDK 2.0 docs: The file device.js is a representation of an already paired device on Homey */
'use strict';

const Homey = require('homey');
const weather = require('index.js');
const intervalCurrent = 5;

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
        this._flowTriggerConditionChanged = new Homey.FlowCardTriggerDevice('ConditionChanged').register();

        this._flowTriggerConditionDetailChanged = new Homey.FlowCardTriggerDevice('ConditionDetailChanged').register()

        this._flowTriggerWeatherChanged = new Homey.FlowCardTriggerDevice('WeatherChanged').register()

        this._flowTriggerWindBeaufortChanged = new Homey.FlowCardTriggerDevice('WindBeaufortChanged').register()

        this._flowTriggerWindDirectionCompassChanged = new Homey.FlowCardTriggerDevice('WindDirectionCompassChanged').register()

        //this._flowTriggerWindAngleChanged = new Homey.FlowCardTriggerDevice('WindAngleChanged').register()

        this._flowTriggerCloudinessChanged = new Homey.FlowCardTriggerDevice('CloudinessChanged').register()

        this._flowTriggerVisibilityChanged = new Homey.FlowCardTriggerDevice('VisibilityChanged').register()

        this._flowTriggerSnowChanged = new Homey.FlowCardTriggerDevice('SnowChanged').register()

        // Register conditions for flows

        this._weatherCondition = new Homey.FlowCardCondition('Conditioncode').register()
            .registerRunListener(async (args, state) => {
                this.log("getCapabilityValue conditioncode: " + this.getCapabilityValue('conditioncode'));
                this.log("Weather condition argument: " + args.argument_main);
                this.log("Weather condition state: " + state.conditioncode);
                let result = (await state.conditioncode === args.argument_main);
                return Promise.resolve(result);
            })

        this._weatherConditionDetail = new Homey.FlowCardCondition('Conditioncode_detail').register()
            .registerRunListener(async (args, state) => {
                let result = (await state.conditioncode == args.argument_main);
                return Promise.resolve(result);
            })

        this._conditionClouds = new Homey.FlowCardCondition("Clouds").register()
            .registerRunListener(async (args, state) => {
                let result = (await state.measure_cloudiness >= args.cloudiness);
                return Promise.resolve(result);
            })

        this._conditionWindforce = new Homey.FlowCardCondition("Windforce").register()
            .registerRunListener(async (args, state) => {
                let result = (await state.measure_windstrength_beaufort >= args.windforce);
                return Promise.resolve(result);
            })

        this._conditionWinddirection = new Homey.FlowCardCondition("Winddirection").register()
            .registerRunListener(async (args, state) => {
                let result = (await state.measure_wind_direction_string == args.winddirection);
                return Promise.resolve(result);
            })

        this._conditionVisibility = new Homey.FlowCardCondition('Visibility').register()
            .registerRunListener(async (args, state) => {
                let result = (await state.measure_visibility >= args.visibility)
                return Promise.resolve(result);
            })

        this._conditionSnow = new Homey.FlowCardCondition('Snow').register()
            .registerRunListener(async (args, state) => {
                let result = (await state.measure_snow >= args.snow)
                return Promise.resolve(result);
            })

        //run once to get the first data
        await this.pollWeatherCurrent(settings);

    } // end onInit

    onAdded() {
        let id = this.getData().id;
        this.log('device added: ', id);

    } // end onAdded

    onDeleted() {

        let id = this.getData().id;
        clearInterval(this.pollingintervalcurrent);
        this.log('device deleted:', id);

    } // end onDeleted

    pollWeatherCurrent(settings) {
        //run once, then at interval
        let pollminutes = 10;

        this.pollingintervalcurrent = weather.setIntervalImmediately(_ => {
            this.pollOpenWeatherMapCurrent(settings)
        }, 60000 * pollminutes);
    }

    async pollOpenWeatherMapCurrent(settings) {

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
                var conditioncode = data.weather[0].main;
                this.log("Main conditioncode: " + data.weather[0].main);

                var conditioncode_detail = data.weather[0].id;
                this.log("Specific conditioncode: " + data.weather[0].id);

                var temp = data.main.temp;
                var hum = data.main.humidity;
                var pressure = data.main.pressure;
                // return the rain in mm if present, or precipitation
                if (data.precipitation) {
                    var rain = data.precipitation.value;
                }

                if (data.snow != undefined) {
                    if (typeof (data.snow) === "number") {
                        var snow = data.snow
                    } else if (typeof (data.snow) === "object") {
                        if (data.snow['3h'] != undefined) {
                            var snow = data.snow['3h'] / 3;
                        }
                        if (data.snow['1h'] != undefined) {
                            var snow = data.snow['1h'];
                        }
                        // Sometimes OWM returns an empty snow object
                        if (Object.keys(data.snow).length == 0) {
                            var snow = 0;
                        }
                    }
                } else {
                    var snow = 0;
                }

                if (data.rain != undefined) {
                    if (typeof (data.rain) === "number") {
                        var rain = data.rain
                    } else if (typeof (data.rain) === "object") {
                        if (data.rain['3h'] != undefined) {
                            var rain = data.rain['3h'] / 3;
                        }
                        if (data.rain['1h'] != undefined) {
                            var rain = data.rain['1h'];
                        }
                        // Sometimes OWM returns an empty rain object
                        if (Object.keys(data.rain).length == 0) {
                            var rain = 0;
                        }
                    }
                } else {
                    var rain = 0;
                }

                if (data.wind.speed) {
                    if (settings["units"] == "metric") {
                        // convert from m/s to km/h
                        var windstrength = Math.round(3.6 * data.wind.speed);
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

                var sunr = new Date(data.sys.sunrise * 1e3);
                var sunrise = sunr.getHours() + ":" + (sunr.getMinutes() < 10 ? '0' : '') + sunr.getMinutes();

                var suns = new Date(data.sys.sunset * 1e3);
                var sunset = suns.getHours() + ":" + (suns.getMinutes() < 10 ? '0' : '') + suns.getMinutes();

                this.log("Comparing variables before and after current polling interval");

                if (this.getCapabilityValue('measure_windstrength_beaufort') !== windspeedbeaufort && windspeedbeaufort !== undefined) {
                    this.log("Windstrength previous: " + this.getCapabilityValue('measure_windstrength_beaufort'));
                    this.log("Windstrength new: " + windspeedbeaufort);
                    let state = {
                        "measure_windstrength_beaufort": windspeedbeaufort
                    };
                    let tokens = {
                        "measure_windstrength_beaufort": windspeedbeaufort,
                        "location": GEOlocation
                    };
                    this._flowTriggerWindBeaufortChanged.trigger(device, tokens, state).catch(this.error)
                }
                if (this.getCapabilityValue('measure_wind_direction_string') !== winddegcompass && winddegcompass !== undefined) {
                    let state = {
                        "measure_wind_direction_string": winddegcompass
                    };
                    let tokens = {
                        "measure_wind_direction_string": winddegcompass,
                        "location": GEOlocation
                    };
                    this._flowTriggerWindDirectionCompassChanged.trigger(device, tokens, state).catch(this.error)
                }
                //                if (this.getCapabilityValue('measure_wind_angle') !== windangle && windangle !== undefined) {
                //                    let state = {
                //                        "measure_wind_angle": windangle
                //                    };
                //                    let tokens = {
                //                        "measure_wind_angle": windangle,
                //                        "location": GEOlocation
                //                    };
                //                    this._flowTriggerWindAngleChanged.trigger(device, tokens).catch(this.error)
                //                    //this.setCapabilityValue('measure_wind_angle', winddegcompass).catch(this.error);
                //                }
                if (this.getCapabilityValue('measure_cloudiness') !== cloudiness && cloudiness !== undefined) {
                    this.log("cloudiness has changed. Previous cloudiness: " + this.getCapabilityValue('measure_cloudiness') + " New cloudiness: " + cloudiness);
                    let state = {
                        "measure_cloudiness": cloudiness
                    };
                    let tokens = {
                        "measure_cloudiness": cloudiness,
                        "location": GEOlocation
                    };
                    this._flowTriggerCloudinessChanged.trigger(device, tokens, state).catch(this.error)
                }
                if (this.getCapabilityValue('measure_visibility') !== visibility && visibility !== undefined) {
                    this.log("visibility has changed. Previous visibility: " + this.getCapabilityValue('measure_visibility') + " New visibility: " + visibility);
                    let state = {
                        "measure_visibility": visibility
                    };
                    let tokens = {
                        "measure_visibility": visibility,
                        "location": GEOlocation
                    };
                    this._flowTriggerVisibilityChanged.trigger(device, tokens, state).catch(this.error)
                }
                if (this.getCapabilityValue('measure_snow') !== snow && snow !== undefined) {
                    this.log("snow has changed. Previous snow: " + this.getCapabilityValue('measure_snow') + " New visibility: " + visibility);
                    let state = {
                        "measure_visibility": snow
                    };
                    let tokens = {
                        "measure_snow": snow,
                        "location": GEOlocation
                    };
                    this._flowTriggerSnowChanged.trigger(device, tokens, snow).catch(this.error)
                }
                if (this.getCapabilityValue('conditioncode') !== conditioncode && conditioncode !== undefined) {
                    this.log("weathercondition has changed. Previous conditioncode: " + this.getCapabilityValue('conditioncode') + " New conditioncode: " + conditioncode);
                    let state = {
                        "conditioncode": conditioncode
                    };
                    let tokens = {
                        "conditioncode": conditioncode,
                        "location": GEOlocation
                    };
                    this._flowTriggerConditionChanged.trigger(device, tokens, state).catch(this.error)
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
                if (this.getCapabilityValue('description') !== description && description !== undefined) {
                    this.log("description has changed. Previous description: " + this.getCapabilityValue('description') + " New description: " + description);
                    let state = {
                        "description": description
                    };
                    let tokens = {
                        "description": description,
                        "location": GEOlocation
                    };
                    this._flowTriggerWeatherChanged.trigger(device, tokens, state).catch(this.error)
                }

                // update each interval, even if unchanged.

                const capabilitySet = {
                    'conditioncode': conditioncode,
                    'conditioncode_detail': conditioncode_detail,
                    'measure_temperature': temp,
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
                    'measure_visibility': visibility,
                    'description': description,
                    'sunrise': sunrise,
                    'sunset': sunset
                };

                this.getCapabilities().forEach(async capability => {
                    this.log("Capability: " + capability + ":" + capabilitySet[capability]);
                    if (capabilitySet[capability] != undefined) {
                        await this.setCapabilityValue(capability, capabilitySet[capability])
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
}
module.exports = owmCurrent;