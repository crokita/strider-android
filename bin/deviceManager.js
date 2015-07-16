//the purpose of this class is to easily manage running emulators and connected devices.
var child = require('child_process');
//this stores an array of values which contain the device name and serial number. for physical devices they would be the same thing
var devices = []; 
/* the following is the device model:
{
	name: string
	serialName: string (for emulators its emulator-<port>. devices have a random string)
	port: number
}
*/

var DEVICE_NAME = "name"; //a constant for getting the device name. it's a string
var SERIAL_NAME = "serialName"; //a constant for getting the serial name. it's a string
var PORT_NUMBER = "port"; //a constant for getting the port number. it's a number

//find a device by a value. valueType is what the parameter is (i.e. device name, serial number). use the constants provided by module exports
//if null is passed in as the value then return every value found from valueType and return it as an array
var findDeviceInfo = function (value, valueType) {
	if (value != null) {
		for(var index = 0; index < devices.length; index++) {
			var device = devices[index];
			if (device[valueType] == value) {
				return device;
			}
		}
		//if the device isn't found, return null
		return null;
	}
	else {
		var allResults = [];
		for(var index = 0; index < devices.length; index++) {
			var device = devices[index];
			allResults.push(device[valueType]);
		}
		return allResults;
	}
}

//add a device or emulator given a name and the serial number. for physical devices they would be the same thing
var addDevice = function (name, serialName, port) {
	var device = {};
	device.name = name;
	device.serialName = serialName;
	device.port = port;
	devices.push(device);
	return;
}

//remove a device or emulator by the name of the device
var removeDevice = function (name) {
	var newDevices = [];

	//methodology: add all items that don't match to a new array. then assign it to devices
	for(var index = 0; index < devices.length; index++) {
		var device = devices[index];
		if (device["name"] != name) { //no match. it's not the searching element. add it to the array
			newDevices.push(device);
		}
	}
	devices = newDevices;
	return;
}

module.exports = {
	DEVICE_NAME: DEVICE_NAME,
	SERIAL_NAME: SERIAL_NAME, 
	PORT_NUMBER: PORT_NUMBER,
	findDeviceInfo: findDeviceInfo,
	addDevice: addDevice,
	removeDevice: removeDevice,

	//starts an emulator with a given adb location, emulator location, and device name. It also requires a context for logging
	startEmulator: function(adb, emulator, deviceName, context, callback) {
		//check if the emulator is already running. it may be possible to have this work for physical devices, too
		var checkDevice = findDeviceInfo(deviceName, DEVICE_NAME);
		if (checkDevice != null) { //if it was found, exit immediately
			return callback("Found already running emulator: " + deviceName + "\n");
		}
		//we need a way to identify the process once it starts running, since there could be more than one emulator/device
		//give it a port number and remember it
		var port = generatePortNumber();
		var serialName = "emulator-" + port;

		var emulatorCommand = child.spawn(emulator, ["-avd", deviceName, "-no-skin", "-no-audio", "-no-window", "-no-boot-anim", "-port", port]);
		var adbCommand = child.spawn(adb, ["-s", serialName, "wait-for-device"]);

		emulatorCommand.stdout.on('data', function (data) {
			context.out(data);
		});

		emulatorCommand.stderr.on('data', function (data) {
			context.out(data);
		});
		
		adbCommand.on('close', function (code) { //emulator booted
			//now save the emulator information in devices
			addDevice(deviceName, serialName, port);
			return callback("Started up emulator " + deviceName + "\n");
		});
	},

	stopEmulator: function (adb, deviceName, decoder, callback) {
		var foundEmulator = manager.findDeviceInfo(deviceName, manager.DEVICE_NAME);
		//found the emulator to delete
		if (foundEmulator != null) {
			var serialName = foundEmulator.serialName;

			var adbCommand = child.spawn(adb, ["-s", serialName, "emu", "kill"]);

			var fullOutputResults = "";

			adbCommand.stdout.on('data', function (data) {
				var data = decoder.write(data);
				fullOutputResults = fullOutputResults.concat(data);
			});
			adbCommand.stderr.on('data', function (data) {
				var data = decoder.write(data);
				fullOutputResults = fullOutputResults.concat(data);
			});
			
			adbCommand.on('close', function (code) {
				return callback(null, fullOutputResults);
			});
		}
		else {
			return callback("No emulator found running for name " + deviceName, null);
		}
	},

	//install an apk given a path, the apk name, and context. path contains the adb command and the device name
	installApk: function (path, apkName, context, callback) {
		var device = findDeviceInfo(path.device, DEVICE_NAME);		
		var adbCommand = child.spawn(path.adb, ["-s", device.serialName, "install", "-r", apkName]);

		adbCommand.stdout.on('data', function (data) {
			context.out(data);
		});

		adbCommand.stderr.on('data', function (data) {
			context.out(data);
		});

		adbCommand.on('close', function (code) {
			return callback();
		});
	},

	//this file needs to run it because the adb doesn't know which device to launch the tests on
	//run the unit tests given the package and activity
	runTests: function (path, packageName, activityName, decoder, context, callback) {
		var device = findDeviceInfo(path.device, DEVICE_NAME);

		var runTestsCmd = child.spawn(path.adb, ["-s", device.serialName, "shell", "am", "instrument", "-w", packageName+"/"+activityName]);
		var fullOutputResults = "";

		runTestsCmd.stdout.on('data', function (data) {
			var data = decoder.write(data);
			context.out(data);
			fullOutputResults = fullOutputResults.concat(data);
		});
		runTestsCmd.stderr.on('data', function (data) {
			var data = decoder.write(data);
			context.out(data);
			fullOutputResults = fullOutputResults.concat(data);
		});
		
		//NOTES: The first parameter of done() determines the test status
		//if it's 0, null or undefined the test passes
		//if it's a non-zero number it fails
		//if it's a string it's an error
		
		runTestsCmd.on('close', function (code) {
			//check whether the unit tests have passed
			var result = fullOutputResults.search(/OK \(\d* test(s*)\)/g);
			if (result == -1) {
				return callback(1, true); //non-zero number will cause a failure
			}
			else {
				return callback(null, true); //the tests passed
			}
			
		});
	}
}

//generates a valid port number, which is one that isn't used by other emulators and is an even number
var generatePortNumber = function () {
	var emulatorPortLow = 5554; //the lowest the port number can be for an android emulator. MUST BE EVEN
	var emulatorPortHigh = 5680; //the highest the port number can be for an android emulator. MUST BE EVEN
	var possiblePorts = []; //the valid ports
	//find all used ports from the emulators
	var portArray = findDeviceInfo(null, PORT_NUMBER);

	//add only the valid ports to the array
	for (var index = emulatorPortLow; index <= emulatorPortHigh; index += 2) {
		if (portArray.indexOf(index) == -1) {
			possiblePorts.push(index);
		}
	}

	//now pick a random element in possiblePorts and make that the emulator port
	var randomNumber = Math.floor(Math.random() * possiblePorts.length);
	return possiblePorts[randomNumber];
}