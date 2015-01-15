#automatically build and install the app and test app apk onto an emulated phone, and begin testing.
./get-expect.sh #check if expect is installed, and if not, install it
./get-sdk.sh #check if the sdk is installed, and if not, install it

androidDir=${HOME}/android-sdk-linux/tools/android #the location of where the android tool is 
emulatorDir=${HOME}/android-sdk-linux/tools/emulator64-arm #the location of where the android emulator is (emulator64-arm) (emulator64-x86) (emulator64-mips) 

#print the location of the android directory for future use in node.js files
echo "$androidDir" >> android-directory.txt

./get-system-images.sh $androidDir #check if system images are installed for all android platforms. install if not. 

deviceList=$($androidDir list avd) #find all devices
node parse-device-list.js "$deviceList" > tmp-device-info.txt #parse through device names
cat tmp-device-info.txt

device="" #name of the android device to use
if [ -s tmp-device-info.txt ] ; #check if there are any available devices
then
	device=$(head -1 tmp-device-info.txt) #use the first device
else
	echo "No devices found. Creating new device"
	echo no | $androidDir create avd -n android_emulator -t 14 -b armeabi-v7a #create device with name android_emulator, api level 14, and abi of armeabi-v7a
	device="android_emulator"
fi
rm tmp-device-info.txt #remove temp file

#echo $device

#start the emulator so that it doesn't block the program flow
$emulatorDir -avd $device -no-skin -no-audio -no-window -no-boot-anim &
adb wait-for-device #continue only once the device boots up
echo "Device $device booted!"

#go to the root directory of the project
cd ${HOME}/.strider/data/
ls #derp


#SOLUTION MAYBE
#./emulator64-arm -avd android_emulator -no-skin -no-audio -no-window -no-boot-anim (-shell)? 

#restart server    sudo shutdown -r now