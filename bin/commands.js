var child = require('child_process');
var fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
var async = require('async');
var manager = require('./deviceManager');

//var workers = []; //emulators go here so they can be killed when necessary

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

//a list of all possible emulators running as a process
var emulators = [
	"emulator64-arm",
	"emulator64-mips",
	"emulator64-x86",
	"emulator-arm",
	"emulator-mips",
	"emulator-x86"
];

var sanitizeSDK = function (string) {
	if (!string) {
		return "";
	}
	var matches = string.match(/[a-zA-Z\d\.\_\-\/*]/g);
	return matches.join("");
}

module.exports = {
	sdkTools: sdkTools,
	sanitizeSDK: sanitizeSDK,
	
	getDeviceList: function (sdkLocation, callback) {
		//http://developer.android.com/tools/help/adb.html#devicestatus
		var commandInPath = "android list avd";
		var commandNotInPath = "./android list avd";
		var sdkLocation = sanitizeSDK(sdkLocation);

		//first get all the emulators
		executeAndroid(sdkLocation, sdkTools["android"], commandInPath, commandNotInPath, function (err, emulators) {
			//now get all the physical devices
			var commandInPath2 = "adb devices";
			var commandNotInPath2 = "./adb devices";
			executeAndroid(sdkLocation, sdkTools["adb"], commandInPath2, commandNotInPath2, function (err, physicals) {
				callback(err, emulators, physicals);
			});

		});

	},

	getTargetList: function (sdkLocation, callback) {
		var commandInPath = "android list targets";
		var commandNotInPath = "./android list targets";
		var sdkLocation = sanitizeSDK(sdkLocation);

		executeAndroid(sdkLocation, sdkTools["android"], commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	addDevice: function (data, callback) {
		var name = "\"" + sanitizeName(data.name) + "\"";
		var target = sanitizeName(data.target);
		var abi = sanitizeName(data.abi.replace("default/", ""));
		var sdkLocation = sanitizeSDK(data.sdkLocation);

		var commandInPath = "echo | android create avd -n " + name + " -t " + target + " -b " + abi;
		var commandNotInPath = "echo | ./android create avd -n " + name + " -t " + target + " -b " + abi;

		executeAndroid(sdkLocation, sdkTools["android"], commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	deleteDevice: function (data, callback) {
		var deviceName = "\"" + sanitizeName(data.name) + "\"";
		var sdkLocation = sanitizeSDK(data.sdkLocation);

		var commandInPath = "android delete avd -n " + deviceName;
		var commandNotInPath = "./android delete avd -n " + deviceName;

		executeAndroid(sdkLocation, sdkTools["android"], commandInPath, commandNotInPath, function (err, output) {
			callback(err, output);
		});
	},

	stopEmulator: function (data, callback) {
		var decoder = new StringDecoder('utf8'); //helps convert the buffer byte data into something human-readable
		var deviceName = sanitizeName(data.name);
		var sdkLocation = sanitizeSDK(data.sdkLocation);

		var absoluteSdk = sdkLocation + "/";
		var adb = absoluteSdk + sdkTools["adb"]["toolFull"];

		if (sdkLocation == "") { //assume android tool is in the path if no location is specified
			adb = "adb";
		}

		manager.stopEmulator(adb, deviceName, decoder, function (err, output) {
			callback(err, output);
		});
	},

	startEmulator: function (config, context, callback) {
		var deviceName = sanitizeName(config.device);
		var sdkLocation = sanitizeSDK(config.sdkLocation);

		var absoluteSdk = sdkLocation + "/";
		var adb = absoluteSdk + sdkTools["adb"]["toolFull"];
		var emulator = absoluteSdk + sdkTools["emulator"]["toolFull"];

		if (sdkLocation == "") { //assume android tool is in the path if no location is specified
			adb = "adb";
			emulator = "emulator";
		}

		manager.startEmulator(adb, emulator, deviceName, context, function (result) {
			context.out(result);
			return callback();
		});

	},

	//this function installs the project and test apks and runs the tests
	installApk: function (config, context, callback) {
		//var deviceName = "\"" + sanitizeSDK(config.device) + "\"";
		//var isLibrary = sanitizeBoolean(config.isLibrary);
		var testFolderName = sanitizeName(config.testFolderName);
		var projectFolderName = sanitizeName(config.projectFolderName);
		var sdkLocation = sanitizeSDK(config.sdkLocation);
		var ide = sanitizeName(config.ide);
		var javadocs = sanitizeBoolean(config.javadocs);
		var device = sanitizeName(config.device);
		var javadocDirectory = sanitizeSDK(config.javadocDirectory);

		if (javadocDirectory == "") {//if nothing was specified, make it the root project directory
			javadocDirectory = ".";
		}

		var absoluteSdk = sdkLocation + "/";

		var path = {}; //pass this object to installation functions to help with using android tools or user-specified locations
		path.sdkLocation = sdkLocation;
		path.projectFolderName = projectFolderName;
		path.testFolderName = testFolderName;
		path.javadocs = javadocs;
		path.device = device;
		path.javadocDirectory = javadocDirectory;

		if (sdkLocation == "") { //assume tools is in the path if no location is specified
			path.aapt = "aapt";
			path.adb = "adb";
			path.android = "android";
			path.emulator = "emulator";
		}
		else {
			path.aapt = absoluteSdk + sdkTools["aapt"]["toolFull"];
			path.adb = absoluteSdk + sdkTools["adb"]["toolFull"];
			path.android = absoluteSdk + sdkTools["android"]["toolFull"];
			path.emulator = absoluteSdk + sdkTools["emulator"]["toolFull"];
		}

		if (ide == "Eclipse") {
			installEclipseApk(path, context, function (err, output) {
				return callback(err, output);
			});
		}
		else if (ide == "AndroidStudio") {
			installAndroidStudioApk(path, context, function (err, output) {
				return callback(err, output);
			});
		}
		else {
			return callback("No IDE or invalid IDE specified", null);
		}

	}

}

//this function will NOT check for malicious sdkLocation commands. please sanitize beforehand and use the sdkTools obj for toolObj
var executeAndroid = function (sdkLocation, toolObj, commandInPath, commandNotInPath, callback) {
	//var initialDir = process.cwd();
	var location = sdkLocation;
	if (location == "") { //assume android tool is in the path if no location is specified
		var commandExec = child.exec(commandInPath, function (err, stdout, stderr) {
			//process.chdir(initialDir);
			if (!err) {
				return callback(null, stdout);
			}
			else {
				return callback("Cannot retrieve data. Chances are your android tool is not in the PATH.", stdout);
			}
	        
	    });
	    //workers.push(commandExec);
	}
	else {
		//go to the directory of the SDK tool
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
	try {
	  	process.chdir(location);
	  	process.chdir(toolObj["location"]); //go to the tool location
	}
	catch (err) {
		return "The SDK directory specified does not exist";
	}
	//allow execution of the requested tool
	fs.chmodSync(toolObj["tool"], '555'); //give read and execute permissions

	return null;
}

function installEclipseApk (path, context, callback) {
	var decoder = new StringDecoder('utf8'); //helps convert the buffer byte data into something human-readable
	var tasks = [];
	if (path.projectFolderName == '') { //automatically try to find the main project if none is specified
		tasks.push(eclipseTasksFindProjectName(context, decoder, path));
	}
	if (path.testFolderName == '') { //automatically try to find the test project if none is specified
		tasks.push(eclipseTasksFindTestName(context, decoder, path));
	}
	if (path.javadocs) { //generate documentation
		tasks.push(eclipseTasksGenerateJavaDocs(context, decoder, path));
	}
	tasks.push(eclipseTasksFirst(context, decoder, path));
	tasks.push(eclipseTasksSecond(context, decoder, path));
	tasks.push(eclipseTasksThird(context, decoder, path));
	tasks.push(eclipseTasksFourth(context, decoder, path));
	tasks.push(eclipseTasksFifth(context, decoder, path));
	tasks.push(runTheTests(context, decoder, path));

	async.waterfall(tasks, function (err, result) {
		callback(err, result);
	});
}

function installAndroidStudioApk (path, context, callback) {
	var decoder = new StringDecoder('utf8'); //helps convert the buffer byte data into something human-readable
	var tasks = [];
	if (path.javadocs) { //generate documentation
		tasks.push(studioTasksGenerateJavaDocs(context, decoder, path));
	}
	tasks.push(studioTasksFirst(context, decoder, path));
	tasks.push(studioTasksSecond(context, decoder, path));
	tasks.push(studioTasksThird(context, decoder, path));
	tasks.push(studioTasksFourth(context, decoder, path));
	tasks.push(studioTasksFifth(context, decoder, path));
	tasks.push(runTheTests(context, decoder, path));

	async.waterfall(tasks, function (err, result) {
		callback(err, result);
	});
}


//the following methods are used exlusively for async.waterfall tasks
var eclipseTasksFindProjectName = function(context, decoder, path) {
	return function (next) {
		//attempt to figure out which folder is the test folder (the first folder found that has "test" in the name)
		child.exec('cd ${HOME}/.strider/data/*/.; find . -maxdepth 1 -regex ".*[tT][eE][sS][tT].*" -type d', function (err, stdout, stderr) {
			//grab only the first result
			var resultArray = stdout.split("\n");
        	path.testFolderName = resultArray[0].slice(2); //remove the "./" characters at the beginning
        	next(null);
    	});
	};
}

