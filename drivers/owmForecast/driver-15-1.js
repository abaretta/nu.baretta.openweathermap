"use strict";
// need Homey module, see SDK Guidelines
const Homey = require('homey');
const weather = require('index.js');

class owmForecastDriver extends Homey.Driver {

    onPair(socket) {

        // this is called when the user presses save settings button in start.html
        socket.on('get_devices', (device_data, callback) => {

            callback(null, device_data);
            //  socket.emit('continue', null);
        });

        // this happens when user clicks away the pairing windows
        socket.on('disconnect', () => {
            this.log("OpenWeatherMap - Pairing is finished (done or aborted) ");
        })


    } // end onPair


}
module.exports = owmForecastDriver;
