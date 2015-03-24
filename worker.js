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
			environment: '',
			//object style
			prepare: function (context, done) {
				var configData = {
					device: config.device,
					isLibrary: config.isLibrary,
					testFolderName: config.testFolderName,
					ide: config.ide,
					sdkLocation: config.sdkLocation
				};
				//context.comment("This is a comment. It gets shown on the Strider webpage");
/*
				console.log("ARGS");
				context.logger.log("basically just like info");
				context.logger.info("helpful info");
				context.logger.warn("give a warning");
				context.logger.error("abort");
				context.logger.time("Current time");
				context.logger.trace("error message");
				context.logger.assert(true); //just make this true
*/
				SDK.findEmulator(context, function (result) {
					if (!result) { //if it didn't return a matching emulator then start a new one
						context.out("No emulator found. Starting up emulator\n");
						SDK.startEmulator(configData, context, function (err, result) {
							done(null, true);
						});
					}
					else {
						context.out("Found running emulator: " + result + "\n");
					}
				});
				
			},
			//function style (calling done is a MUST)
			test: function (context, done) {
				var configData = {
					device: config.device,
					isLibrary: config.isLibrary,
					projectFolderName: config.projectFolderName,
					testFolderName: config.testFolderName,
					ide: config.ide,
					sdkLocation: config.sdkLocation
				};
				done("ERROR", true);
/*
				SDK.installApk(configData, context, function (err, result) {
					done(null, true);
				});*/
			},
			deploy: '',
			cleanup: ''

		});//TODO: uninstall the apks in the cleanup phase?
	},
	// this is only used if there is _no_ plugin configuration for a
	// project. See gumshoe for documentation on detection rules.
	autodetect: {
		filename: 'package.json',
		exists: true
	}
};