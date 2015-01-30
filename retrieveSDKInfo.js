var exec = require('child_process').exec;

var deviceListCommand = 'chmod 755 ${HOME}/android-sdk-linux/tools/android; ${HOME}/android-sdk-linux/tools/android list avd;';

module.exports = {
	getDeviceList: function () {
		exec(deviceListCommand, function (err, stdout, stderr) {
	        return parseDeviceList(input);
	    });
	}
}

var parseDeviceList = function (input) {
	return input;
}