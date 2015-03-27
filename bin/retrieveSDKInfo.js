//this is an intermediate module which may modify the data after commands.js creates the result
var cmd = require('./commands');

module.exports = {
	
	getDeviceList: function (sdkLocation, callback) {
		cmd.getDeviceList(sdkLocation, function (err, output) {
			var result = null;
			if (output != null) {
				result = parseDeviceList(output);
			}
			
	        return callback(err, result);
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

	findEmulator: function (context, callback) {
		cmd.findEmulator(context, function (result) {
			return callback(result);
		});
	},

	startEmulator: function (configData, context, callback) {
		cmd.startEmulator(configData, context, function (result) {
			return callback(result);
		});
	},

	installApk: function (configData, context, callback) {
		cmd.installApk(configData, context, function (err, output) {
			if (err) {
				context.out(err); //print the error
			}
			return callback(err, output);
		});
	}

}

//this function takes the list of android devices that are usuable and converts each name, target, abi to an object and returns a list
var parseDeviceList = function (input) {
	var deviceList = [];
	var list = input.split("\n");
	//remove the first line
	list.splice(0,1);

	//check whether the list is empty
	if (list.length == 1) {
		return null;
	}
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
		
		console.log(id);
		console.log(name);
		console.log(type);
		console.log(api);
		console.log(abis);

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