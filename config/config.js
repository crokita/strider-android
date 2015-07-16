var app = window.app;
/*
* $scope.configs, $scope.branch and $scope.pluginConfig, among others are available from the parent scope
* */

app.controller('AndroidController', ['$scope', '$http', function ($scope, $http) {
	$scope.saving = false;

	//information grabbed from android sdk or from the user concerning project settings

	$scope.initializeData = function () {
		//reset data that shouldn't persist
		//$scope.deviceResults
		$scope.emulatorResults = "";
		$scope.physicalResults = "";
		$scope.runningEmulators = "";
		$scope.targetResults = "";
		$scope.dataResult = "";
		//user configurations for devices
		$scope.deviceName = "";
		$scope.targetOptions = "";
		$scope.abiOptions = "";
		$scope.eclipseModel = {}; //for eclipse configurations
		$scope.eclipseModel.savingProjectFolderName = false; //for the spinner projectFolderName
		$scope.eclipseModel.savingTestFolderName = false; //for the spinner testFolderName
		$scope.savingSdkLocation = false; //for the spinner sdkLocation
		$scope.javadocs = false; //generate documentation
		$scope.runningModel = {}; //
		//config-dependent variables
		$scope.ide = "";
		$scope.deviceSelected = "";
		$scope.isLibrary = false;
		$scope.testFolderName = "";
		$scope.projectFolderName = "";
		$scope.sdkLocation = "";
		$scope.isEmulator = true; //this isn't shown to the user. default to true, even though it doesn't matter what it is
	}


	$scope.$watch('configs[branch.name].android.config', function (value) {
		$scope.config = value || {
			environment: 'Hi from `environment`',
			prepare: 'Hi from `prepare`',
			test: 'Hi from `test`',
			deploy: 'Hi from `deploy`',
			cleanup: 'Hi from `cleanup`'
		};
		//set the model variables to what's in the config
		$scope.ide = $scope.config.ide;
		$scope.deviceSelected = $scope.config.device;
		$scope.isLibrary = $scope.config.isLibrary;
		$scope.eclipseModel.projectFolderName = $scope.config.projectFolderName;
		$scope.eclipseModel.testFolderName = $scope.config.testFolderName;
		$scope.sdkLocation = $scope.config.sdkLocation;
		$scope.javadocs = $scope.config.javadocs;
		$scope.isEmulator = $scope.config.isEmulator;
	});

	//save all data into the config 
	$scope.save = function () {
		$scope.saving = true;
		$scope.pluginConfig('android', $scope.config, function () {
			$scope.saving = false;
		});
	};

	//gives options for Eclipse projects
	$scope.toEclipse = function () {
		$scope.ide = "Eclipse";
		$scope.config.ide = $scope.ide;
		$scope.save();
	}

	//gives options for Android Studio projects
	$scope.toAndroidStudio = function () {
		$scope.ide = "AndroidStudio";
		$scope.config.ide = $scope.ide;
		$scope.save();
	}

	//toggles whether to generate java documentation
	$scope.toggleJavaDocs = function () {
		$scope.config.javadocs = !$scope.javadocs; //because of how ng-click is working the actual value is set to the opposite one intended
		$scope.save();
	}

	//returns a list of all available devices to run projects on
	$scope.retrieveDevices = function () {
		$scope.save();
		var urlParams = "";
		if ($scope.config.sdkLocation != "") {
			urlParams = '?sdk=' + $scope.config.sdkLocation;
		}

		$http.get('/ext/android/devices' + urlParams).success(function(data, status, headers, config) {
			$scope.toConsole(data.error);
			$scope.emulatorResults = data.result.emulators;
			$scope.physicalResults = data.result.physicals;
			$scope.runningEmulators = data.result.runningEmulators;
		});
		/*
		$http.get('/crokita/auto_dummy/api/android/devices').success(function(data, status, headers, config) {
			console.log(data);
			console.log(config);
			$scope.result = data;
		});*/
	}

	//check if the emulator is running
	$scope.runningModel.isRunning = function (name) {
		var running = false;
		for (var index = 0; index < $scope.runningEmulators.length; index++) {
			if ($scope.runningEmulators[index] == name) {
				running = true;
				index = $scope.runningEmulators.length;
			}
		}
		return running;
	}

	//kills the process of an emulator
	$scope.stopEmulator = function (name) {
		var data =  {
			name: name,
			sdkLocation: $scope.config.sdkLocation
		}

		//use the put method because Express does not allow a body for a delete request
		//see http://stackoverflow.com/questions/22186671/angular-resource-delete-wont-send-body-to-express-js-server
		$http.put('/ext/android/stop', data).success(function(data, status, headers, config) {
			if (data.result != null) {
				$scope.toConsole(data.result);
			}
			else {
				$scope.toConsole(data.error);
			}
		});
	}

	//remembers the name of the device selected
	$scope.selectEmulator = function (index) {
		$scope.deviceSelected = $scope.emulatorResults[index].name;
		$scope.config.device = $scope.emulatorResults[index].name;
		$scope.isEmulator = true;
		$scope.config.isEmulator = true;
		$scope.save();
	}
	
	//remembers the name of the device selected
	$scope.selectPhysical = function (index) {
		$scope.deviceSelected = $scope.physicalResults[index];
		$scope.config.device = $scope.physicalResults[index];
		$scope.isEmulator = false;
		$scope.config.isEmulator = false;
		$scope.save();
	}

	//retrieves a list of available Android targets and their ABIs
	$scope.retrieveTargets = function () {
		$scope.save();
		var urlParams = "";
		if ($scope.config.sdkLocation != "") {
			urlParams = '?sdk=' + $scope.config.sdkLocation;
		}
		$http.get('/ext/android/targets' + urlParams).success(function(data, status, headers, config) {
			$scope.toConsole(data.error);
			$scope.targetResults = data.result;
		});
	}

	//creates a new Android device with the info given by the user
	$scope.createDevice = function () {
		//construct the data
		var data =  {
			name: $scope.deviceName,
			target: $scope.targetOptions.id,
			abi: $scope.abiOptions,
			sdkLocation: $scope.config.sdkLocation
		};
		console.log(data);
		//only make the request if name and target and abi are defined
		if (data.name != "" && data.target != "" && data.abi != "") {
			$http.post('/ext/android/devices', data).success(function(data, status, headers, config) {
				if (data.result != null) {
					$scope.toConsole(data.result);
				}
				else {
					$scope.toConsole(data.error);
				}
				
				//reset the options
				$scope.deviceName = "";
				$scope.targetOptions = "";
				$scope.abiOptions = "";

				//now update the device list
				$scope.retrieveDevices();
			});
		}
		else {
			alert("Please fill out all fields before creating a device.");
		}
	}

	//deletes a specified Android device
	$scope.deleteDevice = function (device) {
		if (device == $scope.deviceSelected) {
			$scope.deviceSelected = "";
			$scope.config.device = $scope.deviceSelected;
		}

		var data =  {
			name: device,
			sdkLocation: $scope.config.sdkLocation
		}

		//use the put method because Express does not allow a body for a delete request
		//see http://stackoverflow.com/questions/22186671/angular-resource-delete-wont-send-body-to-express-js-server
		$http.put('/ext/android/devices', data).success(function(data, status, headers, config) {
			if (data.result != null) {
				$scope.toConsole(data.result);
			}
			else {
				$scope.toConsole(data.error);
			}

			//now update the device list
			$scope.retrieveDevices();
		});
	}

	//toggles whether the Eclipse test project is a library
	$scope.changeIsLibrary = function () {
		$scope.config.isLibrary = !$scope.isLibrary; //because of how ng-click is working the actual value is set to the opposite one intended
		$scope.save();
	}

	//lets user know the input of what is the Eclipse testing folder name isnt saved
	$scope.focusTestFolderName = function () {
		$scope.eclipseModel.savingTestFolderName = true;
	}

	//lets user know the input of what is the Eclipse project folder name isnt saved
	$scope.focusProjectFolderName = function () {
		$scope.eclipseModel.savingProjectFolderName = true;
	}

	//lets user know the input of where the Android SDK is located isnt saved
	$scope.focusSdkLocation = function () {
		$scope.savingSdkLocation = true;
	}

	//saves the input of what is the Eclipse testing folder name
	$scope.blurTestFolderName = function () {
		$scope.eclipseModel.savingTestFolderName = false;
		$scope.config.testFolderName = $scope.eclipseModel.testFolderName;
		$scope.save();
	}

	//saves the input of what is the Eclipse project folder name
	$scope.blurProjectFolderName = function () {
		$scope.eclipseModel.savingProjectFolderName = false;
		$scope.config.projectFolderName = $scope.eclipseModel.projectFolderName;
		$scope.save();
	}

	//saves the input of where the Android SDK is located
	$scope.blurSdkLocation = function () {
		$scope.savingSdkLocation = false;
		$scope.config.sdkLocation = $scope.sdkLocation;
		$scope.save();
	}

	//function to easily add information to the console. ignores null inputs
	$scope.toConsole = function (data) {
		if (data) {
			var time = new Date().toLocaleTimeString();
			$scope.dataResult += time + "- " +data + "\n";
		}
	}

}]);

