var SDK = require("./bin/retrieveSDKInfo");

module.exports = {
	// Initialize the plugin for a job
	//   config: the config for this job, made by extending the DB config
	//           with any flat-file config
	//   job:    see strider-runner-core for a description of that object
	//   context: currently only defines "dataDir"
	//   cb(err, initializedPlugin)
	init: function (config, job, context, cb) {
		//config = config || {};
		//console.log(config);

		return cb(null, {
			// any extra env variables. Will be available during all phases
			env: {},
			// Listen for events on the internal job emitter.
			//   Look at strider-runner-core for an
			//   enumeration of the events. Emit plugin.[pluginid].myevent to
			//   communicate things up to the browser or to the webapp.
			listen: function (emitter, context) {
				emitter.on('job.status.phase.done', function (id, data) {
					var phase = data.phase;
					context.log('the ' + phase + ' phase has completed');
					return true;
				});
			},
			// For each phase that you want to deal with, provide either a
			// shell command [string] or [Object] (as demo'd below)
			// or a fn(context, done(err, didrun))

			//string style
			environment: 'echo "' + config.environment + '"',
			//object style
			prepare: function (context, done) {
				var configData = {
					device: config.device,
					isLibrary: config.isLibrary,
					testFolderName: config.testFolderName,
					ide: config.ide,
					sdkLocation: config.sdkLocation
				};
				context.log("Test!");	
				console.log(context.out("test"));
				console.log(context.log("test"));
				console.log(context.comment("test"));
				console.log(context.cmd("test"));
				console.log(context.data("test"));


				SDK.startEmulator(configData, context, function (err, result) {
					console.log(result);
					done(null, true);
				});
			},
			//function style (calling done is a MUST)
			test: function (context, done) {
				var configData = {
					device: config.device,
					isLibrary: config.isLibrary,
					testFolderName: config.testFolderName,
					ide: config.ide,
					sdkLocation: config.sdkLocation
				};

				SDK.installApk(configData, function (err, result) {
					console.log(result);
					done(null, true);
				});
			},
			deploy: 'echo "' + config.deploy + '"',
			cleanup: 'echo "' + config.cleanup + '"'

		});
	},
	// this is only used if there is _no_ plugin configuration for a
	// project. See gumshoe for documentation on detection rules.
	autodetect: {
		filename: 'package.json',
		exists: true
	}
};