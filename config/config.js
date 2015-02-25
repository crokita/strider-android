var app = window.app;
/*
* $scope.configs, $scope.branch and $scope.pluginConfig, among others are available from the parent scope
* */

app.controller('AndroidController', ['$scope', '$http', function ($scope, $http) {
	$scope.saving = false;

	//information grabbed from android sdk or from the user concerning project settings
	$scope.ide = "";
	$scope.deviceResults = "";
	$scope.targetResults = "";
	$scope.deviceSelected = "";
	$scope.isLibrary = false;
	$scope.testFolderName = "";
	$scope.dataResult = "";
	//user configurations for devices
	$scope.deviceName = "";
	$scope.targetOptions = "";
	$scope.abiOptions = "";

	$scope.$watch('configs[branch.name].android.config', function (value) {
		$scope.config = value || {
			environment: 'Hi from `environment`',
			prepare: 'Hi from `prepare`',
			test: 'Hi from `test`',
			deploy: 'Hi from `deploy`',
			cleanup: 'Hi from `cleanup`'
		};
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
	}

	//gives options for Android Studio projects
	$scope.toAndroidStudio = function () {
		$scope.ide = "AndroidStudio";
	}

	//returns a list of all available devices to run projects on
	$scope.retrieveDevices = function () {
		$scope.save();
		$http.get('/ext/android/devices').success(function(data, status, headers, config) {
			$scope.deviceResults = data;
		});
		/*
		$http.get('/crokita/auto_dummy/api/android/devices').success(function(data, status, headers, config) {
			console.log(data);
			console.log(config);
			$scope.result = data;
		});*/
	}

	//remembers the name of the device selectged
	$scope.selectDevice = function (index) {
		$scope.deviceSelected = $scope.deviceResults[index].name;
		$scope.config.device = $scope.deviceResults[index].name;
		$scope.save();
	}
	
	//retrieves a list of available Android targets and their ABIs
	$scope.retrieveTargets = function () {
		$scope.save();
		$http.get('/ext/android/targets').success(function(data, status, headers, config) {
			$scope.targetResults = data;
		});
	}

	//creates a new Android device with the info given by the user
	$scope.createDevice = function () {
		//construct the data
		var data =  {
			name: $scope.deviceName,
			target: $scope.targetOptions.id,
			abi: $scope.abiOptions
		};
		//only make the request if name and target and abi are defined
		if (data.name != "" && data.target != "" && data.abi != "") {
			$http.post('/ext/android/devices', data).success(function(data, status, headers, config) {
				$scope.dataResult = data;
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
		}

		var data =  {
			name: device
		};

		//use the put method because Express does not allow a body for a delete request
		//see http://stackoverflow.com/questions/22186671/angular-resource-delete-wont-send-body-to-express-js-server
		$http.put('/ext/android/devices', data).success(function(data, status, headers, config) {
			$scope.dataResult = data;
			//now update the device list
			$scope.retrieveDevices();
		});
	}

	//toggles whether the Eclipse test project is a library
	$scope.changeIsLibrary = function () {
		$scope.config.isLibrary = !$scope.isLibrary; //because of how ng-click is working the actual value is set to the opposite one intended
		$scope.save();
	}

	//saves the input of what is the Eclipse testing folder name
	$scope.changeTestFolderName = function () {
		$scope.config.testFolderName = $scope.testFolderName;
		$scope.save();
	}

}]);

