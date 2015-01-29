module.exports = {
    // mongoose schema, if you need project-specific config
    config: {
        "template": {
            environment: {type: String, default: 'Hi from `environment`'},
            prepare: {type: String, default: 'Hi from `prepare`'},
            test: {type: String, default: 'Hi from `test`'},
            deploy: {type: String, default: 'Hi from `deploy`'},
            cleanup: {type: String, default: 'Hi from `cleanup`'}
        },
        askForDevices: {type: Boolean, default: false}
    },
    // Define project-specific routes
    //   all routes created here are namespaced within /:org/:repo/api/:pluginid
    //   req.project is the current project
    //   req.accessLevel is the current user's access level for the project
    //      0 - anonymous, 1 - authed, 2 - admin / collaborator
    //   req.user is the current user
    //   req.pluginConfig() -> get the config for this plugin
    //   req.pluginConfig(config, cb(err)) -> set the config for this plugin
    routes: function (app, context) {
    },
    // Define global routes
    //   all routes namespaced within /ext/:pluginid
    //   req.user is the current user
    //   req.user.account_level can be used for authorization
    //      0 - anonymous, 1 - authed, 2 - admin / collaborator
    globalRoutes: function (app, context) {
    },
    // Listen for global events
    //   all job-local events that begin with `plugin.` are proxied to
    //   the main strider eventemitter, so you can listen for them here.
    //   Other events include `job.new`, `job.done` and `browser.update`.
    listen: function (emitter, context) {
        emitter.on('branch.plugin_config', function (project, branch, plugin, body) {
            //console.log("Project Info");
            //console.log(project);
            //console.log("Branch Info");
            //console.log(branch);
            //console.log("Plugin Info");
            //console.log(plugin);

            //body is the config's current state
            //console.log("Body Info");
            //console.log(body);
            if (body.askForDevices) { //the user wants to update/install the android SDK
              exec('chmod 755 ${HOME}/android-sdk-linux/tools/android; ${HOME}/android-sdk-linux/tools/android list avd;', function (err, stdout, stderr) {
                console.log("Successed!");
                console.log(stdout);
                body.askForDevices = false;
              });
            }  
        });
    }


};