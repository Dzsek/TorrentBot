import axios from 'axios';

export default class Telegram
{
    baseUrl = "https://api.telegram.org";
    url = "";
    fileurl = "";
    db = null;
    queued = null;

    constructor(apiKey, database)
    {
        this.url = `${this.baseUrl}/bot${apiKey}`;
        this.fileurl = `${this.baseUrl}/file/bot${apiKey}`;
        this.db = database;
    }

    processCommands(){
		const lasti = this.db.get('lastid');
        const request = `${this.url}/getupdates?offset=${lasti+1}`;
        return axios.get(request)
            .then(resp=>{
                let lastupd = this.db.get('lastupdate');

                for(let up of resp.data.result)
                {
                    if(up.message && up.message.date>lastupd)
                    {
                        this.processMsg(up.message);
                        this.db.update({lastupdate: up.message.date});
						this.db.update({lastid: up.update_id});
                        this.db.save();
                    }
                }
            })
            .catch(err=>{
                console.log(err);
            });
    }

    processMsg(msg)
    {
        if(msg.text)
        {
            if(msg.text.startsWith('/add'))
            {
                this.queued = null;
                const splitstr = msg.text.split(' ');
                if(splitstr.length==2)
                {
                    const torrent = splitstr[1];
                    const list = this.db.get('toadd');
                    if(!list.includes(torrent))
                    {
                        list.push(torrent);
                        this.db.update({toadd: list});
                        this.db.save();
                        console.log("Added ", torrent)
                    }
                }
            }
            else if(msg.text.startsWith('/list'))
            {
                this.queued = null;
                const userid = msg.chat.id;
                const list = this.db.get('torrents');
                const request = `${this.url}/sendMessage`;
                
                for(let t of list)
                {
                    const textresp= `[${(t.progress*100).toFixed(1)}%] ${t.name}`;
                    axios.post(request, {chat_id:userid, text: textresp});
                    console.log("listing torrents");
                }
            }
            else if(msg.text=='/rm yes')
            {
                const queue = this.db.get('todelete');
                if(!queue.includes(this.queued.hash))
                {
                    this.db.update({todelete: [...queue, this.queued.hash]});
                    this.db.save();
                }

                this.queued = null;
            }
            else if(msg.text.startsWith('/rm'))
            {
                this.queued = null;
                const userid = msg.chat.id;
                const request = `${this.url}/sendMessage`;

                const param = msg.text.substr(3);
                if(!param)
                {
                    const userid = msg.chat.id;
                    const list = this.db.get('torrents');
                    const keyb = {keyboard: [], one_time_keyboard:true};
                    for(let t of list)
                    {
                        keyb.keyboard.push([{text: `/rm ${t.name}`}]);
                    }
                    
                    axios.post(request, {chat_id:userid, text: "What do you want removed?", reply_markup: keyb});
                    console.log("sent rm keyboard")
                }
                else
                {
                    const list = this.db.get('torrents');
                    const todel = list.find(x=>x.name == param.trim());
                    if(todel)
                    {
                        this.queued = todel;
                    }

                    axios.post(request, {chat_id:userid, text: `Confirm to remove ${param} /rm yes`, reply_markup: {remove_keyboard:true}});
                    console.log("Confirm to remove ", param);
                }
            }
        }
    }
}
