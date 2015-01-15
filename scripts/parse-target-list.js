parseTargetList();

function parseTargetList () {
	var input = process.argv[2];
	var list = input.match(/Name: .*|Type: .*|Tag\/ABIs : .*/g);
	var groupedList = [];
	for (match in list) {
		var threeProperties = list.splice(0,3);
		groupedList.push(threeProperties);
	}
	var result = "";

	var success = groupedList.every(function (element, index, array) {
		var name = element[0].replace("Name: ", "");
		var type = element[1].replace("Type : ", "");
		var abis = element[2].replace("Tag/ABIs :", "");
		//console.log("Name: " + name);
		//console.log("Type: " + type);
		//console.log("ABIs: " + abis);
		if (abis == "no ABIs") {
			if (type == "Platform") { //a platform which has no ABIs cannot run on an emulator. error out
				return false;
			}
		}
		result += name + "\n"
		return true;
	});

	if (success) {
		//return the list of android targets
		console.log(result);
	}
	else {
		//don't return anything
	}

}