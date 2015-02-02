var exec = require('child_process').exec;

var deviceListCommand = 'chmod 755 ${HOME}/android-sdk-linux/tools/android; ${HOME}/android-sdk-linux/tools/android list avd;';
var targetListCommand = 'chmod 755 ${HOME}/android-sdk-linux/tools/android; ${HOME}/android-sdk-linux/tools/android list targets;';
var createDeviceCommand = 'chmod 755 ${HOME}/android-sdk-linux/tools/android; ${HOME}/android-sdk-linux/tools/android create avd';

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
		//default to "no" for custom hardware profile
		var finalCommand = createDeviceCommand.concat("echo no | " + includeName + includeTarget + includeAbi + includeSkin);
		console.log(finalCommand);
		exec(finalCommand, function (err, stdout, stderr) {
	        return callback();
	    });
	},
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
parseTargetList = function (input) {
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
