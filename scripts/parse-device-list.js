parseDeviceList();

function parseDeviceList () {
	var input = process.argv[2];
	var list = input.match(/Name: .*/g);

	for (index in list) {
		console.log(list[index].replace("Name: ", "")); //print out only the names of the available devices
	}

}