var eclipseTasksFindTestName = function(context, decoder, path) {
	return function (next) {
		//attempt to figure out which folder is the project folder (the first folder found that doesn't have "test" in the name)
		//WARNING: this command ignores hidden directories and the "." directory!
		child.exec('cd ${HOME}/.strider/data/*/.; find . -maxdepth 1 ! -regex ".*[tT][eE][sS][tT].*" -not -path \'*\/\\.*\' -not -path \'.\' -type d', function (err, stdout, stderr) {
        	var resultArray = stdout.split("\n");
        	path.projectFolderName = resultArray[0].slice(2); //remove the "./" characters at the beginning
        	next(null);
    	});
	};
}

var eclipseTasksGenerateJavaDocs = function (context, decoder, path) {
	return function (next) {
		//get to the project main directory
		process.chdir(process.env.HOME);
		process.chdir(".strider"); //go to the root project directory
		process.chdir("data"); 
		process.chdir(fs.readdirSync(".")[0]); //attempt to go into the first thing found in the directory (yes this is dumb)
		//javadoc -sourcepath ./Application/src/main/java:./Application/tests/src -subpackages com -d <LOCATION>
		context.out("Generating documentation...\n");
		//the colon with only work with linux and mac, as with many things in this program
		var destinationPath = path.javadocDirectory;
		var sourcePath = path.projectFolderName + "/src:" + path.testFolderName + "/src";
		var javaDocCommand = child.spawn("javadoc", ["-d", destinationPath, "-sourcepath", sourcePath, "-subpackages", "com"]);

		javaDocCommand.stdout.on('data', function (data) {
			context.out(data);
		});

		javaDocCommand.stderr.on('data', function (data) {
			context.out(data);
		});

		javaDocCommand.on('close', function (code) {
			context.out("Documentation saved in " + process.cwd() + "/" + destinationPath + "\n\n\n");
			next(null);
		});	
	}

}

