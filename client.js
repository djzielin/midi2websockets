const WebSocket = require('ws');
const midi = require('midi');
//var prompt = require('prompt');
const readline = require('readline');

const midiInput = new midi.Input();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
  });
console.clear();

console.log("midi ports available: ");
for (let i = 0; i < midiInput.getPortCount(); i++) {
	console.log("["+ i + "] " + midiInput.getPortName(i));
}

//prompt.get(schema, function (err, result) {
rl.question('What port would you like to use? ', (answer) => {
	try {
		const ws = new WebSocket('ws://45.55.43.77:3902');  //TODO how to capture error properly!!!
	}
	catch (err) {
		console.log("ERROR: couldn't connect to server - " + err);
		input.closePort();
		process.exit();
	}

	midiInput.openPort(parseInt(answer));
	midiInput.ignoreTypes(true, true, true); 	// Order: (Sysex, Timing, Active Sensing)
	midiInput.on('message', (deltaTime, message) => {
		command = message[0];
		note = message[1];
		vel = message[2];

		if ((command & 0xF0) === 0x90) { // note on message
			console.log(`NoteOn: ${message}`);
			ws.send("[" + note + "," + vel + "]");
		}
		if ((command & 0xF0) === 0x80) { // note off message
			console.log(`NoteOff: ${message}`);
			vel = 0;
			ws.send("[" + note + "," + vel + "]");
		}
	});
});

process.on("SIGINT", function () {
  console.log("received SIGINT (control-c). shutting down gracefully");
  input.closePort();
  ws.terminate();
  process.exit();
});
