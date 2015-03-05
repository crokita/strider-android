output=""

until [[ "$output" != "Error: Could not access the Package Manager.  Is the system running?" ]]
do
	output=$(find $directory -type f -name \*.apk | xargs adb install)
done