var studioTasksGenerateJavaDocs = function (context, decoder, path) {
	return function (next) {
		//get to the project main directory
		process.chdir(process.env.HOME);
		process.chdir(".strider"); //go to the root project directory
		process.chdir("data"); 
		process.chdir(fs.readdirSync(".")[0]); //attempt to go into the first thing found in the directory (yes this is dumb)
		//javadoc -sourcepath ./Application/src/main/java:./Application/tests/src -subpackages com -d <LOCATION>

		context.out("Generating documentation...\n");
		
		//the colon with only work with linux and mac, as with many things in this program
		var destinationPath = path.javadocDirectory;
		context.out("Destination path: " + destinationPath);
		var sourcePath = "Application/src/main/java:Application/tests/src";
		var javaDocCommand = child.spawn("javadoc", ["-d", destinationPath, "-sourcepath", sourcePath, "-subpackages", "com"]);

		javaDocCommand.stdout.on('data', function (data) {
			context.out(data);
		});

		javaDocCommand.stderr.on('data', function (data) {
			context.out(data);
		});

		javaDocCommand.on('close', function (code) {
			context.out("Documentation saved in " + process.cwd() + "/" + destinationPath + "\n\n\n");
			next(null);
		});	
	}

}

var eclipseTasksFirst = function(context, decoder, path) {
	return function (next) {
		//get to the project main directory
		process.chdir(process.env.HOME);
		process.chdir(".strider"); //go to the root project directory
		process.chdir("data"); 
		process.chdir(fs.readdirSync(".")[0]); //attempt to go into the first thing found in the directory (yes this is dumb)

		//update the test project
		var updateTestProjectCommand = child.spawn(path.android, ["update", "test-project", "-m", "../" + path.projectFolderName, "-p", path.testFolderName]);
		updateTestProjectCommand.stdout.on('data', function (data) {
			context.out(decoder.write(data));
		});
		updateTestProjectCommand.stderr.on('data', function (data) {
			context.out(decoder.write(data));
		});
		updateTestProjectCommand.on('close', function (code) {
			//now update the main project. this is so both have a local.properties file which knows where the android sdk is
			var updateProjectCommand = child.spawn(path.android, ["update", "project", "-p", path.projectFolderName]);
			updateProjectCommand.stdout.on('data', function (data) {
				context.out(decoder.write(data));
			});
			updateProjectCommand.stderr.on('data', function (data) {
				context.out(decoder.write(data));
			});
			updateProjectCommand.on('close', function (code) {
				next(null);
			});
		});
	};
}

