var app = window.app;
/*
* $scope.configs, $scope.branch and $scope.pluginConfig, among others are available from the parent scope
* */
app.factory('exampleService', function($http) {
   return {
        getDevices: function() {
			//return the promise directly.
			return $http.get('/')
				.then(function(result) {
				//resolve the promise as the data
				return result.data;
        	});
        }
   }
});

app.controller('AndroidController', function ($scope, exampleService) {
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
		$scope.save();
		exampleService.getDevices().then(function (result) {
			$scope.result = result;
			console.log($scope.result);
		})
	}

});

