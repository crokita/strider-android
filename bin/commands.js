//all the dirty work goes here
//used for easily creating commands
var child = require('child_process');
var fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
var async = require('async');


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

	startEmulator: function (config, context, callback) {
		//var deviceName = "\"" + sanitizeString(config.device) + "\"";
		var deviceName = sanitizeString(config.device);
		var sdkLocation = sanitizeString(config.sdkLocation);

		var absoluteSdk = process.env.HOME + "/" + sdkLocation + "/";
		var adb = absoluteSdk + sdkTools["adb"]["toolFull"];
		var emulator = absoluteSdk + sdkTools["emulator"]["toolFull"];

		var emulatorCommand = child.spawn(emulator, ["-avd", deviceName, "-no-skin", "-no-audio", "-no-window", "-no-boot-anim"]);
		//workers.push(emulatorCommand);
		var adbCommand = child.spawn(adb, ["wait-for-device"]);
		//workers.push(adbCommand);

		emulatorCommand.stdout.on('data', function (data) {
			context.out(data);
		});

		emulatorCommand.stderr.on('data', function (data) {
			context.out(data);
		});

		adbCommand.stdout.on('data', function (data) {
			context.out(data);
		});

		adbCommand.stderr.on('data', function (data) {
			context.out(data);
		});
		
		adbCommand.on('close', function (code) { //emulator booted
			return callback(code);
		});
	},

	installApk: function (config, context, callback) {
		var ide = sanitizeString(config.ide);

		if (ide == "Eclipse") {
			installEclipseApk(config, context, function (err, output) {
				return callback(err, output);
			});
		}
		else if (ide == "AndroidStudio") {
			installAndroidStudioApk(config, context, function (err, output) {
				return callback(err, output);
			});
		}
		else {
			return callback("No IDE or invalid IDE specified", null);
		}
/*


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
			
		}
		else if (ide == "AndroidStudio") {
			
		}
		else {
			return callback("No IDE or invalid IDE specified", null);
		}
*/



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
// //will return back to the original directory upon completion
var executeAndroid = function (sdkLocation, toolObj, commandInPath, commandNotInPath, callback) {
	//var initialDir = process.cwd();
	var location = sdkLocation;
	if (!location) { //assume android tool is in the path if no location is specified
		var commandExec = child.exec(commandInPath, function (err, stdout, stderr) {
			//process.chdir(initialDir);
	        return callback("Cannot retrieve data. Chances are your android tool is not in the PATH.", stdout);
	    });
	    workers.push(commandExec);
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

function installEclipseApk (config, context, callback) {
	var deviceName = "\"" + sanitizeString(config.device) + "\"";
	var isLibrary = sanitizeBoolean(config.isLibrary);
	var testFolderName = sanitizeString(config.testFolderName);
	var sdkLocation = sanitizeString(config.sdkLocation);
	var ide = sanitizeString(config.ide);

	var absoluteSdk;
	var aapt;
	var adb;
	var android;
	var emulator;

	if (!sdkLocation) { //assume tools is in the path if no location is specified
		aapt = "aapt";
		adb = "adb";
		android = "android";
		emulator = "emulator";
	}
	else {
		//set up the absolute locations of the android tools for reference
		absoluteSdk = process.env.HOME + "/" + sdkLocation + "/";
		aapt = absoluteSdk + sdkTools["aapt"]["toolFull"];
		adb = absoluteSdk + sdkTools["adb"]["toolFull"];
		android = absoluteSdk + sdkTools["android"]["toolFull"];
		emulator = absoluteSdk + sdkTools["emulator"]["toolFull"];
	}

	process.chdir(process.env.HOME);
	process.chdir(".strider"); //go to the root project directory
	process.chdir("data"); 
	process.chdir(fs.readdirSync(".")[0]); //attempt to go into the first thing found in the directory (yes this is dumb)

	var updateProjectCommand = child.spawn(android, ["update", "project", "--subprojects", "-p", "."]);
	updateProjectCommand.stdout.on('data', function (data) {
		context.out(data);
	});
	updateProjectCommand.stderr.on('data', function (data) {
		context.out(data);
	});
	updateProjectCommand.on('close', function (code) { //emulator booted
		process.chdir(testFolderName);
		var antCleanCommand = child.spawn("ant", ["clean", "debug"]);
		antCleanCommand.stdout.on('data', function (data) {
			context.out(data);
		});
		antCleanCommand.stderr.on('data', function (data) {
			context.out(data);
		});
		antCleanCommand.on('close', function (code) { //emulator booted
			process.chdir("bin");
			child.exec("find $directory -type f -name \*.apk", function (err, stdout, stderr) {
				var installCommand = child.spawn(adb, ["install", stdout]);

				installCommand.stdout.on('data', function (data) {
					context.out(data);
				});
				installCommand.stderr.on('data', function (data) {
					context.out(data);
				});
				installCommand.on('close', function (code) { //emulator booted
					return callback(null, code);
				});
			});
		});
	});
}

function installAndroidStudioApk (config, context, callback) {
	var deviceName = "\"" + sanitizeString(config.device) + "\"";
	var isLibrary = sanitizeBoolean(config.isLibrary);
	var testFolderName = sanitizeString(config.testFolderName);
	var sdkLocation = sanitizeString(config.sdkLocation);
	var ide = sanitizeString(config.ide);

	var absoluteSdk;
	var aapt;
	var adb;
	var android;
	var emulator;

	if (!sdkLocation) { //assume tools is in the path if no location is specified
		aapt = "aapt";
		adb = "adb";
		android = "android";
		emulator = "emulator";
	}
	else {
		//set up the absolute locations of the android tools for reference
		absoluteSdk = process.env.HOME + "/" + sdkLocation + "/";
		aapt = absoluteSdk + sdkTools["aapt"]["toolFull"];
		adb = absoluteSdk + sdkTools["adb"]["toolFull"];
		android = absoluteSdk + sdkTools["android"]["toolFull"];
		emulator = absoluteSdk + sdkTools["emulator"]["toolFull"];
	}

	process.chdir(process.env.HOME);
	process.chdir(".strider"); //go to the root project directory
	process.chdir("data"); 
	process.chdir(fs.readdirSync(".")[0]); //attempt to go into the first thing found in the directory (yes this is dumb)

	fs.chmod("gradlew", 755, function () {
		if (sdkLocation) {
			child.exec("echo \"sdk.dir=${HOME}/" + sdkLocation + "\" >> local.properties; ", function (err, stdout, stderr) {
				installAndroidStudioApk2(config, context, function (err, output) {
					return callback(err, output);
				});
			});
		}
		else {
			installAndroidStudioApk2(config, context, function (err, output) {
				return callback(err, output);
			});
		}
	});
}

function installAndroidStudioApk2 (config, context, callback) {
	var deviceName = "\"" + sanitizeString(config.device) + "\"";
	var isLibrary = sanitizeBoolean(config.isLibrary);
	var testFolderName = sanitizeString(config.testFolderName);
	var sdkLocation = sanitizeString(config.sdkLocation);
	var ide = sanitizeString(config.ide);

	var absoluteSdk;
	var aapt;
	var adb;
	var android;
	var emulator;

	if (!sdkLocation) { //assume tools is in the path if no location is specified
		aapt = "aapt";
		adb = "adb";
		android = "android";
		emulator = "emulator";
	}
	else {
		//set up the absolute locations of the android tools for reference
		absoluteSdk = process.env.HOME + "/" + sdkLocation + "/";
		aapt = absoluteSdk + sdkTools["aapt"]["toolFull"];
		adb = absoluteSdk + sdkTools["adb"]["toolFull"];
		android = absoluteSdk + sdkTools["android"]["toolFull"];
		emulator = absoluteSdk + sdkTools["emulator"]["toolFull"];
	}

	var path = {
		aapt: aapt,
		adb: adb,
		android: android,
		emulator: emulator,
	}

	var decoder = new StringDecoder('utf8'); //helps convert the buffer byte data into something human-readable
/*
	var tasks = [];
	tasks.push(studioTasksFirst(context, decoder, path));
	tasks.push(studioTasksSecond(context, decoder, path));
	tasks.push(studioTasksThird(context, decoder, path));
	tasks.push(studioTasksFourth(context, decoder, path));
	tasks.push(studioTasksFifth(context, decoder, path));
	tasks.push(studioTasksSixth(context, decoder, path));

	async.waterfall(tasks, function (err, result) {
		callback(err, result);
	});*/

	async.waterfall([
		function (next) {
			//create the APKs
			var assembleCommand = child.spawn("./gradlew", ["assembleDebug"]);

			assembleCommand.stdout.on('data', function (data) {
				context.out(decoder.write(data));
			});
			assembleCommand.stderr.on('data', function (data) {
				context.out(decoder.write(data));
			});
			assembleCommand.on('close', function (code) {
				next(null);
			});
		},
		function (next) {
			//find the debug apk
			process.chdir("Application"); 
			process.chdir("build"); 
			process.chdir("outputs"); 
			process.chdir("apk"); 
			child.exec("find $directory -type f -name \*debug-unaligned.apk", function (err, stdout, stderr) {
				stdout = stdout.slice(2); //remove the "./" characters at the beginning
				stdout = sanitizeString(stdout.replace(/\n/g, "")); //make sure theres no newline characters. then sanitize
				next(null, stdout); //return the name of the debug apk
			});
		},
		function (debugApkName, next) {
			//install the debug apk and find the debug test apk
			child.exec(adb + " install -r " + debugApkName, function (err, stdout, stderr) {
				child.exec("find $directory -type f -name \*test-unaligned.apk", function (err, stdout, stderr) {
					stdout = stdout.slice(2); //remove the "./" characters at the beginning
					stdout = sanitizeString(stdout.replace(/\n/g, "")); //make sure theres no newline characters. then sanitize
					next(null, debugApkName, stdout); //return the name of the debug test apk
				});
			});
		},
		function (debugApkName, debugTestApkName, next) {
			//install the debug test apk and get the test package name
			child.exec(adb + " install -r " + debugTestApkName, function (err, stdout, stderr) {
				//source for the aapt solution (dljava):
				//http://stackoverflow.com/questions/4567904/how-to-start-an-application-using-android-adb-tools?rq=1
				var getPackageCmd = aapt + " dump badging " + debugTestApkName + "|awk -F\" \" \'/package/ {print $2}\'|awk -F\"\'\" \'/name=/ {print $2}\'";

				child.exec(getPackageCmd, function (err, stdout, stderr) {	
					stdout = stdout.replace(/\n/g, ""); //make sure theres no newline characters
					next(null, debugApkName, debugTestApkName, stdout); //return the package name
				});
			});
		},
		function (debugApkName, debugTestApkName, packageName, next) {
			//now re-sign the apk files so the security error doesn't pop up
			resignApk(debugApkName, context, function () {
				resignApk(debugTestApkName, context, function () {
					next(null, debugApkName, debugTestApkName, packageName);
				});
			});
		},
		function (debugApkName, debugTestApkName, packageName, next) {
			//run the tests!
			var activityName = "android.test.InstrumentationTestRunner"; //use this when running test apps
			var runTestsCmd = child.spawn(adb, ["shell", "am", "instrument", "-w", packageName+"/"+activityName]);
			runTestsCmd.stdout.on('data', function (data) {
				context.out(decoder.write(data));
			});
			runTestsCmd.stderr.on('data', function (data) {
				context.out(decoder.write(data));
			});
			runTestsCmd.on('close', function (code) { //emulator booted
				return next(null, code);
			});
		}
	], function (err, result) {
		callback(err, result);
	});

}
/*
//the following methods are used exlusively for async.waterfall tasks
var studioTasksFirst = function(context, decoder, path) {
	return function(next) {
		//create the APKs
		var assembleCommand = child.spawn("./gradlew", ["assembleDebug"]);

		assembleCommand.stdout.on('data', function (data) {
			context.out(decoder.write(data));
		});
		assembleCommand.stderr.on('data', function (data) {
			context.out(decoder.write(data));
		});
		assembleCommand.on('close', function (code) {
			next(null);
		});
	};
}

var studioTasksSecond = function(context, decoder, path) {
	return function(next) {
		//find the debug apk
		process.chdir("Application"); 
		process.chdir("build"); 
		process.chdir("outputs"); 
		process.chdir("apk"); 
		child.exec("find $directory -type f -name \*debug-unaligned.apk", function (err, stdout, stderr) {
			stdout = stdout.slice(2); //remove the "./" characters at the beginning
			stdout = sanitizeString(stdout.replace(/\n/g, "")); //make sure theres no newline characters. then sanitize
			next(null, stdout); //return the name of the debug apk
		});
	};
}

var studioTasksThird = function(context, decoder, path) {
	return function(debugApkName, next) {
		//install the debug apk and find the debug test apk
		child.exec(path.adb + " install -r " + debugApkName, function (err, stdout, stderr) {
			child.exec("find $directory -type f -name \*test-unaligned.apk", function (err, stdout, stderr) {
				stdout = stdout.slice(2); //remove the "./" characters at the beginning
				stdout = sanitizeString(stdout.replace(/\n/g, "")); //make sure theres no newline characters. then sanitize
				next(null, debugApkName, stdout); //return the name of the debug test apk
			});
		});
	};
}

var studioTasksFourth = function(context, decoder, path) {
	return function(debugApkName, debugTestApkName, next) {
		//install the debug test apk and get the test package name
		child.exec(path.adb + " install -r " + debugTestApkName, function (err, stdout, stderr) {
			//source for the aapt solution (dljava):
			//http://stackoverflow.com/questions/4567904/how-to-start-an-application-using-android-adb-tools?rq=1
			var getPackageCmd = path.aapt + " dump badging " + debugTestApkName + "|awk -F\" \" \'/package/ {print $2}\'|awk -F\"\'\" \'/name=/ {print $2}\'";

			child.exec(getPackageCmd, function (err, stdout, stderr) {	
				stdout = stdout.replace(/\n/g, ""); //make sure theres no newline characters
				next(null, debugApkName, debugTestApkName, stdout); //return the package name
			});
		});
	};
}

var studioTasksFifth = function(context, decoder, path) {
	return function(debugApkName, debugTestApkName, packageName, next) {
		//now re-sign the apk files so the security error doesn't pop up
		resignApk(debugApkName, context, function () {
			resignApk(debugTestApkName, context, function () {
				next(null, debugApkName, debugTestApkName, packageName);
			});
		});
	};
}

var studioTasksSixth = function(context, decoder, path) {
	return function(debugApkName, debugTestApkName, packageName, next) {
		//run the tests!
		var activityName = "android.test.InstrumentationTestRunner"; //use this when running test apps
		var runTestsCmd = child.spawn(path.adb, ["shell", "am", "instrument", "-w", packageName+"/"+activityName]);
		runTestsCmd.stdout.on('data', function (data) {
			context.out(decoder.write(data));
		});
		runTestsCmd.stderr.on('data', function (data) {
			context.out(decoder.write(data));
		});
		runTestsCmd.on('close', function (code) { //emulator booted
			return next(null, code);
		});
	};
}
*/
//this method is not part of the async.waterfall tasks. pass in any apk to have it automatically resigned
var resignApk = function (apkName, context, callback) {
	context.out("Apk Name: " + apkName);
	//assumes you are in the same directory as the apks. ASSUMES THE INPUT IS SANITIZED
	var resignCommand = "mkdir unzip-output; cd unzip-output; jar xf ../" + apkName + "; "
						+ "rm -r META-INF; ls | xargs jar -cvf " + apkName + "; "
						+ "jarsigner -digestalg SHA1 -sigalg MD5withRSA -keystore ${HOME}/.android/debug.keystore -storepass android -keypass android " + apkName + " androiddebugkey; "
						+ "rm ../" + apkName + "; mv " + apkName + " ../" + apkName + "; cd ../ rm -r unzip-output";
	child.exec(resignCommand, function (err, stdout, stderr) {
		context.out(stdout);
		callback();
	});

}

var sanitizeString = function (string) {
	return string.match(/[a-zA-Z\d\.\_\-*]/g).join("");
}

//return false if it is anything but "true" or true
var sanitizeBoolean = function (bool) {
	return ("" + bool == "true");
}

//TODO: should it uninstall the apks from the device on completion?

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
//http://stackoverflow.com/questions/11411223/android-apk-resign-jar-is-getting-hanged

//$HOME/.android/debug.keystore

//if you get a Failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE]: for the test, uninstall and reinstall the packages (pm in adb shell, and adb otherwise)
//adb shell wipe data (probably not a good idea) or just uninstall/reinstall the packages from before (or delete all in tmp directory?)

//do we REALLY need this?
//jarsigner -verbose -keystore ~/.android/debug.keystore -storepass android -keypass android PATH/TO/YOUR_UNSIGNED_PROJECT.apk androiddebugkey


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


//get path vars:
//process.env.PATH

//you can update test-project and lib-project
//https://developer.android.com/tools/help/android.html

/*
figure out how to get result data on the page:

<div class="console-output">
              <i class="fa fa-gear fa-light fa-spin loading-icon ng-hide" ng-show="loading"></i>
              <!-- ngRepeat: phase in phases --><div ng-repeat="phase in phases" class="phase phase-environment ng-hide" ng-class="{ collapsed: job.phases[phase].collapsed }" ng-show="job.phases[phase].commands.length">
  <div class="title" ng-click="job.phases[phase].collapsed = !job.phases[phase].collapsed">
    <i class="fa fa-caret-down arrow"></i>
    <span class="name ng-binding">environment</span>
    <span class="pull-right meta">
      <time class="duration" datetime="" since="" duration="" data-original-title="" title=""></time>
      <span class="exit-status ng-binding" ng-show="job.phases[phase].exitCode">-1</span>
    </span>
  </div>
  <div class="commands" ng-hide="job.phases[phase].collapsed">
    <!-- ngRepeat: command in job.phases[phase].commands -->
  </div>
</div><!-- end ngRepeat: phase in phases --><div ng-repeat="phase in phases" class="phase phase-prepare ng-hide" ng-class="{ collapsed: job.phases[phase].collapsed }" ng-show="job.phases[phase].commands.length">
  <div class="title" ng-click="job.phases[phase].collapsed = !job.phases[phase].collapsed">
    <i class="fa fa-caret-down arrow"></i>
    <span class="name ng-binding">prepare</span>
    <span class="pull-right meta">
      <time class="duration" datetime="" since="" duration="" data-original-title="" title=""></time>
      <span class="exit-status ng-binding" ng-show="job.phases[phase].exitCode">-1</span>
    </span>
  </div>
  <div class="commands" ng-hide="job.phases[phase].collapsed">
    <!-- ngRepeat: command in job.phases[phase].commands -->
  </div>
</div><!-- end ngRepeat: phase in phases --><div ng-repeat="phase in phases" class="phase phase-test ng-hide" ng-class="{ collapsed: job.phases[phase].collapsed }" ng-show="job.phases[phase].commands.length">
  <div class="title" ng-click="job.phases[phase].collapsed = !job.phases[phase].collapsed">
    <i class="fa fa-caret-down arrow"></i>
    <span class="name ng-binding">test</span>
    <span class="pull-right meta">
      <time class="duration" datetime="" since="" duration="" data-original-title="" title=""></time>
      <span class="exit-status ng-binding" ng-show="job.phases[phase].exitCode">-1</span>
    </span>
  </div>
  <div class="commands" ng-hide="job.phases[phase].collapsed">
    <!-- ngRepeat: command in job.phases[phase].commands -->
  </div>
</div><!-- end ngRepeat: phase in phases --><div ng-repeat="phase in phases" class="phase phase-deploy ng-hide" ng-class="{ collapsed: job.phases[phase].collapsed }" ng-show="job.phases[phase].commands.length">
  <div class="title" ng-click="job.phases[phase].collapsed = !job.phases[phase].collapsed">
    <i class="fa fa-caret-down arrow"></i>
    <span class="name ng-binding">deploy</span>
    <span class="pull-right meta">
      <time class="duration" datetime="" since="" duration="" data-original-title="" title=""></time>
      <span class="exit-status ng-binding" ng-show="job.phases[phase].exitCode">-1</span>
    </span>
  </div>
  <div class="commands" ng-hide="job.phases[phase].collapsed">
    <!-- ngRepeat: command in job.phases[phase].commands -->
  </div>
</div><!-- end ngRepeat: phase in phases --><div ng-repeat="phase in phases" class="phase phase-cleanup ng-hide" ng-class="{ collapsed: job.phases[phase].collapsed }" ng-show="job.phases[phase].commands.length">
  <div class="title" ng-click="job.phases[phase].collapsed = !job.phases[phase].collapsed">
    <i class="fa fa-caret-down arrow"></i>
    <span class="name ng-binding">cleanup</span>
    <span class="pull-right meta">
      <time class="duration" datetime="" since="" duration="" data-original-title="" title=""></time>
      <span class="exit-status ng-binding" ng-show="job.phases[phase].exitCode">-1</span>
    </span>
  </div>
  <div class="commands" ng-hide="job.phases[phase].collapsed">
    <!-- ngRepeat: command in job.phases[phase].commands -->
  </div>
</div><!-- end ngRepeat: phase in phases -->
            </div>



*/
