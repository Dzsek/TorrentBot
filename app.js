import Telegram from './telegram.js';
import Database from './database.js';
import Torrent from './torrent.js';
import fs from 'fs';

const credentials = JSON.parse(fs.readFileSync("credentials.json"));

const db = new Database();
const tele = new Telegram(credentials.apikey, db);
const qbit = new Torrent("http://localhost:8080", db);

function loop()
{
    qbit.sync()
    .then(()=>{
        tele.processCommands();
    });
}

setInterval(loop, 5000);

