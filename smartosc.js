import osc from 'osc';
import { getInputs, Input, Output } from 'easymidi';

const tcpPort = new osc.TCPSocketPort({
  localAddress: '127.0.0.1',
  localPort: 3032,
});

tcpPort.on('ready', function () {
  tcpPort.send({ address: '/eos/ping' });
  tcpPort.send({ address: '/eos/fader/1/config/24' });
});

tcpPort.open();

const devices = getInputs();
const input = new Input(devices[1]);
const output = new Output(devices[1]);

let ignoreNextMidiCC = false;
const faderRegex = /\/eos\/fader\/1\/\d+/g;

input.on('cc', function (msg) {
  if (ignoreNextMidiCC) {
    ignoreNextMidiCC = false;
    return;
  }
  tcpPort.send({
    address: `/eos/fader/1/${msg.controller}`,
    args: [{ type: 'f', value: msg.value / 127 }],
  });
});

input.on('noteon', function (msg) {
  tcpPort.send({
    address: `/eos/fader/1/${msg.note - 23}`,
    args: [{ type: 'f', value: msg.velocity ? 1 : 0 }],
  });
});

tcpPort.on('message', function (oscMsg) {
  if (faderRegex.test(oscMsg.address)) {
    ignoreNextMidiCC = true;
    output.send('cc', {
      controller: oscMsg.address.split('/').pop(),
      value: Math.round(oscMsg.args[0] * 127),
    });
  }
});