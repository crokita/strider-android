# strider-android

NOTE: ECLIPSE PROJECT TESTING IS STILL UNDER DEVELOPMENT

A Strider plugin for automating Android projects developed in Eclipse and Android Studio IDEs

Requirements:
*  Linux (tested only on Ubuntu so far)
*  Android SDK installed. Recommended to add it to your PATH
*  Ant installed for Eclipse projects
*  Over 512 MB of memory for running the emulator and for gradle
*  Java Runtime Environment (JRE) or Java Development Kit (JDK)


An Android device must be selected through the config webpage before clicking "Test"

#### Custom configurations on the webapge:

##### Adding a new Android device
Select an existing android device
Select the name of the testing folder (it will attempt to find it for you if not specified)

For Android Studio:
*  make sure your local.properties file is NOT added in your VCS

TODO: test this plugin for real android devices instead of just emulators

Given this answer: http://stackoverflow.com/a/16683625
*  If you imported an IntelliJ project to Android Studio then this plugin will not work for Android Studio at the time being

If your computer fails due to not having enough memory than changing the hw.ramSize property down to 96 or 128 MB may help with the problem
*  The config file for the hw.ramSize is in .android/avd/your_emulator_name.avd/config.ini, probably in your root directory