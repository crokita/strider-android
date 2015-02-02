var exec = require('child_process').exec;

var deviceListCommand = 'chmod 755 ${HOME}/android-sdk-linux/tools/android; ${HOME}/android-sdk-linux/tools/android list avd;';
var targetListCommand = 'chmod 755 ${HOME}/android-sdk-linux/tools/android; ${HOME}/android-sdk-linux/tools/android list targets;';

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
	var targetList = [];
	var list = input.split("\n");
	//remove the first line
	list.splice(0,1);

	

	return deviceList;
}