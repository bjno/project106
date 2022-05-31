var library = [];

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {

      var response = JSON.parse(this.responseText);

      library = response.result.patches;
      console.log("Successful load of " + library.length + " patches.");
      populatePatchList();
    } else if (this.readyState == 4 && this.status != 200) {
      console.log("Error loading factory patches.");
      populatePatchList();
    }
};
xhttp.open("POST", "https://j106.b4a.app/parse/functions/getFactoryPatches", true);
xhttp.setRequestHeader("X-Parse-Application-Id", "X0EVTr2waRcXEnY7DvKRwg2lOapCaIZ39C4D6vuw");
xhttp.setRequestHeader("X-Parse-Client-Key", "GLDI7QqXfskCEwNU6iuKGJNk8amnWYKS9FYH7RiR");
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send();

function populatePatchList() {
  var select = document.getElementById("patchselector");

  clearPatchList();

  var opt = document.createElement("option");
  opt.text = "---";
  opt.value = -1;
  select.add(opt);

  for (var i = 0; i < library.length; i++) {
    opt = document.createElement("option");
    opt.text = library[i].name;
    opt.value = i;
    select.add(opt);
  }
}

function clearPatchList() {
  var select = document.getElementById("patchselector");
  var L = select.options.length - 1;
  for(var i = L; i >= 0; i--) {
    select.remove(i);
  }
}


function loadPatch() {
  patchIndex = parseInt(document.getElementById("patchselector").value);
  if (patchIndex == -1) {
    setInitialPatch();
  }
  setPatch(library[patchIndex].data, library[patchIndex].name);
}
