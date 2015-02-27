//all the dirty work goes here
//used for easily creating commands
var exec = require('child_process').exec;
var fs = require('fs');

var defaultSDKLocation  =   'android-sdk-linux';
var androidDir 			= 	'/tools/android';
var emulatorDir			= 	'/tools/emulator';

module.exports = {
	getDeviceList: function (sdkLocation, callback) {
		var location = sdkLocation;
		if (!location) {
			location = defaultSDKLocation;
		} 

		//go to the directory of the SDK
		goToAndroid(location);

		exec('./android list avd', function (err, stdout, stderr) {
	        return callback(stdout);
	    });
	}

}

//goes to the tools folder of the SDK given a location. also gives permission to execute the android tool
var goToAndroid = function (location) {
	process.chdir(process.env.HOME);
	process.chdir(location, function (k) {
		console.log(k);
	});

	process.chdir("tools");
	fs.chmodSync('android', '755');
	return;
}