//all the dirty work goes here
//used for easily creating commands
var validator = require('validator');

var defaultSDKLocation  =   'android-sdk-linux';
var androidDir 			= 	'/tools/android';
var emulatorDir			= 	'/tools/emulator';

module.exports = {
	getDeviceList: function (sdkLocation) {
		var location = validator.toString(sdkLocation); //sanitize input

		if (!location) {
			location = defaultSDKLocation;
		} 
		return 'chmod 755 ${HOME}/' + location + androidDir + "; ${HOME}/" + location + androidDir + " list avd";
	}

}