var eclipseTasksSecond = function(context, decoder, path) {
	return function (next) {
		//clean the project
		process.chdir(path.testFolderName); //go inside the test folder
		var antCleanCommand = child.spawn("ant", ["clean", "debug"]);
		antCleanCommand.stdout.on('data', function (data) {
			context.out(decoder.write(data));
		});
		antCleanCommand.stderr.on('data', function (data) {
			context.out(decoder.write(data));
		});
		antCleanCommand.on('close', function (code) { 
			next(null);
		});
	};
}

var eclipseTasksThird = function(context, decoder, path) {
	return function (next) {
		//find and resign the test apk
		process.chdir("bin"); //the apk is in the bin directory
		findAndResign("\*debug-unaligned.apk", context, path, function (debugTestApkName) {
			//source for the aapt solution (dljava):
			//http://stackoverflow.com/questions/4567904/how-to-start-an-application-using-android-adb-tools?rq=1
			var getPackageCmd = path.aapt + " dump badging " + debugTestApkName + "|awk -F\" \" \'/package/ {print $2}\'|awk -F\"\'\" \'/name=/ {print $2}\'";

			child.exec(getPackageCmd, function (err, stdout, stderr) {	
				var packageName = stdout.replace(/\n/g, ""); //make sure theres no newline characters
				next(null, debugTestApkName, packageName); //return the name of the debug apk and the package name
			});
		});

	};
}

var eclipseTasksFourth = function(context, decoder, path) {
	return function (debugTestApkName, packageName, next) {
		//find and resign the project apk so the security error doesn't pop up
		process.chdir("../");
		process.chdir("../");
		process.chdir(path.projectFolderName);

		//now build the main project to generate the apk
		var antCleanCommand = child.spawn("ant", ["clean", "debug"]);
		antCleanCommand.stdout.on('data', function (data) {
			context.out(decoder.write(data));
		});
		antCleanCommand.stderr.on('data', function (data) {
			context.out(decoder.write(data));
		});
		antCleanCommand.on('close', function (code) { 
			process.chdir("bin"); //the apk is in the bin directory

			findAndResign("\*debug-unaligned.apk", context, path, function (apkName) {
				next(null, debugTestApkName, apkName, packageName); //return the name of the project apk
			});

		});
	};
}

var eclipseTasksFifth = function(context, decoder, path) {
	return function (debugTestApkName, debugApkName, packageName, next) {
		//now install the apk files
		manager.installApk(path, debugApkName, context, function() {
			process.chdir("../");
			process.chdir("../");
			process.chdir(path.testFolderName);
			process.chdir("bin"); //the apk is in the bin directory
			manager.installApk(path, debugTestApkName, context, function() {
				next(null, debugApkName, debugTestApkName, packageName);
			});
		});
	};
}

var studioTasksFirst = function(context, decoder, path) {
	return function (next) {
		//get to the project main directory
		process.chdir(process.env.HOME);
		process.chdir(".strider"); //go to the root project directory
		process.chdir("data"); 
		process.chdir(fs.readdirSync(".")[0]); //attempt to go into the first thing found in the directory (yes this is dumb)
		
		if (path.sdkLocation != "") {//specify the android sdk location in gradle's local.properties file
			child.exec("echo \"sdk.dir=" + path.sdkLocation + "\" >> local.properties; ", function (err, stdout, stderr) {
				next(null);
			});
		}
		else { //sdk location would be in ANDROID_HOME. continue
			next(null);
		}
	};
}

