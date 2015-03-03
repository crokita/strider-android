//all the dirty work goes here
//used for easily creating commands
var child = require('child_process');
var fs = require('fs');

module.exports = {
	getDeviceList: function (sdkLocation, callback) {
		var commandInPath = "android list avd";
		var commandNotInPath = "./android list avd";

		executeAndroid(sdkLocation, commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	getTargetList: function (sdkLocation, callback) {
		var commandInPath = "android list targets";
		var commandNotInPath = "./android list targets";

		executeAndroid(sdkLocation, commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	addDevice: function (data, callback) {
		var name = "\"" + sanitize(data.name) + "\"";
		var target = sanitize(data.target);
		var abi = sanitize(data.abi.replace("default/", ""));
		var sdkLocation = data.sdkLocation;

		var commandInPath = "echo | android create avd -n " + name + " -t " + target + " -b " + abi;
		var commandNotInPath = "echo | ./android create avd -n " + name + " -t " + target + " -b " + abi;

		executeAndroid(sdkLocation, commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	deleteDevice: function (data, callback) {
		var deviceName = "\"" + sanitize(data.name) + "\"";
		var sdkLocation = data.sdkLocation;

		var commandInPath = "android delete avd -n " + deviceName;
		var commandNotInPath = "./android delete avd -n " + deviceName;

		executeAndroid(sdkLocation, commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	startEmulator: function (config, callback) {
		console.log(config);

		var deviceName = "\"" + sanitize(config.device) + "\"";
		var isLibrary = sanitize(config.isLibrary);
		var testFolderName = sanitize(config.testFolderName);
		var sdkLocation = sanitize(config.sdkLocation);
		var ide = sanitize(config.ide);
		var sdkLocation = config.sdkLocation;

//var startEmulator1		= 	permitAndroid + emulatorDir + ' -avd ';
//var startEmulator2  	= 	' -no-skin -no-audio -no-window -no-boot-anim & adb wait-for-device; cd ${HOME}/.strider/data/*/.; ' +
//							androidDir + ' update project --subprojects -p .; ' + 'cd ';
//var startEmulator3 		=	'; ant clean debug; cd bin/; find $directory -type f -name \*.apk | xargs adb install';

//unfinished. theres multiple apks
//var startEmulatorStudio = 	'chmod +x gradlew; ./gradlew assembleDebug; cd Application/build/outputs/apk/'; 
		var eclipseInPath = "";
		var eclipseNotInPath = "";
		var androidStudioInPath = "";
		var androidStudioNotInPath = "";

		if (testFolderName == '') {
			//attempt to figure out which folder is the test folder (the first folder found that has "test" in the name)
			exec('cd ${HOME}/.strider/data/*/.; find . -maxdepth 1 -regex ".*test.*" -type d', function (err, stdout, stderr) {
	        	testFolderName = stdout; //TODO: error handling for this function
	    	});
		}

		if (ide == "Eclipse") {
			executeAndroid(sdkLocation, eclipseInPath, eclipseNotInPath, function (err, output) {
				callback(err, output);
			});
		}
		else if (ide == "AndroidStudio") {
			executeAndroid(sdkLocation, androidStudioInPath, androidStudioNotInPath, function (err, output) {
				callback(err, output);
			});
		}
		
	}

}

//this function DOES NOT check for malicious commands; that must be checked by the calling functions!
var executeAndroid = function (sdkLocation, commandInPath, commandNotInPath, callback) {
	var location = sdkLocation;
	if (!location) { //assume android tool is in the path if no location is specified
		child.exec(commandInPath, function (err, stdout, stderr) {
	        return callback("Cannot retrieve data. Chances are your android tool is not in the PATH.", stdout);
	    });
	}
	else {
		//go to the directory of the SDK
		var error = goToAndroid(location);
		if (error != null) {
			return callback(error, null);
		}
		child.exec(commandNotInPath, function (err, stdout, stderr) {
	        return callback(err, stdout);
	    });
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
	fs.chmodSync('emulator', '755');
	return null;
}

var sanitize = function (string) {
	return string.match(/[a-zA-Z\d\.\_\-*]/g).join("");
}