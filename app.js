import Telegram from './telegram.js';
import Database from './database.js';
import Torrent from './torrent.js';

const db = new Database();
const tele = new Telegram('key', db);
const qbit = new Torrent("http://localhost:8080", db);

function loop()
{
    qbit.sync()
    .then(()=>{
        tele.processCommands();
    });
}

setInterval(loop, 1000);

