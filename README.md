# strider-android

A Strider plugin for automating Android projects developed in Eclipse and Android Studio IDEs

Requirements:
*  Linux (tested only on Ubuntu so far)
*  Android SDK installed in the root directory
*  Ant installed for Eclipse projects

An Android device must be selected through the config webpage before clicking "Test"

#### Custom configurations on the webapge:

Add a new Android device
Select an existing android device
Select the name of the testing folder (it will attempt to find it for you if not specified)

For Android Studio:
*  make sure your local.properties file is NOT added in your VCS
*  make sure you have an ANDROID_HOME environment variable

TODO: give option for the user to specify where the Android SDK is instead of setting up environment variables