var studioTasksSecond = function(context, decoder, path) {
	return function (next) {
		//create the APKs
		fs.chmodSync("gradlew", '555'); //give read and execute permissions
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

var studioTasksThird = function(context, decoder, path) {
	return function (next) {
		//find the debug apk and the test apk, then resign both so the security error doesn't pop up
		process.chdir("Application"); 
		process.chdir("build"); 
		process.chdir("outputs"); 
		process.chdir("apk"); 

		findAndResign("\*debug-unaligned.apk", context, path, function (debugApkName) {
			findAndResign("\*test-unaligned.apk", context, path, function (debugTestApkName) {
				next(null, debugApkName, debugTestApkName); //return the names of the apks
			});
		});

	};
}

var studioTasksFourth = function(context, decoder, path) {
	return function (debugApkName, debugTestApkName, next) {
		//now install the apk files
		manager.installApk(path, debugApkName, context, function() {
			manager.installApk(path, debugTestApkName, context, function() {
				next(null, debugApkName, debugTestApkName);
			});
		});
	};
}

var studioTasksFifth = function(context, decoder, path) {
	return function (debugApkName, debugTestApkName, next) {
		//get the test package name
		//source for the aapt solution (dljava):
		//http://stackoverflow.com/questions/4567904/how-to-start-an-application-using-android-adb-tools?rq=1
		var getPackageCmd = path.aapt + " dump badging " + debugTestApkName + "|awk -F\" \" \'/package/ {print $2}\'|awk -F\"\'\" \'/name=/ {print $2}\'";

		child.exec(getPackageCmd, function (err, stdout, stderr) {	
			stdout = stdout.replace(/\n/g, ""); //make sure theres no newline characters
			next(null, debugApkName, debugTestApkName, stdout); //return the package name
		});
	};
}

//use this regardless of which IDE is used
var runTheTests = function(context, decoder, path) {
	return function (debugApkName, debugTestApkName, packageName, next) {
		//run the tests!
		var activityName = "android.test.InstrumentationTestRunner"; //use this when running test apps
		manager.runTests(path, packageName, activityName, decoder, context, function (result, didRun) {
			return next(result, didRun);
		});
	};
}

//finds an apk based on a regex input, resigns it and returns the name of the apk
var findAndResign = function (regex, context, path, callback) {
	child.exec("find ./ -type f -name " + regex, function (err, stdout, stderr) {
		var apkName = stdout.slice(2); //remove the "./" characters at the beginning
		apkName = sanitizeName(apkName.replace(/\n/g, "")); //make sure theres no newline characters. then sanitize

		context.out("Apk Name: " + apkName + "\n");
		var resignCommand = "mkdir unzip-output; cd unzip-output; jar xf ../" + apkName + "; "
							+ "rm -r META-INF; ls | xargs jar -cvf " + apkName + "; "
							+ "jarsigner -digestalg SHA1 -sigalg MD5withRSA -keystore ${HOME}/.android/debug.keystore -storepass android -keypass android " + apkName + " androiddebugkey; "
							+ "rm ../" + apkName + "; mv " + apkName + " ../" + apkName + "; cd ../; rm -r unzip-output";
		child.exec(resignCommand, function (err, stdout, stderr) {
			context.out(stdout);
			callback(apkName);
		});

	});
}

var sanitizeName = function (string) {
	if (!string) {
		return "";
	}
	var matches = string.match(/[a-zA-Z\d\.\_\-*]/g);
	return matches.join("");
}

//return false if it is anything but "true" or true
var sanitizeBoolean = function (bool) {
	return ("" + bool == "true");
}

//./android update sdk --no-ui to fix dependency issues
//find a way to show errors/process of build in the strider test page!
//		./android list sdk --all lists all the things
//	   	./android update sdk --all --no-ui --filter 4 gets the fourth thing only in that list

//not enough RAM? lower the memory size of the emulator to fix this (find hidden .android/avd/emulator.avd/config.ini file)

//you can update test-project and lib-project
//https://developer.android.com/tools/help/android.html