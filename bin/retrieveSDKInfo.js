var exec = require('child_process').exec;

var permitAndroid		= 	'chmod 755 ${HOME}/android-sdk-linux/tools/android; ';
var androidDir 			= 	'${HOME}/android-sdk-linux/tools/android';
var emulatorDir			= 	'${HOME}/android-sdk-linux/tools/emulator';

var deviceListCommand 	= 	permitAndroid + '${HOME}/android-sdk-linux/tools/android list avd;';
var targetListCommand 	= 	permitAndroid + '${HOME}/android-sdk-linux/tools/android list targets;';
var createDeviceCommand = 	permitAndroid + 'echo | ${HOME}/android-sdk-linux/tools/android create avd';

var startEmulatorFront	= 	permitAndroid + emulatorDir + ' -avd ';
var startEmulatorBack  	= 	' -no-skin -no-audio -no-window -no-boot-anim & adb wait-for-device; cd ${HOME}/.strider/data/; cd */.; ';

//TODO: replace the hardcoded test project (sdl_android_tests)
var isLibraryAppend 	= 	androidDir + ' update project --subprojects -p ${HOME}/.strider/data/*/.; ' +  
							'cd sdl_android_tests; ant clean debug; cd bin/; ';
var isNotLibraryAppend 	= 	androidDir + ' update project --path ${HOME}/.strider/data/*/.; ' +
							'cd sdl_android_tests; ant clean debug; cd bin/; ';

var deviceName = '';
var startEmulatorCommand = 	permitAndroid + emulatorDir + ' -avd ' + deviceName + 
							' -no-skin -no-audio -no-window -no-boot-anim & adb wait-for-device; cd ${HOME}/.strider/data/*/.; ' +
							androidDir + ' update project --subprojects -p ,; ' + 'cd sdl_android_tests; ant clean debug; cd bin/ ls';

/*
TODO: USE lib-project INSTEAD OF project. ALSO GIVE THE USER THE OPTION TO SELECT WHETHER A LIBRARY IS BEING TESTED
TODO: MIGHT NOT NEED IT NOW ^^
${HOME}/android-sdk-linux/tools/android update project --subprojects -p .
cd into android tests
ant clean debug

USE VVV
find $directory -type f -name \*.apk to return the apk file (in the bin directory of the specified project)

androidDir=${HOME}/android-sdk-linux/tools/android #the location of where the android tool is 
emulatorDir=${HOME}/android-sdk-linux/tools/emulator64-arm #the location of where the android emulator is (emulator64-arm) (emulator64-x86) (emulator64-mips) 

#start the emulator so that it doesn't block the program flow
$emulatorDir -avd $device -no-skin -no-audio -no-window -no-boot-anim &
adb wait-for-device #continue only once the device boots up
echo "Device $device booted!"

#go to the root directory of the project
cd ${HOME}/.strider/data/
ls #derp
*/
module.exports = {
	getDeviceList: function (callback) {
		exec(deviceListCommand, function (err, stdout, stderr) {
			var result = parseDeviceList(stdout);
	        return callback(result);
	    });
	},
	
	getTargetList: function (callback) {
		exec(targetListCommand, function (err, stdout, stderr) {
			var result = parseTargetList(stdout);
	        return callback(result);
	    });
	},
	
	addDevice: function (data, callback) {
		//concatenate all the options given from data
		var includeName = ' -n ' + data.name;
		var includeTarget = ' -t ' + data.target;
		var includeAbi = ' -b ' + data.abi;
		var includeSkin = ' -s ' + data.skin;
		includeAbi = includeAbi.replace("default/", ""); //remove the "default/" appended to the abi selection
		if (data.skin.search("default") != -1) { //if the default option was picked then ignore it
			includeSkin = "";
		}
		var finalCommand = createDeviceCommand.concat(includeName + includeTarget + includeAbi + includeSkin);
		console.log(finalCommand);
		exec(finalCommand, function (err, stdout, stderr) {
	        return callback();
	    });
	},

	startEmulator: function (deviceName, isLibrary, callback) {
		/*var finalCommand = startEmulatorFront + deviceName + startEmulatorBack;

		if (isLibrary) {
			finalCommand = finalCommand.concat(isLibraryAppend);
		}
		else {
			finalCommand = finalCommand.concat(isNotLibraryAppend);
		}
		console.log(finalCommand);
		*/
		this.deviceName = deviceName;
		console.log(startEmulatorCommand);
		exec(startEmulatorCommand, function (err, stdout, stderr) {
			console.log(err);
			console.log(stdout);
			console.log(stderr);

	        return callback();
	    });
	}
}

//this function takes the list of android devices that are usuable and converts each name, target, abi and skin to an object and returns a list
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
			skin: list[index + 4].replace("Skin:", "").trim()
		};
		
		deviceList.push(deviceObj);
	}	

	return deviceList;
}

//this function takes the list of android targets that are usuable and returns a list of them
var parseTargetList = function (input) {
	var list = input.match(/id: \d*|Name: .*|Type: .*|API level: .*|Skins: .*|Tag\/ABIs : .*/g);
	var groupedList = [];
	for (match in list) {
		var sixProperties = list.splice(0,6);
		groupedList.push(sixProperties);
	}
	var targetList = [];

	var success = groupedList.every(function (element, index, array) {
		var id = element[0].replace("id: ", "");
		var name = element[1].replace("Name: ", "");
		var type = element[2].replace("Type: ", "");
		var api = element[3].replace("API level: ", "");
		var skins = element[4].replace("Skins: ", "");
		var abis = element[5].replace("Tag/ABIs :", "");
		//console.log("Name: " + name);
		//console.log("Type: " + type);
		//console.log("ABIs: " + abis);
		if (abis == "no ABIs" || type != "Platform") {//a platform which has no ABIs cannot run on an emulator. error out
			return false;
		}
		
		var skinList = skins.split(",");
		var abiList = abis.split(",");
		
		var targetFound = {
			id: id,
			name: name,
			api: api,
			skins: skinList,
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