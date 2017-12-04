"use strict";
// need Homey module, see SDK Guidelines
const Homey = require('homey');
const weather = require('index.js');

class openweathermap extends Homey.Driver {

    //async
    onPair(socket) {

        let ManagerCloud = Homey.ManagerGeolocation;
        let lat = ManagerCloud.getLatitude();
        let lon = ManagerCloud.getLongitude();
        let language = Homey.ManagerI18n.getLanguage();
        let units = Homey.ManagerI18n.getUnits();

        let devices = [{
            "data": {
                "id": "initial_id"
            },
            "name": "initial_name",
            "settings": {
                "APIKey": null,
                "GEOlocationCity": null,
                "GEOlocationZip": null,
                "lat": lat,
                "lon": lon,
                "language": language,
                "unit": units
            }
        }];

        // this is called when the user presses save settings button in start.html
        socket.on('get_devices', function(device_data, callback) {
            let settings = device_data.settings;
            settings["lat"] = lat;
            settings["lon"] = lon;
            console.log("Settings added: ");
            console.log(settings);

            devices = [{
                "data": {
                    "id": device_data.data.id
                },
                "name": device_data.name,
                "settings": settings,
            }];

            console.log("devices on pairing: ");
            console.log(devices);

            console.log("device_data on pairing: ");
            console.log(device_data);
            callback(null, devices);
            socket.emit('continue', null);
        });

        // this happens when user clicks away the pairing windows
        socket.on('disconnect', function() {
            console.log("OpenWeatherMap - Pairing is finished (done or aborted) "); // using console.log because this.log or Homey.log is not a function
        })


    } // end onPair


}
module.exports = openweathermap;
