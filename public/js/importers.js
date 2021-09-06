initImporters();

function initImporters() {

	var fileInput106 = document.getElementById('j106importer');

	fileInput106.addEventListener('change', function(e) {
		var file = fileInput106.files[0];
		var reader = new FileReader();
		reader.onload = function(e) {
			//showImportView();
			var res = processFilename(file.name);
			//var result = String.fromCharCode.apply(null, new Uint8Array(reader.result));
			fileInput106.value = null;
			var data = new Uint8Array(reader.result);
			document.getElementById("patchselector").value = -1;
			setPatch(removeMidiHeader(data), file.name);
		};
		reader.readAsArrayBuffer(file);

	});
}

function processFilename(name) {
	var tmp = name.split(".");
	var suffix = tmp[tmp.length-1];
	var name = tmp[0];
	for (var i = 1; i < tmp.length-1; i++) {
		name = name + "." + tmp[i];
	}
	return {name: name, type: suffix}
}
