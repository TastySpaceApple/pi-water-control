const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const fs = require('fs')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let program = require('./program.json');

app.post('/save', (req, res) => {
  writeFile("code.txt", req.body.code);
  writeFile("program.json", JSON.stringify(req.body.compiled));
  program = req.body.compiled;
  res.json({success:true})
})

app.get('/load', (req, res) => {
  const data = fs.readFileSync('./code.txt')
  res.send(data);
})

const writeFile = (filename, content) => {
  try {
    fs.writeFileSync(filename, content);
  } catch (err) {
    console.error(err);
  }
}

app.use('/', express.static('static'))

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
  'C': 2,
  'AC1': 3,
  'AC2': 4,
  'M': 14,
  4: 15,
  3: 18,
  2: 23,
  1: 24
}

async function runCommand(commandType, parameters){
  switch(commandType){
    case 'open':
      const port = parameters[0];
      const [hours, minutes] = parameters[1];
      openPort(port)
      await waitTime(hours * 3600 * 1000 + minutes * 60 * 1000 / 100)
      closePort(port)
      break;
  }
}

function openPort(port){
  if(port instanceof Array)
    return port.map(openPort)
  else
    console.log('Opening GPIO', gpio[port])
}

function closePort(port){
  if(port instanceof Array)
    return port.map(openPort)
  else
    console.log('Closing GPIO', gpio[port])
}

clock();
setInterval(clock, 1 * 1000 * 60);