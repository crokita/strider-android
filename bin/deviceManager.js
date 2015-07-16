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
var SERIAL_NAME = "serial"; //a constant for getting the serial name. it's a string
var PORT_NUMBER = "port"; //a constant for getting the port number. it's a number

module.exports = {
	DEVICE_NAME: DEVICE_NAME,
	SERIAL_NAME: SERIAL_NAME, 
	PORT_NUMBER: PORT_NUMBER,
	findDeviceInfo: findDeviceInfo,

	//starts an emulator with a given adb location, emulator location, and device name. the rest is automatically handled
	startEmulator: function(adb, emulator, deviceName, callback) {
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
			return callback(code);
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