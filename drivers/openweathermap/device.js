/* From Homey SDK 2.0 docs: The file device.js is a representation of an already paired device on Homey */
'use strict';

const Homey = require('homey');
const weather = require('index.js');

class openweathermap extends Homey.Device {


    onInit() {
        this.log('device init');
        console.dir("getSettings: "); // for debugging
        // console.dir(this.getSettings()); // for debugging
        // console.dir("getData: "); // for debugging
        // console.dir(this.getData()); // for debugging
        this.log('name: ', this.getName());
        this.log('class: ', this.getClass());
        let id = this.getData().id;
        let name = this.getName();
        let settings = this.getSettings();
        let ManagerCloud = Homey.ManagerGeolocation;
        let lat = ManagerCloud.getLatitude();
        let lon = ManagerCloud.getLongitude();
        let language = Homey.ManagerI18n.getLanguage();
        let units = Homey.ManagerI18n.getUnits();
        let interval = 10;
        console.log("language and units: ");
        console.log(language);
        console.log(units);
        settings["lat"] = lat;
        settings["lon"] = lon;
        settings["units"] = units;
        settings["language"] = language;
        //console.dir(this.getSettings()); // for debugging

        let device_data = [{
            data: {
                id: id
            },
            name: name,
            settings: settings,
        }];
        //this.log("device_data on init: ");
        //this.log(device_data);

        // register capability listeners
        this.registerCapabilityListener('measure_temperature', this.onCapabilityTemp.bind(this));
        this.registerCapabilityListener('measure_humidity', this.onCapabilityHumidity.bind(this));
        this.registerCapabilityListener('measure_pressure', this.onCapabilityPressure.bind(this));
        this.registerCapabilityListener('measure_rain', this.onCapabilityRain.bind(this));
        this.registerCapabilityListener('measure_wind_strength', this.onCapabilityWindSpeed.bind(this));
        this.registerCapabilityListener('measure_wind_angle', this.onCapabilityWindAngle.bind(this));
        this.registerCapabilityListener('measure_cloudiness', this.onCapabilityCloudCover.bind(this));
        this.registerCapabilityListener('measure_visibility', this.onCapabilityVisibility.bind(this));
        this.registerCapabilityListener('description', this.onCapabilityDescription.bind(this));


        this.pollWeather(interval, settings);

    } // end onInit

    onAdded() {
        let id = this.getData().id;
        this.log('device added: ', id);

    } // end onAdded

    onDeleted() {
        clearInterval(this.pollingInterval);
        let id = this.getData().id;
        //  let device_data = this.getData();
        this.log('device deleted:', id);
    } // end onDeleted

    pollWeather(interval, settings) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(() => {
            this.pollOpenWeatherMap(settings)
        }, 1000 * interval);
    }

    pollOpenWeatherMap(settings) {
        this.log("polling weather...");

        getURL(settings).then(url => {
                return getWeatherData(url);
            })
            .then(data => {
               // this.log(data);

                var temp = data.temp
                var hum = data.humidity
                var pressure = data.pressure
                var rain = data.rain
                // convert from m/s to km/h
                var windstrength = (3.6 * data.windspeed)
                var windangle = data.windangle
                var cloudiness = data.clouds
                var visibility = data.visibility
                var description = data.description

                this.setCapabilityValue('measure_temperature', temp)
                this.setCapabilityValue('measure_humidity', hum)
                this.setCapabilityValue('measure_pressure', pressure)
                this.setCapabilityValue('measure_rain', rain)
                this.setCapabilityValue('measure_wind_strength', windstrength)
                this.setCapabilityValue('measure_wind_angle', windangle)
                this.setCapabilityValue('measure_cloudiness', cloudiness)
                this.setCapabilityValue('measure_visibility', visibility)
                this.setCapabilityValue('description', description)
            })
            .catch(error => {
                this.log(error);
            });

        function getWeatherData(url) {
            return new Promise((resolve, reject) => {
                weather.getURLJSON(url,
                    (error, smart) => {
                        if (smart) {
                            resolve(smart);
                        } else {
                            reject(error);
                        }
                    });
            });
        }

        function getURL(settings) {
            return new Promise((resolve, reject) => {
                weather.getCoordinateURL(settings,
                    (error, url) => {
                        if (url) {
                            resolve(url);
                        } else {
                            reject(error);
                        }
                    });
            });
        }

    }

    onCapabilityTemp(value, opts, callback) {
        callback(err, temp);
    }

    onCapabilityHumidity(value, opts, callback) {
        callback(err, humidity);
    }

    onCapabilityPressure(value, opts, callback) {
        callback(err, pressure);
    }

    onCapabilityRain(value, opts, callback) {
        callback(err, rain);
    }

    onCapabilityWindSpeed(value, opts, callback) {
        callback(err, windspeed);
    }

    onCapabilityWindAngle(value, opts, callback) {
        callback(err, windangle);
    }

    onCapabilityCloudCover(value, opts, callback) {
        callback(err, cloudiness);
    }

    onCapabilityVisibility(value, opts, callback) {
        callback(err, visibility);
    }

    onCapabilityDescription(value, opts, callback) {
        callback(err, description);
    }


    /* function degToCompass(device_data, num) {
        var val = Math.floor((num / 22.5) + 0.5);
       if ( device_data.language == "nl") {
        var arr = ["N", "NNO", "NO", "ONO", "O", "OZO", "ZO", "ZZO", "Z", "ZZW", "ZW", "WZW", "W", "WNW", "NW", "NNW"];
             }
        else {
        var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
             }
        return arr[(val % 16)];
        } */

    /*function degToCompass(device_data, num) {
        while( num < 0 ) num += 360 ;
        while( num >= 360 ) num -= 360 ;
        val= Math.round( (num -11.25 ) / 22.5 ) ;
       if ( device_data.language == "nl") {
        arr=["N","NNO","NO","ONO","O","OZO", "ZO", "ZZO","Z","ZZW","ZW","WZW","W","WNW","NW","NNW"] ;
        else {
        arr=["N","NNE","NE","ENE","E","ESE", "SE", "SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"] ;
             }
        return arr[ Math.abs(val) ] ;
    } */

}
module.exports = openweathermap;
