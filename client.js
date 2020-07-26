const WebSocket = require('ws');
const midi = require('midi');
const readline = require('readline');

const midiInput = new midi.Input();
let ws = null;


const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
  });

console.clear();
let weAreConnected=false;


console.log("midi input (transmit) available: ");
for (let i = 0; i < midiInput.getPortCount(); i++) {
	console.log("["+ i + "] " + midiInput.getPortName(i));
}

rl.question('What port would you like to use? ', (answer) => {
	midiInput.openPort(parseInt(answer));
	midiInput.ignoreTypes(true, true, true); 	// Order: (Sysex, Timing, Active Sensing)
	midiInput.on('message', (deltaTime, message) => {
		command = message[0];
		note = message[1];
		vel = message[2];
		//console.log(`Message: ${message}`);

		if ((command & 0xF0) === 0x90) { // note on message
			console.log(`NoteOn: ${message}`);
			if(ws && weAreConnected){
				try{
					ws.send("[" + note + "," + vel + "]");
				} catch(err){
					console.log("can't send note right now: we don't seem to be connected");
				}
			}
		}
		if ((command & 0xF0) === 0x80) { // note off message
			console.log(`NoteOff: ${message}`);
			vel = 0;
			if(ws && weAreConnected){
				try{
					ws.send("[" + note + "," + vel + "]");
				}catch(err){
					console.log("can't send note right now: we don't seem to be connected");
				}
			}
		}
		if ((command & 0xF0) === 0xB0) { // note off message
			console.log(`CC: ${message}`);
		}
	});

	setInterval(() => {
		if (ws === null) {
			console.log("------------------------------------------------------------");
			console.log("1 seconds has expired. trying to connect to server... ");
			connectToServer();
		}
	}, 1000);
});

function connectToServer() {
	ws = new WebSocket('ws://45.55.43.77:3902');

	ws.on('error', (error) => {
		console.log("ERROR: couldn't connect to remote server.");
		weAreConnected=false;
		ws = null;
	});

	ws.on('close', (code, reason) => {
		console.log("CLOSE: connection closed");
		weAreConnected=false;
		ws = null;
	});

	ws.on('open', ()=>
	{ 
		weAreConnected=true;
		console.log("Success! we are connected to server!"); 
	});
}



process.on("SIGINT", () =>{
	console.log("received SIGINT (control-c). shutting down gracefully");

	try{
		midiInput.closePort();
	}catch(err)
	{
		//console.log("couldn't close midi port");
	}
	
	try{
		ws.terminate();
	}catch(err)
	{
		//console.log("couldn't close ws connection (perhaps not setup yet)");
	}
	process.exit();
});
