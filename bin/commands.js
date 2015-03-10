//all the dirty work goes here
//used for easily creating commands
var child = require('child_process');
var fs = require('fs');

var sdkTools =  {
	"aapt": {
		"toolFull": "build-tools/21.1.2/aapt",
		"tool": "aapt",
		"location": "build-tools/21.1.2"
	},
	"adb": {
		"toolFull": "platform-tools/adb",
		"tool": "adb",
		"location": "platform-tools"
	},
	"android": {
		"toolFull": "tools/android",
		"tool": "android",
		"location": "tools"
	},
	"emulator": {
		"toolFull": "tools/emulator",
		"tool": "emulator",
		"location": "tools"
	}
};

module.exports = {
	getDeviceList: function (sdkLocation, callback) {
		var commandInPath = "android list avd";
		var commandNotInPath = "./android list avd";

		executeAndroid(sdkLocation, sdkTools["android"], commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	getTargetList: function (sdkLocation, callback) {
		var commandInPath = "android list targets";
		var commandNotInPath = "./android list targets";

		executeAndroid(sdkLocation, sdkTools["android"], commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	addDevice: function (data, callback) {
		var name = "\"" + sanitizeString(data.name) + "\"";
		var target = sanitizeString(data.target);
		var abi = sanitizeString(data.abi.replace("default/", ""));
		var sdkLocation = sanitizeString(data.sdkLocation);

		var commandInPath = "echo | android create avd -n " + name + " -t " + target + " -b " + abi;
		var commandNotInPath = "echo | ./android create avd -n " + name + " -t " + target + " -b " + abi;

		executeAndroid(sdkLocation, sdkTools["android"], commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	deleteDevice: function (data, callback) {
		var deviceName = "\"" + sanitizeString(data.name) + "\"";
		var sdkLocation = sanitizeString(data.sdkLocation);

		var commandInPath = "android delete avd -n " + deviceName;
		var commandNotInPath = "./android delete avd -n " + deviceName;

		executeAndroid(sdkLocation, sdkTools["android"], commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	startEmulator: function (config, callback) {
		var deviceName = "\"" + sanitizeString(config.device) + "\"";
		var sdkLocation = sanitizeString(config.sdkLocation);

		var sdkInPath = 	"emulator -avd " + deviceName + " -no-skin -no-audio -no-window -no-boot-anim & adb wait-for-device;"
		var sdkNotInPath = 	"./emulator -avd " + deviceName + " -no-skin -no-audio -no-window -no-boot-anim & adb wait-for-device;"
		
		child.exec("cd ${HOME}/android-sdk-linux/tools; ./emulator -avd  android_emulator -no-skin -no-audio -no-window -no-boot-anim & adb wait-for-device;", function (err, stdout, stderr) {
			console.log("STARTED");
	        return callback(err, stdout);
	    });

		/*
		executeAndroid(sdkLocation, sdkTools["emulator"], sdkInPath, sdkNotInPath, function (err, output) {
			return callback(err, output);
		});
*/

	},

	installApk: function (config, callback) {
		var deviceName = "\"" + sanitizeString(config.device) + "\"";
		var isLibrary = sanitizeBoolean(config.isLibrary);
		var testFolderName = sanitizeString(config.testFolderName);
		var sdkLocation = sanitizeString(config.sdkLocation);
		var ide = sanitizeString(config.ide);

		//set up the absolute locations of the android tools for reference
		var absoluteSdk = process.env.HOME + "/" + sdkLocation + "/";
		var aapt = absoluteSdk + sdkTools["aapt"]["toolFull"];
		var adb = absoluteSdk + sdkTools["adb"]["toolFull"];
		var android = absoluteSdk + sdkTools["android"]["toolFull"];
		var emulator = absoluteSdk + sdkTools["emulator"]["toolFull"];

		process.chdir(process.env.HOME);
		process.chdir(".strider/data/*"); //go to the root project directory

		var eclipseInPath = 	"android update project --subprojects -p .; "
								+ "cd " + testFolderName + "; ant clean debug; cd bin/; "
								+ "find $directory -type f -name \*.apk | xargs adb install";

//TODO: execute the do until command for installing the apk (or something that checks for this) NO MATTER WHICH IDE
		var eclipseNotInPath = 	android + " update project --subprojects -p .; "
								+ "cd " + testFolderName + "; ant clean debug; cd bin/; "
								+ "find $directory -type f -name \*.apk | xargs adb install";

		var androidStudioInPath = 		"chmod +x gradlew; ./gradlew assembleDebug; cd Application/build/outputs/apk/; "
										+ "find $directory -type f -name \*test-unaligned.apk | xargs " + adb + " install"; //install test apk
										+ "find $directory -type f -name \*debug-unaligned.apk | xargs " + adb + " install"; //install project apk


		var androidStudioNotInPath = 	"chmod +x gradlew; "
										+ "echo \"sdk.dir=${HOME}/" + sdkLocation + "\" >> local.properties; "
										+ "./gradlew assembleDebug; cd Application/build/outputs/apk/;";
										+ "find $directory -type f -name \*test-unaligned.apk | xargs " + adb + " install"; //install test apk
										+ "find $directory -type f -name \*debug-unaligned.apk | xargs " + adb + " install"; //install project apk

		if (ide == "Eclipse") {
			executeAny(sdkLocation, eclipseInPath, eclipseNotInPath, function (err, output) {
				return callback(err, output);
			});
		}
		else if (ide == "AndroidStudio") {
			executeAny(sdkLocation, androidStudioInPath, androidStudioNotInPath, function (err, output) {
				return callback(err, output);
			});
		}
		else {
			return callback("No IDE or invalid IDE specified", null);
		}


		//var finalCommand = "cd ${HOME}/.strider/data/*/" + testFolderName + "/bin; find $directory -type f -name \*.apk | xargs adb install";

		//search for an apk
/*		child.exec(finalCommand, function (err, stdout, stderr) {

			console.log("Output: " + stdout);
			if (stdout == "") { //no apk found
				return callback("No APK file found", null);
			}
			else if (stdout == "Error: Could not access the Package Manager.  Is the system running?") {
				//emulator not ready to install the apk. try again
				console.log("Redo");
				this.installApk(function (err, output) {
					return callback(err, output);
				});
			} 
			else {
				return callback(err, stdout);
			}
	        
	    });
*/
	},

	runTests: function (config, callback) {
		//the sauce for the aapt solution: http://stackoverflow.com/questions/4567904/how-to-start-an-application-using-android-adb-tools?rq=1
		var runTestsScript = 
		"pkg=$(" + aapt + " dump badging $1|awk -F\" \" '/package/ {print $2}'|awk -F\"'\" '/name=/ {print $2}');" +
		adb + " shell am instrument -w $pkg/android.test.InstrumentationTestRunner";
	}
}

//this function will NOT check for malicious sdkLocation commands. please sanitize beforehand and use the sdkTools obj for toolObj
//will return back to the original directory upon completion
var executeAndroid = function (sdkLocation, toolObj, commandInPath, commandNotInPath, callback) {
	//var initialDir = process.cwd();
	var location = sdkLocation;
	if (!location) { //assume android tool is in the path if no location is specified
		child.exec(commandInPath, function (err, stdout, stderr) {
			//process.chdir(initialDir);
	        return callback("Cannot retrieve data. Chances are your android tool is not in the PATH.", stdout);
	    });
	}
	else {
		//go to the directory of the SDK
		var error = goToAndroid(location, toolObj);
		if (error != null) {
			//process.chdir(initialDir);
			return callback(error, null);
		}

		child.exec(commandNotInPath, function (err, stdout, stderr) {
			//process.chdir(initialDir);
	        return callback(err, stdout);
	    });
	}
}

//this function will NOT check for malicious sdkLocation commands. please sanitize beforehand and use the sdkTools obj for toolObj
//unlike the function above, use this to execute any piece of code
var executeAny = function (sdkLocation, toolObj, commandInPath, commandNotInPath, callback) {
	var location = sdkLocation;
	if (!location) { //assume android tool is in the path if no location is specified
		child.exec(commandInPath, function (err, stdout, stderr) {
	        return callback("Cannot retrieve data. Chances are your android tool is not in the PATH.", stdout);
	    });
	}
	else {
		child.exec(commandNotInPath, function (err, stdout, stderr) {
	        return callback(err, stdout);
	    });
	}
}

//goes to the tools folder of the SDK given a location. also gives permission to execute the android tool
//returns null if successful. returns a string error if not
var goToAndroid = function (location, toolObj) {
	process.chdir(process.env.HOME);

	try {
	  	process.chdir(location);
	  	process.chdir(toolObj["location"]); //go to the tool location
	}
	catch (err) {
		return "The SDK directory specified does not exist";
	}
	//allow execution of the requested tool
	fs.chmodSync(toolObj["tool"], '755');

	return null;
}

var sanitizeString = function (string) {
	return string.match(/[a-zA-Z\d\.\_\-*]/g).join("");
}

//return false if it is anything but "true" or true
var sanitizeBoolean = function (bool) {
	return ("" + bool == "true");
}


//unfinished. theres multiple apks
//var startEmulatorStudio = 	'chmod +x gradlew; ./gradlew assembleDebug; cd Application/build/outputs/apk/'; 
//use ./gradlew --refresh-dependencies?

//./android update sdk --no-ui to fix dependency issues
//find a way to show errors/process of build in the strider test page!
//		./android list sdk --all lists all the things
//	   	./android update sdk --all --no-ui --filter 4 gets the fourth thing only in that list
//use -r for adb install or ".apk" to reinstall the app
/*
equivalent of below:

//adb push Application-debug.apk /data/local/tmp/com.example.android.activityinstrumentation
//adb shell
//pm install /data/local/tmp/com.example.android.activityinstrumentation
//adb push Application-debug-test-unaligned.apk /data/local/tmp/com.example.android.activityinstrumentation.test
//adb shell
//pm install /data/local/tmp/com.example.android.activityinstrumentation.test

THIS WORKED SOMEHOW
adb install -r Application-debug-test-unaligned.apk
adb install -r Application-debug-unaligned.apk
adb shell am instrument -w com.example.android.activityinstrumentation.test/android.test.InstrumentationTestRunner

//adb shell am instrument -w com.example.android.activityinstrumentation.test/android.test.InstrumentationTestRunner
//almost worked ^ got a permission error though
//maybe try this:
//This problem can be solved by uninstalling the apk file and the test application from the emulator. And then resign the application with re-sign.jar and then install the apk and then run the test app.
//from http://stackoverflow.com/questions/3082780/java-lang-securityexception-permission-denial ^

//if you get a Failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE]: for the test, uninstall and reinstall the packages (pm in adb shell, and adb otherwise)
//adb shell wipe data (probably not a good idea) or just uninstall/reinstall the packages from before (or delete all in tmp directory?)

//do we REALLY need this?
//jarsigner -verbose -keystore ~/.android/debug.keystore -storepass android -keypass android PATH/TO/YOUR_UNSIGNED_PROJECT.apk androiddebugkey

Uploading file
	local path: /Users/chrisrokita/AndroidStudioProjects/ActivityInstrumentation/Application/build/outputs/apk/Application-debug.apk
	remote path: /data/local/tmp/com.example.android.activityinstrumentation
Installing com.example.android.activityinstrumentation
DEVICE SHELL COMMAND: pm install -r "/data/local/tmp/com.example.android.activityinstrumentation"
pkg: /data/local/tmp/com.example.android.activityinstrumentation
Success


Uploading file
	local path: /Users/chrisrokita/AndroidStudioProjects/ActivityInstrumentation/Application/build/outputs/apk/Application-debug-test-unaligned.apk
	remote path: /data/local/tmp/com.example.android.activityinstrumentation.test
Installing com.example.android.activityinstrumentation.test
DEVICE SHELL COMMAND: pm install -r "/data/local/tmp/com.example.android.activityinstrumentation.test"
pkg: /data/local/tmp/com.example.android.activityinstrumentation.test
Success


Running tests
Test running started
junit.framework.AssertionFailedError: expected:<5> but was:<2>
at com.example.android.activityinstrumentation.SampleTests.testSpinnerValuePersistedBetweenLaunches(SampleTests.java:120)
at java.lang.reflect.Method.invokeNative(Native Method)
at android.test.InstrumentationTestCase.runMethod(InstrumentationTestCase.java:214)
at android.test.InstrumentationTestCase.runTest(InstrumentationTestCase.java:199)
at android.test.ActivityInstrumentationTestCase2.runTest(ActivityInstrumentationTestCase2.java:192)
at android.test.AndroidTestRunner.runTest(AndroidTestRunner.java:169)
at android.test.AndroidTestRunner.runTest(AndroidTestRunner.java:154)
at android.test.InstrumentationTestRunner.onStart(InstrumentationTestRunner.java:545)
at android.app.Instrumentation$InstrumentationThread.run(Instrumentation.java:1551)

Finish


use http://stackoverflow.com/questions/4567904/how-to-start-an-application-using-android-adb-tools?rq=1 to get the package + activity
*/
// ONLY USE -data-wipe OPTION IF YOUR LOCAL FOLDER HAS AN I/O ERROR
//Error: Could not access the Package Manager.  Is the system running?  <-- ping the install command until this goes away 
//if the apk isnt there in the first place bad things will happen. what do?

/*
+ "output=\"Error: Could not access the Package Manager.  Is the system running?\" \n"
+ "until [[ \"$output\" != \"Error: Could not access the Package Manager.  Is the system running?\" ]] \n"
+ "do \n"
+ "output=$(find $directory -type f -name \*.apk | xargs adb install) \n"
+ "done";
*/							


//pm uninstall com.example.android.activityinstrumentation
//./gradlew assembleDebugTest
//./gradlew installDebugTest

//NOTE: YOU NEED BOTH THE DEBUG AND THE DEBUG-TEST APK TO RUN UNIT TESTS
//not enough RAM. lower the memory size of the emulator to fix this (find hidden .android/avd/emulator.avd/config.ini file)
//you need to use AAPT android tool in order to get the apk information on what package to find for testing
//I recommend just putting these in a separate script and then calling those scripts. this is getting ridiculous

//the sauce for the aapt solution: http://stackoverflow.com/questions/4567904/how-to-start-an-application-using-android-adb-tools?rq=1

//get path vars:
//process.env.PATH

//you can update test-project and lib-project
//https://developer.android.com/tools/help/android.html