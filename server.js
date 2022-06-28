const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const fs = require('fs')
const rpio = require('rpio');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let program = require('./program.json');

app.post('/save', (req, res) => {
  writeFile(__dirname  + "/code.txt", req.body.code);
  writeFile(__dirname  + "/program.json", JSON.stringify(req.body.compiled));
  program = req.body.compiled;
  res.json({success:true})
})

app.get('/load', (req, res) => {
  const data = fs.readFileSync(__dirname  + '/code.txt')
  res.send(data);
})

const writeFile = (filename, content) => {
  try {
    fs.writeFileSync(filename, content);
  } catch (err) {
    console.error(err);
  }
}

app.use('/', express.static(__dirname + '/static'))

app.listen(process.env.PORT || 5000);

const waitTime = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clock(){
  let now = new Date();
  let day = now.getDay() + 1;
  let hours = now.getHours();
  let minutes = now.getMinutes();

  for(const block of program){
    if(block.day.includes(day) && block.time[0] == hours && block.time[1] == minutes){
      runCommands(block.commands);
    }
  }
}


async function runCommands(commands){
  for(const command of commands){
    await runCommand(command.type, command.parameters)
  }

}

const gpio = {
  'C': 3,
  'AC1': 5,
  'AC2': 7,
  'M': 8,
  4: 10,
  3: 12,
  2: 16,
  1: 18
}

const ON = rpio.LOW, OFF = rpio.HIGH;

function setupRpio(){
  rpio.init();
  for(port in gpio){
    rpio.open(gpio[port], rpio.OUTPUT, OFF);
  }
}

setupRpio();

async function runCommand(commandType, parameters){
  switch(commandType){
    case 'open':
      const port = parameters[0];
      const [hours, minutes] = parameters[1];
      portOn(port)
      await waitTime(hours * 3600 * 1000 + minutes * 60 * 1000)
      portOff(port)
      break;
  }
}

function portOn(port){
  if(port instanceof Array)
    return port.map(portOn)
  else {
    console.log('Opening GPIO', gpio[port])
    rpio.write(gpio[port], ON);
  }
}

function portOff(port){
  if(port instanceof Array)
    return port.map(portOff)
  else {
    console.log('Closing GPIO', gpio[port])
    rpio.write(gpio[port], OFF);
  }
}

clock();
setInterval(clock, 1 * 1000 * 60);

// always open ports
portOn('C')
portOn('AC1')
portOn('AC2')