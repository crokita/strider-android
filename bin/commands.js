//all the dirty work goes here
//used for easily creating commands
var exec = require('child_process').exec;
var fs = require('fs');

var androidDir 			= 	'/tools/android';
var emulatorDir			= 	'/tools/emulator';

module.exports = {
	getDeviceList: function (sdkLocation, callback) {
		var location = sdkLocation;
		if (!location) { //assume android tool is in the path
			exec('android list avd', function (err, stdout, stderr) {
		        return callback(null, stdout);
		    });
		}
		else {
			//go to the directory of the SDK
			var error = goToAndroid(location);
			if (error != null) {
				return callback(error, null);
			}

			exec('./android list avd', function (err, stdout, stderr) {
		        return callback(null, stdout);
		    });
		}
	}

	getTargetList: function (sdkLocation, callback) {
		var location = sdkLocation;
		if (!location) { //assume android tool is in the path
			exec('android list targets', function (err, stdout, stderr) {
		        return callback(null, stdout);
		    });
		}
		else {
			//go to the directory of the SDK
			var error = goToAndroid(location);
			if (error != null) {
				return callback(error, null);
			}

			exec('./android list targets', function (err, stdout, stderr) {
		        return callback(null, stdout);
		    });
		}
	}

}

//goes to the tools folder of the SDK given a location. also gives permission to execute the android tool
//returns null if successful. returns a string error if not
var goToAndroid = function (location) {
	process.chdir(process.env.HOME);

	try {
	  	process.chdir(location);
	}
	catch (err) {
		return "The SDK directory specified does not exist";
	}

	process.chdir("tools");
	fs.chmodSync('android', '755');
	return null;
}