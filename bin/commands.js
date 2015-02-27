//all the dirty work goes here
//used for easily creating commands
var child = require('child_process');
var fs = require('fs');

var androidDir 			= 	'/tools/android';
var emulatorDir			= 	'/tools/emulator';

module.exports = {
	getDeviceList: function (sdkLocation, callback) {
		var location = sdkLocation;
		if (!location) { //assume android tool is in the path
			child.exec('android list avd', function (err, stdout, stderr) {
		        return callback("Cannot retrieve data. Chances are your android tool is not in the PATH.", stdout);
		    });
		}
		else {
			//go to the directory of the SDK
			var error = goToAndroid(location);
			if (error != null) {
				return callback(error, null);
			}

			child.exec('./android list avd', function (err, stdout, stderr) {
		        return callback(err, stdout);
		    });
		}
	},

	getTargetList: function (sdkLocation, callback) {
		var location = sdkLocation;
		if (!location) { //assume android tool is in the path
			child.exec('android list targets', function (err, stdout, stderr) {
		        return callback("Cannot retrieve data. Chances are your android tool is not in the PATH.", stdout);
		    });
		}
		else {
			//go to the directory of the SDK
			var error = goToAndroid(location);
			if (error != null) {
				return callback(error, null);
			}

			child.exec('./android list targets', function (err, stdout, stderr) {
		        return callback(err, stdout);
		    });
		}
	},

	addDevice: function (data, callback) {
		var name = "\"" + data.name + "\"";
		var target = target;
		var abi = data.abi.replace("default/", "");
		var sdkLocation = data.sdkLocation;
		
		var location = sdkLocation;

		if (!location) { //assume android tool is in the path
			child.exec('echo | android create avd -n ' + name + ' -t ' + target + ' -b ' + abi], function (err, stdout, stderr) {
		        return callback("Cannot retrieve data. Chances are your android tool is not in the PATH.", stdout);
		    });
		}
		else {
			//go to the directory of the SDK
			var error = goToAndroid(location);
			if (error != null) {
				return callback(error, null);
			}

			
			child.exec('echo | android create avd -n ' + name + ' -t ' + target + ' -b ' + abi], function (err, stdout, stderr) {
		        return callback(err, stdout);
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