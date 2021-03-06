//this is an intermediate module which may modify the data after commands.js creates the result
var cmd = require('./commands');
var manager = require('./deviceManager');
var StringDecoder = require('string_decoder').StringDecoder;

module.exports = {
	
	getDeviceList: function (sdkLocation, callback) {
		cmd.getDeviceList(sdkLocation, function (err, emulators, physicals) {
			var emulatorsResult = null;
			var physicalResult = null;

			if (emulators != null) {
				emulatorsResult = parseEmulators(emulators);
			}
			if (physicals != null) {
				physicalResult = parsePhysicals(physicals);
			}


			var runningEmulators = physicalResult.emulators;
			var physicals = physicalResult.devices;

			//running emulators will have their serial name instead of the device name. convert it to the device name
			for (var index = 0; index < runningEmulators.length; index++) {
				runningEmulators[index] = manager.findDeviceInfo(runningEmulators[index], manager.SERIAL_NAME).name;
			}

			//now for each emulator found, give a value as to whether it is running
			//it will then have name, target, abi, and running
			for (var index = 0; index < emulatorsResult.length; index++) {

				var running = false;
				for (var subindex = 0; subindex < runningEmulators.length; subindex++) {
					if (emulatorsResult[index].name == runningEmulators[subindex]) {
						running = true;
						subindex = runningEmulators.length;
					}
				}
				emulatorsResult[index].running = running;
			}
	        return callback(err, emulatorsResult, physicals);
	    });
	},
	
	getTargetList: function (sdkLocation, callback) {
		cmd.getTargetList(sdkLocation, function (err, output) {
			var result = null;
			if (output != null) {
				result = parseTargetList(output);
			}
			
	        return callback(err, result);
	    });
	},
	
	addDevice: function (data, callback) {
		cmd.addDevice(data, function (err, output) {			
	        return callback(err, output);
	    });
	},

	deleteDevice: function (data, callback) {
		cmd.deleteDevice(data, function (err, output) {			
	        return callback(err, output);
	    });
	},

	stopEmulator: function (data, callback) {
		cmd.stopEmulator(data, function (err, output) {
			return callback(err, output);
		});
	},

	startEmulator: function (configData, context, callback) {
		cmd.startEmulator(configData, context, function () {
			return callback();
		});
	},

	installApk: function (configData, context, callback) {
		//do one preliminary check as to whether a physical device is connected (if testing on a physical device) 
		var decoder = new StringDecoder('utf8'); //helps convert the buffer byte data into something human-readable
		var sdkLocation = cmd.sanitizeSDK(configData.sdkLocation);
		var absoluteSdk = sdkLocation + "/";
		var adb;

		if (sdkLocation == "") { //assume tools is in the path if no location is specified
			adb = "adb";
		}
		else {
			adb = absoluteSdk + cmd.sdkTools["adb"]["toolFull"];
		}

		if (configData.isEmulator) {
			cmd.installApk(configData, context, function (err, output) {
				if (configData.autoStop) { //kill the emulator
					manager.stopEmulator(adb, configData.device, decoder, function (err, result) {
						context.out(result);
						return callback(err, output);
					});
				}
				else {
					return callback(err, output);
				}
				
			});
		}
		else {
			this.getDeviceList(configData.sdkLocation, function (err, emulatorResult, physicalResult) {
				var deviceList = physicalResult;
				var foundDevice = false;
				for(var index = 0; index < deviceList.length; index++) {
					if (configData.device == deviceList[index]) {
						foundDevice = true;
						index = deviceList.length; //bail out of the loop
					}
				}

				if (foundDevice) {
					//a device is found. temporarily add the device to the deviceManager list. it will be removed once the tests end
					manager.addDevice(configData.device, configData.device, null);

					cmd.installApk(configData, context, function (err, output) {
						manager.removeDevice(configData.device); //remove it once the testing is done, no matter what
						return callback(err, output);
					});
				}
				else {
					context.out("The physical device " + configData.device + " isn't connected! Stopping test process\n");
					return callback(1, false);
				}
		    });			
		}

	}

}

//this function takes the list of android emulators that are usuable and converts each name, target, abi to an object and returns a list
var parseEmulators = function (input) {
	var deviceList = [];
	var list = input.split("\n");
	//remove the first line
	list.splice(0,1);

	//check whether the list is empty
	if (list.length == 1) {
		return null;
	}

	//sort through all the device information
	var deviceObj = {};
	for (var index = 0; index < list.length; index += 1) {
		var line = list[index];
		if (line.search("Name:") != -1) {
			deviceObj.name = line.replace("Name:", "").trim();
		}
		else if (line.search("Target:") != -1) {
			deviceObj.target = line.replace("Target:", "").trim();
		}
		else if (line.search("Tag/ABI:") != -1) {
			deviceObj.abi = line.replace("Tag/ABI:", "").trim();
		}
		else if (line.charAt(0) == "-") { //end of device information. make a new one
			deviceList.push(deviceObj);
			deviceObj = {};
		}
	}	
	//reached the end. push the last device onto deviceList
	deviceList.push(deviceObj);
	/*
	for (var index = 0; index < list.length; index += 6) {
		var deviceObj = {
			name: list[index].replace("Name:", "").trim(),
			target: list[index + 2].replace("Target:", "").trim(),
			abi: list[index + 3].replace("Tag/ABI:", "").trim(),
		};
		
		deviceList.push(deviceObj);
	}	
	*/

	return deviceList;
}

//this function takes the list of android physical devices that are usuable and returns a list of device names AND running emulators
var parsePhysicals = function (input) {
	var deviceList = [];
	var emulatorList = [];
	var list = input.split("\n");
	//remove the first line
	list.splice(0,1);

	//check whether the list is empty
	if (list.length == 1) {
		return null;
	}

	//sort through all the device information. put RUNNING emulators in another field
	for (var index = 0; index < list.length; index += 1) {
		var line = list[index];
		var nameAndState = line.split("\t"); //they are separated by one tab

		//use deviceManager to see if it's an emulator that is running
		//the only reason that manager is being used instead of doing a regex is because someone who really likes
		//breaking things may name their emulator "emulator-XXXX" and then all is hopeless
		var result = manager.findDeviceInfo(nameAndState[0], manager.SERIAL_NAME);
		if (result == null) {//it's not an emulator
			if (nameAndState[1] == "device") { //it's an online, connected device. include it
				deviceList.push(nameAndState[0]); //add just the name
			}
		}
		else { //check if it's a running emulator and add it to the other list
			if (nameAndState[1] == "device") { //it's an online, connected emulator. include it
				emulatorList.push(nameAndState[0]); //add just the name
			}
		}
	}	

	var finalObj = {
		emulators: emulatorList,
		devices: deviceList
	}

	return finalObj;
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

		if (abis.trim() == "no ABIs." || type != "Platform") {//a platform which has no ABIs cannot run on an emulator. stop
			return true;
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