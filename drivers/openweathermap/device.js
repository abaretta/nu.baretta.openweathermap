/* From Homey SDK 2.0 docs: The file device.js is a representation of an already paired device on Homey */
'use strict';

const Homey = require('homey');
const weather = require('index.js');

//var devices = [];

class openweathermap extends Homey.Device {

    onInit() {
            this.log('device init');
            console.dir(this.getSettings()); // for debugging
            console.dir(this.getData()); // for debugging
            this.log('name: ', this.getName());
            this.log('class: ', this.getClass());

            //let freq = this.getData().updateFrequency;
            // let id = this.getData().id;
            //this.log( 'id: ', id );
            let device_data = this.getData();
            this.log('device_data.id: ', device_data.id);
            let freq = device_data.updateFrequency;
            this.log('updateFrequency: ', freq);

            let id = this.getData().id;
            let ManagerCloud = Homey.ManagerGeolocation;
            let lat = ManagerCloud.getLatitude();
            let lon = ManagerCloud.getLongitude();
            let name = device_data.name + device_data.id;
            let cronName = name.toLowerCase();

            device_data.lat = lat;
            device_data.lon = lon;

            // register capability listeners
            this.registerCapabilityListener('measure_temperature', this.onCapabilityTemp.bind(this));
            this.registerCapabilityListener('measure_humidity', this.onCapabilityHumidity.bind(this));
            this.registerCapabilityListener('measure_pressure', this.onCapabilityPressure.bind(this));
            this.registerCapabilityListener('measure_wind_strength', this.onCapabilityWindSpeed.bind(this));
            this.registerCapabilityListener('measure_wind_angle', this.onCapabilityWindAngle.bind(this));
            this.registerCapabilityListener('measure_cloudiness', this.onCapabilityCloudCover.bind(this));
            this.registerCapabilityListener('measure_visibility', this.onCapabilityVisibility.bind(this));
            this.registerCapabilityListener('description', this.onCapabilityDescription.bind(this));

            console.log("cronName:" + cronName);
            var interval = Math.round(this.getData().updateFrequency / 60);

            if (Homey.ManagerCron.getTask("cronName")) {
                console.log("Task is already registered, unregister: " + cronName);
                Homey.ManagerCron.unregisterTask("cronName");
            }

            Homey.ManagerCron.registerTask("cronName", "30 * * * * *", device_data)
                .then(task => {
                    task.on('run', () => this.pollOpenWeatherMap(device_data));
                })
                .catch(err => {
                    console.log(err);
                });

            // flow conditions
            //new Homey.FlowCardCondition(id)

        } // end onInit

    onAdded() {
            let id = this.getData().id;
            this.log('device added: ', id);

        } // end onAdded

    onDeleted() {
            let id = this.getData().id;
            let device_data = this.getData();
            this.log('device deleted:', id);
            let name = device_data.name + device_data.id;
            let cronName = name.toLowerCase();
            Homey.ManagerCron.unregisterAllTasks(function(err, success) {});
           // Homey.ManagerCron.unregisterTask(cronName, function(err, success) {});
        } // end onDeleted


    pollOpenWeatherMap(device_data) {
        let device = Homey.ManagerDrivers.getDriver('openweathermap').getDevice(this.getData());
        let id = this.getData().id; 
        console.log("polling weather...");
        var APIKey = device_data.APIKey;
        var language = device_data.language;
        var GEOlocationCity = device_data.GEOlocationCity;
        var GEOlocationZip = device_data.GEOlocationZip;
        var lat = device_data.lat;
        var lon = device_data.lon;
        weather.setAPPID(APIKey);
        //weather.setLang(language);
        weather.setLang('nl');
        weather.setUnits('metric');
        //weather.setCity('tilburg');
        weather.setCoordinate(lat, lon);

        weather.getAllWeather(function(err, data) {
            //console.log(data);
            var temp = data.main.temp
            var hum = data.main.humidity
            var pressure = data.main.pressure
            var windstrength = data.wind.speed
            var windangle = data.wind.deg
            var cloudiness = data.clouds.all
            var visibility = data.visibility
            var description = data.weather[0].description

            device.setCapabilityValue('measure_temperature', temp)
            device.setCapabilityValue('measure_humidity', hum)
            device.setCapabilityValue('measure_pressure', pressure)
            device.setCapabilityValue('measure_wind_strength', windstrength)
            device.setCapabilityValue('measure_wind_angle', windangle)
            device.setCapabilityValue('measure_cloudiness', cloudiness)
            device.setCapabilityValue('measure_visibility', visibility)
            device.setCapabilityValue('description', description)

        });
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
