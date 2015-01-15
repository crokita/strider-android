#checks if the android sdk linux is installed in the home directory

if [ -d "${HOME}/android-sdk-linux" ] && [ -d "${HOME}/android-sdk-linux/tools" ] && [ -s "${HOME}/android-sdk-linux/tools/android" ]; then
	echo "Found the Android SDK directory"
	androidDir=${HOME}/android-sdk-linux/tools/android #the location of where the android tool is 
        #pass in the Android directory as a parameter. make sure the SDK is updated
        ./update-sdk-auto-yes.exp $androidDir
else
	echo "No valid SDK directory found. Installing..."
	curl --location http://dl.google.com/android/android-sdk_r22.3-linux.tgz | tar -x -z -C $HOME
	#give permissions
	#looks through available android targets and presents them in a concise format
	chmod 755 ${HOME}/android-sdk-linux #give permissions to read, write and execute
	chmod 755 ${HOME}/android-sdk-linux/tools
	chmod 755 ${HOME}/android-sdk-linux/tools/android
	chmod 755 ${HOME}/android-sdk-linux/tools/emulator64-arm

	androidDir=${HOME}/android-sdk-linux/tools/android #the location of where the android tool is 

       #pass in the Android directory as a parameter 
       ./update-sdk-auto-yes.exp $androidDir

	echo "Android SDK installed"
fi
