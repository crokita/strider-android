var SDK = require("./bin/retrieveSDKInfo");
var async = require('async');
var manager = require('./deviceManager');

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
					isEmulator: config.isEmulator
				};

				if (config.isEmulator) {
					SDK.startEmulator(configData, context, function () {
						done(null, true);
					});
				}
				else { //don't start emulators if a physical device was selected
					done(null, true);
				}

				/*SDK.findEmulator(context, function (result) {
					if (!result) { //if it didn't return a matching emulator then start a new one
						context.out("No emulator found. Starting up emulator " + configData.device + "\n");
						SDK.startEmulator(configData, context, function (code) {
							done(null, true);
						});
					}
					else {
						context.out("Found running emulator: " + result + "\n");
						//if the found emulator is the same as the emulator we want to run then leave it alone
						//if the found emulator is different then kill it and start the proper one
						//if (result == config.device) { TODO: fix this. config.device and the emulator name that returns aren't the same name
							done(null, true);
						//}
						//else {
							
						//}
					}
				});*/
				
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
					isEmulator: config.isEmulator
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