# strider-android

A Strider plugin for automating Android projects developed in Eclipse and Android Studio IDEs

Requirements:
*  Linux or Mac OS
*  Android SDK installed. It is recommended to add it to your PATH.
   * The path for the SDK <b>must</b> go under the variable ANDROID_HOME
   * The following directories in the SDK must be added to the path in order for all the necessary tools to function:
      * tools
      * platform-tools
      * build-tools/21.1.2
*  Ant installed for Eclipse projects
*  Over 512 MB of memory for running the emulator and for gradle
*  Java Runtime Environment (JRE) or Java Development Kit (JDK)
   * The JDK is required if you want java documentation generation


An Android device must be selected through the config webpage before clicking "Test"
WARNING: An emulator has to be started through this plugin in order for functionality. Having an emulator exist before starting Strider may result in trouble if you attempt to select the same emulator for testing.

#### Custom configurations on the webpage:
*  If you don't have your Android SDK in your path you can specify it in a text field in the plugin
*  strider-android can grab your existing android devices or create a new one. They can also be deleted in the config page
*  If you create a new device then name, target level and ABI are required
 
Android Studio projects require no extra configurations. Eclipse projects must have two directories: one which holds the unit tests and one which contains the project. The user can specify which directory contains the unit tests and which contains the project code (more info on the plugin config page).

For Android Studio:
*  make sure your local.properties file is NOT added in your VCS

Given this answer: http://stackoverflow.com/a/16683625
*  If you imported an IntelliJ project to Android Studio then this plugin will not work for Android Studio at the time being

If your computer fails due to not having enough memory than changing the hw.ramSize property down to 96 or 128 MB may help with the problem
*  The config file for the hw.ramSize is in .android/avd/your_emulator_name.avd/config.ini, probably in your root directory

TODO LIST: 
*  Test this plugin for real android devices instead of just emulators
*  Allow the user to select a subset of tests to perform
*  Support for IntelliJ IDEA projects?
*  Option to automatically set up the Android SDK?
*  Move the installation logic into the prepare phase
*  Sometimes even after waiting for the device to boot it's still not enough time to wait for pushing an apk install on the device
*  Give the user the option to kill the emulator after testing