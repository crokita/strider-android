var SDK = require("./bin/retrieveSDKInfo");
var async = require('async');

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
			/*listen: function (emitter, context) {
				emitter.on('job.status.phase.done', function (id, data) {
					var phase = data.phase;
					context.log('the ' + phase + ' phase has completed');
					return true;
				});
			},*/
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
					projectFolderName: config.projectFolderName,
					testFolderName: config.testFolderName,
					ide: config.ide,
					sdkLocation: config.sdkLocation,
					javadocs: config.javadocs,
					isEmulator: config.isEmulator,
					autoStop: config.autoStop,
					javadocDirectory: config.javadocDirectory
				};

				if (config.isEmulator) {
					SDK.startEmulator(configData, context, function () {
						done(null, true);
					});
				}
				else { //don't start emulators if a physical device was selected
					context.out("Using physical device " + configData.device);
					done(null, true);
				}
				
			},
			//function style (calling done is a MUST)
			test: function (context, done) {
				var configData = {
					device: config.device,
					isLibrary: config.isLibrary,
					projectFolderName: config.projectFolderName,
					testFolderName: config.testFolderName,
					ide: config.ide,
					sdkLocation: config.sdkLocation,
					javadocs: config.javadocs,
					isEmulator: config.isEmulator,
					autoStop: config.autoStop,
					javadocDirectory: config.javadocDirectory
				};

				SDK.installApk(configData, context, function (err, result) {
					done(err, result); //result is a boolean. err is an error message (if any)
				});
			}
			//deploy: '',
			//cleanup: ''

		});//TODO: uninstall the apks in the cleanup phase?
	},
	// this is only used if there is _no_ plugin configuration for a
	// project. See gumshoe for documentation on detection rules.
	autodetect: {
		filename: 'package.json',
		exists: true
	}
};