var app = window.app;
/*
* $scope.configs, $scope.branch and $scope.pluginConfig, among others are available from the parent scope
* */

app.controller('AndroidController', ['$scope', '$http', function ($scope, $http) {
	$scope.deviceResults = "";
	$scope.targetResults = "";
	$scope.targetDevice = "";
	$scope.saving = false;

	$scope.$watch('configs[branch.name].android.config', function (value) {
		$scope.config = value || {
			environment: 'Hi from `environment`',
			prepare: 'Hi from `prepare`',
			test: 'Hi from `test`',
			deploy: 'Hi from `deploy`',
			cleanup: 'Hi from `cleanup`'
		};
	});

	$scope.save = function () {
		$scope.saving = true;
		$scope.pluginConfig('android', $scope.config, function () {
			$scope.saving = false;
		});
	};

	$scope.retrieveDevices = function () {
		$scope.save();
		$http.get('/ext/android/devices').success(function(data, status, headers, config) {
			console.log(data);
			$scope.deviceResults = data;
		});
		/*
		$http.get('/crokita/auto_dummy/api/android/devices').success(function(data, status, headers, config) {
			console.log(data);
			console.log(config);
			$scope.result = data;
		});*/
	}

	$scope.selectDevice = function (index) {
		$scope.targetDevice = $scope.deviceResults[index].name;
	}
	
	$scope.retrieveTargets = function () {
		$scope.save();
		$http.get('/ext/android/targets').success(function(data, status, headers, config) {
			$scope.targetResults = data;
		});
	}

	$scope.createDevice = function () {
		//construct the data
		var data =  {
			name: $scope.deviceName,
			target: $scope.targetOptions.id,
			abi: $scope.abiOptions,
			skin: $scope.skinOptions
		};
		//only make the request if name target and abi are defined
		console.log($scope.targetOptions);
		console.log($scope.abiOptions);
		console.log($scope.skinOptions);
		if (data.name != "" && data.target != "" && data.abi != "") {
			$http.post('/ext/android/devices', data).success(function(data, status, headers, config) {
				alert("Device added");
				//now update the device list
				$scope.retrieveDevices();
			});
		}


	}
}]);

