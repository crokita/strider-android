var exec = require('child_process').exec;

var deviceListCommand = 'chmod 755 ${HOME}/android-sdk-linux/tools/android; ${HOME}/android-sdk-linux/tools/android list avd;';

module.exports = {
	getDeviceList: function () {
		exec('chmod 755 ${HOME}/android-sdk-linux/tools/android; ${HOME}/android-sdk-linux/tools/android list avd;', function (err, stdout, stderr) {
	        return stdout;
	    });
	}
}

var parseDeviceList = function (input) {
	return input;
}