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
		var name = "\"" + sanitizeString(data.name) + "\"";
		var target = sanitizeString(data.target);
		var abi = sanitizeString(data.abi.replace("default/", ""));
		var sdkLocation = data.sdkLocation;

		var commandInPath = "echo | android create avd -n " + name + " -t " + target + " -b " + abi;
		var commandNotInPath = "echo | ./android create avd -n " + name + " -t " + target + " -b " + abi;

		executeAndroid(sdkLocation, commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	deleteDevice: function (data, callback) {
		var deviceName = "\"" + sanitizeString(data.name) + "\"";
		var sdkLocation = data.sdkLocation;

		var commandInPath = "android delete avd -n " + deviceName;
		var commandNotInPath = "./android delete avd -n " + deviceName;

		executeAndroid(sdkLocation, commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	startEmulator: function (config, callback) {
		var deviceName = "\"" + sanitizeString(config.device) + "\"";
		var isLibrary = sanitizeBoolean(config.isLibrary);
		var testFolderName = sanitizeString(config.testFolderName);
		var sdkLocation = sanitizeString(config.sdkLocation);
		var ide = sanitizeString(config.ide);
		var sdkLocation = config.sdkLocation;

		if (testFolderName == '') {
			//attempt to figure out which folder is the test folder (the first folder found that has "test" in the name)
			exec('cd ${HOME}/.strider/data/*/.; find . -maxdepth 1 -regex ".*test.*" -type d', function (err, stdout, stderr) {
	        	testFolderName = stdout; //TODO: error handling for this function
	    	});
		}
//var startEmulator1		= 	permitAndroid + emulatorDir + ' -avd ';
//var startEmulator2  	= 	' -no-skin -no-audio -no-window -no-boot-anim & adb wait-for-device; cd ${HOME}/.strider/data/*/.; ' +
//							androidDir + ' update project --subprojects -p .; ' + 'cd ';
//var startEmulator3 		=	'; ant clean debug; cd bin/; find $directory -type f -name \*.apk | xargs adb install';

//unfinished. theres multiple apks
//var startEmulatorStudio = 	'chmod +x gradlew; ./gradlew assembleDebug; cd Application/build/outputs/apk/'; 
//use ./gradlew --refresh-dependencies?

//./android update sdk --no-ui to fix dependency issues
//find a way to show errors/process of build in the strider test page!
//		./android list sdk --all lists all the things
//	   	./android update sdk --all --no-ui --filter 4 gets the fourth thing only in that list

		var eclipseInPath = 	"emulator -avd " + deviceName + " -no-skin -no-audio -no-window -no-boot-anim & "
								+ "adb wait-for-device; cd ${HOME}/.strider/data/*/.; "
								+ "android update project --subprojects -p .; "
								+ "cd " + testFolderName + "; ant clean debug; cd bin/; "
								+ "find $directory -type f -name \*.apk | xargs adb install";

		var eclipseNotInPath = 	"./emulator -avd " + deviceName + " -no-skin -no-audio -no-window -no-boot-anim & "
								+ "adb wait-for-device; ./android update project --subprojects -p ${HOME}/.strider/data/*/.; "
								+ "cd ${HOME}/.strider/data/*/" + testFolderName + "; ant clean debug; cd bin/; "
								+ "find $directory -type f -name \*.apk | xargs adb install";

		var androidStudioInPath = 		"emulator -avd " + deviceName + " -no-skin -no-audio -no-window -no-boot-anim & adb wait-for-device; "
										+ "cd ${HOME}/.strider/data/*/.; chmod +x gradlew; ./gradlew assembleDebug; cd Application/build/outputs/apk/; ls";
		var androidStudioNotInPath = 	"./emulator -avd " + deviceName + " -no-skin -no-audio -no-window -no-boot-anim & adb wait-for-device; "
										+ "cd ${HOME}/.strider/data/*/.; chmod +x gradlew; "
										+ "echo \"sdk.dir=${HOME}/" + sdkLocation + "\" >> local.properties; "
										+ "./gradlew assembleDebug; cd Application/build/outputs/apk/; "
										+ "find $directory -type f -name \*test\*.apk | xargs adb install";

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
		else {
			callback("No IDE or invalid IDE specified", null);
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

		console.log(commandNotInPath);

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

var sanitizeString = function (string) {
	return string.match(/[a-zA-Z\d\.\_\-*]/g).join("");
}

//return false if it is anything but "true" or true
var sanitizeBoolean = function (bool) {
	return ("" + bool == "true");
}