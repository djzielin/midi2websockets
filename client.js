const WebSocket = require('ws');
const midi = require('midi');

const ws = new WebSocket('ws://45.55.43.77:3902',{

    //perMessageDeflate: false
});

//ws.on('message', function incoming(data) {
//  console.log("incoming websocket data");
//});

 // Set up a new input.
const input = new midi.Input();
 
// Count the available input ports.
numberOfPorts=input.getPortCount();
console.log("number of ports: " + numberOfPorts);
let ourMidiPort=-1;
for(let i=0;i<numberOfPorts;i++){
  console.log("midi port: " + i + " " + input.getPortName(i));
  if(input.getPortName(i).includes("sender")) {
    console.log("found our sender port at index: " + i);
    ourMidiPort=i;
    break;
  }
}

if(ourMidiPort===-1){
  console.log("ERROR: no midi ports found - is the midi keyboard plugged into the computer?");
  process.exit();
}

// Get the name of a specified input port.
console.log("connecting to: " + input.getPortName(ourMidiPort));

 // Configure a callback.
input.on('message', (deltaTime, message) => {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  command = message[0];
  note = message[1];
  vel = message[2];
  // information interpreting the messages.
  if (command === 144) {
    console.log(`m: ${message}`);
    ws.send("[" + note + "," + vel + "]");
  }

});
 

input.openPort(ourMidiPort);
 
// Sysex, timing, and active sensing messages are ignored
// by default. To enable these message types, pass false for
// the appropriate type in the function below.
// Order: (Sysex, Timing, Active Sensing)
// For example if you want to receive only MIDI Clock beats
// you should use
// input.ignoreTypes(true, false, true)
input.ignoreTypes(true, true, true);
 
// ... receive MIDI messages ...
 
process.on("SIGINT", function () {
  console.log("received SIGINT (control-c). shutting down gracefully");
  input.closePort();
  ws.terminate();
  process.exit();
});
