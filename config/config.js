var app = window.app;
var SDK = require("./bin/retrieveSDKInfo");

/*
* $scope.configs, $scope.branch and $scope.pluginConfig, among others are available from the parent scope
* */
app.controller('AndroidController', ['$scope', function ($scope) {
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

	$scope.retrieveData = function () {
		$scope.config.askForDevices = true;
		$scope.config.deviceList = [];
		console.log($scope.config);
		$scope.save();
		SDK.getDeviceList( function (result) {
        	console.log(result);
        });
	}

}]);