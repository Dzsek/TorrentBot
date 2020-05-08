import axios from 'axios';
import qs from 'qs';

export default class Torrent{

    url = "";
    sessionid = null;
    db = null;

    constructor(url, db)
    {
        this.url = url;
        this.db = db;
    }

    sync()
    {
        return this.addQueuedTorrents().then(()=>{
            this.deleteQueuedTorrents().then(()=>{
                this.syncTorrentsList();
            });
        });
    }

    addQueuedTorrents()
    {
        const add = this.db.get('toadd');
        if(add.length > 0)
        {
            const urls = add.map(x=>x.replace('&','%26')).join('%0A');
            
            const options = {
                headers: {'content-type': 'application/x-www-form-urlencoded;charset=utf-8'}
            }
            
            const body = `urls=${urls}`;
            return axios.post(`${this.url}/command/download`, body, options).then((resp)=>{
                if(resp.status == 200)
				{
					this.db.update({toadd: []});
					this.db.save();
					console.log("Added ", add.length, " torrents");
				}
				else
				{
					return Promise.resolve();
				}
            });
        }
        else
        {
            return Promise.resolve();
        }
    }

    deleteQueuedTorrents()
    {
        const del = this.db.get('todelete');
        if(del.length > 0)
        {
            const urls = del.join('|');
            
            const options = {
                headers: {'content-type': 'application/x-www-form-urlencoded;charset=utf-8'}
            }
            
            const body = `hashes=${urls}`;
            return axios.post(`${this.url}/command/deletePerm`, body, options).then((resp)=>{
				if(resp.status == 200)
				{
					this.db.update({todelete: []});
					this.db.save();
					console.log("Deleted ", del.length, " torrents");
				}
				else
				{
					return Promise.resolve();
				}
            });
        }
        else
        {
            return Promise.resolve();
        }
    }
    
    syncTorrentsList()
    {
        let req = Promise.resolve();
        if(!this.sessionid)
        {
            req = axios.get(`${this.url}/login`, {responseType: 'text'})
                    .then(resp=>{
                        if(resp.status==200)
                        {
                            this.sessionid = resp.headers['set-cookie'];
                            console.log('Logged in ', this.sessionid);
                        }
                    });
        }

        return req.then(()=>{
            const ck = this.sessionid.join('; ');
            axios.get(`${this.url}/query/torrents`, {headers: {Cookie: ck}})
                .then(resp=>{
                    this.db.update({torrents: resp.data});
                    this.db.save();
                });
        });
    }
}