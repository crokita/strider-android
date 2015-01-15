#checks if the emulator can even run by looking at available system images
#argument passed in: directory of the android tool

androidDir="$1"

download ()
{
	echo "Downloading system images. This will take a while"
	./system-images-auto-yes.exp $androidDir
	echo "System Images Installed"
}

if [ ! -d "${HOME}/android-sdk-linux" ]; then
	echo "No SDK directory found"
	download
fi

if [ ! -d "${HOME}/android-sdk-linux/system-images" ]; then
	echo "No system images directory found"
	download
fi

targets=$($1 list targets) #find all targets 
node parse-target-list.js "$targets" > tmp-target-info.txt #parse through target names and their ABIs

charsInFile=$(wc -m < tmp-target-info.txt)
if [ "$charsInFile" -ge 0 ]; then #does the file contain anything? 
	echo "Found valid ABIs"
	cat tmp-target-info.txt
else
	#at least ONE of the android platforms has no system image
	echo "At least one of the android platforms has no system image"
	download
fi

rm tmp-target-info.txt # remove the temp file

