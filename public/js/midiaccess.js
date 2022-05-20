
var midi = null;
var midiOutput = null;
var midiChannel = 1;
var numberOfHeaderBytes = 5;

if(typeof navigator.requestMIDIAccess == 'function') {
  navigator.requestMIDIAccess({sysex: true} ).then( onMIDISuccess, onMIDIFailure );
} else {
  window.alert("Web MIDI not supported by this browser.");
}

function onMIDISuccess(midiAccess) {
  midi = midiAccess;
  populateMidiDevices();
  populateMidiChannels();
  midiAccess.onstatechange = function(e) {handleMidiStateChangeEvent(e);};
}



function receiveMidiMessage(message) {
  console.log("MIDI message received");
  var data = message.data;

  if (data.length == 24) {
    if (data[0] == 0xF0 && data[1] == 0x41 && data[2] == 0x30 && data[23] == 0xF7) {
      // 3rd byte is 0x30 at programe change, 0x31 at manual MODE
      // 4th byte is position
      if (data[3] == midiChannel-1) {
        var name = "";
        var pnr = data[3];
        if (pnr / 64 == 0) {
          name += "A";
        } else {
          name += "B";
        }
        pnr = pnr % 64;
        name += pnr / 8 + 1;
        name += pnr % 8 + 1;

        var patchdata = Array.from(data).slice(5,23);
        console.log("Roland Juno-106 patch " + name + " received on channel " + midiChannel);
        console.log(patchdata);
        //quietUpdateFromSysex(patchdata);
      }
    }
  }
}

function onMIDIFailure(msg) {
  window.alert("Access to MIDI not granted.");
}

function handleMidiStateChangeEvent(event) {
  if (event.port == midiOutput) {
    if (event.port.connection == "open") {
      console.log("Port is opened");
      return;
    } else if (event.port.state == "disconnected") {
      console.log("Current port is disconnected");
      midiOutput = null;
      window.alert("Selected MIDI output port is no longer available. Please check your configuration.");
    }
  } else if (event.port.state == "disconnected") {
    console.log("Other port disconnected");
  } else if (event.port.state == "connected") {
    console.log("Other port connected: " + event.port.name);
  }
  populateMidiDevices();
}

function setMidiInputPort() {
  midi.inputs.forEach(function(port) {
    if (port.name === midiOutput.name) {
      console.log("Listening to port: " + port.name);
      port.onmidimessage = receiveMidiMessage;
    }
  })
}

function setMidiOutputPort() {
  var select = document.getElementById("outputportselector");
  var selectedValue = select.options[select.selectedIndex].value;
  if (selectedValue == 0) {
    midiOutput = null;
  } else {
    midiOutput = midi.outputs.get(selectedValue);
    setMidiInputPort();
  }
}

function setMidiChannel() {
  midiChannel = parseInt(document.getElementById("channelselector").value);
  sendPatchSysex(sysex, 3);

  midi.inputs.forEach(function(key) {
    console.log(key.name);
    console.log(key.id);
  })
}

function removeMidiHeader(midiSysex) {
  var data = midiSysex.slice(5,5+18);
  return data;
}

function addMidiHeader(data) {
  var bytes = data.slice();
  // reverse order (unshift is beginning)
  bytes.unshift(0xF0, 0x41, 0x31, midiChannel-1, 0x00);
  bytes.push(0xF7);
  return bytes;
}

function sendPatchSysex(sysex, highlightIndex) {
  var bytes = addMidiHeader(sysex);
  setSysexLabel(toHexString(bytes, highlightIndex));

  if (midiOutput != null) {
    midiOutput.send(bytes);
  }
}

function populateMidiChannels() {
  var select = document.getElementById("channelselector");
  select.removeChild(select.options[0]);
  for (var i = 1; i <= 16; i++) {
    var opt = document.createElement("option");
    opt.text = i;
    opt.value = i;
    document.getElementById("channelselector").add(opt);
  }
}

function populateMidiDevices() {
  var select = document.getElementById("outputportselector");

  var numToRemove = select.options.length;
  for (var i = 0; i < numToRemove; ++i) {
    select.removeChild(select.options[0]);
  }

  var outputs = midi.outputs;

  var opt = document.createElement("option");
  opt.text = "none";
  opt.value = 0;
  opt.className = "system";
  document.getElementById("outputportselector").add(opt);

  outputs.forEach(function(key) {
    var opt = document.createElement("option");
    opt.text = key.name;
    opt.value = key.id;
    opt.className = "system";
    document.getElementById("outputportselector").add(opt);
  })

  if (midiOutput != null) {
    document.getElementById("outputportselector").value = midiOutput.id;
  } else {
    document.getElementById("outputportselector").value = 0;
  }
}
