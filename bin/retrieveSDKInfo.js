var exec = require('child_process').exec;
var cmd = require('./commands');

var permitAndroid		= 	'chmod 755 ${HOME}/android-sdk-linux/tools/android; ';
var androidDir 			= 	'${HOME}/android-sdk-linux/tools/android';
var emulatorDir			= 	'${HOME}/android-sdk-linux/tools/emulator';

var deviceListCommand 	= 	permitAndroid + '${HOME}/android-sdk-linux/tools/android list avd;';
var targetListCommand 	= 	permitAndroid + '${HOME}/android-sdk-linux/tools/android list targets;';
var createDeviceCommand = 	permitAndroid + 'echo | ${HOME}/android-sdk-linux/tools/android create avd';
var deleteDeviceCommand = 	permitAndroid + '${HOME}/android-sdk-linux/tools/android delete avd -n '

var startEmulator1		= 	permitAndroid + emulatorDir + ' -avd ';
var startEmulator2  	= 	' -no-skin -no-audio -no-window -no-boot-anim & adb wait-for-device; cd ${HOME}/.strider/data/*/.; ' +
							androidDir + ' update project --subprojects -p .; ' + 'cd ';
var startEmulator3 		=	'; ant clean debug; cd bin/; find $directory -type f -name \*.apk | xargs adb install';

//unfinished. theres multiple apks
var startEmulatorStudio = 	'chmod +x gradlew; ./gradlew assembleDebug; cd Application/build/outputs/apk/'; 
//TODO: USE process.chdir FOR CD'ING. PREVENT INJECTIONS PLS
//process.env.HOME for ROOT directory


//TODO:  cd bin/; find $directory -type f -name \*.apk | xargs adb install'; should be a part of the testing phase, not the prepare phase
//var isLibraryAppend 	= 	androidDir + ' update project --subprojects -p ${HOME}/.strider/data/*/.; ' +  
//							'cd sdl_android_tests; ant clean debug; cd bin/; ';
//var isNotLibraryAppend 	= 	androidDir + ' update project --path ${HOME}/.strider/data/*/.; ' +
//							'cd sdl_android_tests; ant clean debug; cd bin/; ' + 
//							'find $directory -type f -name \*.apk | xargs adb install ';

/*
TODO: USE lib-project INSTEAD OF project. ALSO GIVE THE USER THE OPTION TO SELECT WHETHER A LIBRARY IS BEING TESTED
TODO: MIGHT NOT NEED THE ABOVE NOW
${HOME}/android-sdk-linux/tools/android update project --subprojects -p .
cd into android tests
ant clean debug

USE VVV
find $directory -type f -name \*.apk to return the apk file (in the bin directory of the specified project)
*/
module.exports = {
	getDeviceList: function (sdkLocation, callback) {
		var command = cmd.getDeviceList(sdkLocation, function (err, output) {
			var result = null;
			if (output != null) {
				result = parseDeviceList(output);
			}
			
	        return callback(err, result);
	    });
	},
	
	getTargetList: function (sdkLocation, callback) {
		var command = cmd.getTargetList(sdkLocation, function (err, output) {
			var result = null;
			if (output != null) {
				result = parseTargetList(output);
			}
			
	        return callback(err, result);
	    });
	},
	
	addDevice: function (data, callback) {
		var command = cmd.addDevice(data, function (err, output) {			
	        return callback(err, output);
	    });

	},

	startEmulator: function (configData, callback) {
		//get the settings from configData
		var deviceName = config.deviceName;
		var isLibrary = config.isLibrary;
		var testFolderName = config.testFolderName;
		var sdkLocation = config.sdkLocation;
		var ide = config.ide;

		if (testFolderName == '') {
			//attempt to figure out which folder is the test folder (the first folder found that has "test" in the name)
			exec('cd ${HOME}/.strider/data/*/.; find . -maxdepth 1 -regex ".*test.*" -type d', function (err, stdout, stderr) {
	        	testFolderName = stdout;
	    	});
		}

		var finalCommand = startEmulator1 + deviceName + startEmulator2 + testFolderName + startEmulator3;

		/*if (isLibrary) {
			finalCommand = finalCommand.concat(isLibraryAppend);
		}
		else {
			finalCommand = finalCommand.concat(isNotLibraryAppend);
		}*/

		console.log(finalCommand);

		exec(finalCommand, function (err, stdout, stderr) {
	        return callback(stdout);
	    });

	},

	deleteDevice: function (data, callback) {
		var deviceName = data.name;
		var finalCommand = deleteDeviceCommand.concat(deviceName);

		exec(finalCommand, function (err, stdout, stderr) {
	        return callback(stdout);
	    });
	}
}

//this function takes the list of android devices that are usuable and converts each name, target, abi to an object and returns a list
var parseDeviceList = function (input) {
	var deviceList = [];
	var list = input.split("\n");
	//remove the first line
	list.splice(0,1);

	for (var index = 0; index < list.length; index += 6) {
		var deviceObj = {
			name: list[index].replace("Name:", "").trim(),
			target: list[index + 2].replace("Target:", "").trim(),
			abi: list[index + 3].replace("Tag/ABI:", "").trim(),
		};
		
		deviceList.push(deviceObj);
	}	

	return deviceList;
}

//this function takes the list of android targets that are usuable and returns a list of them
var parseTargetList = function (input) {
	var list = input.match(/id: \d*|Name: .*|Type: .*|API level: .*|Tag\/ABIs : .*/g);
	var groupedList = [];
	for (match in list) {
		var fiveProperties = list.splice(0,5);
		groupedList.push(fiveProperties);
	}
	var targetList = [];

	var success = groupedList.every(function (element, index, array) {
		var id = element[0].replace("id: ", "");
		var name = element[1].replace("Name: ", "");
		var type = element[2].replace("Type: ", "");
		var api = element[3].replace("API level: ", "");
		var abis = element[4].replace("Tag/ABIs :", "");
		//console.log("Name: " + name);
		//console.log("Type: " + type);
		//console.log("ABIs: " + abis);
		if (abis == "no ABIs" || type != "Platform") {//a platform which has no ABIs cannot run on an emulator. error out
			return false;
		}

		var abiList = abis.split(",");
		
		var targetFound = {
			id: id,
			name: name,
			api: api,
			abis: abiList
		};
		targetList.push(targetFound);
		return true;
	});

	if (success) {
		//return the list of android targets
		return targetList;
	}
	else {
		//don't return anything
	}

}

var testProject = function () {

}