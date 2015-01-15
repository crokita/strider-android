#PKG_OK=$(dpkg-query -W --showformat='${Status}\n' expect|grep "install ok installed")
#echo Checking for expect: $PKG_OK
#if [ "" == "$PKG_OK" ]; then
#  echo "No expect. Setting up expect."
#  sudo apt-get --force-yes --yes install expect
#fi
sudo apt-get --force-yes --yes install expect