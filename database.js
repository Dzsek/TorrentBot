import fs from 'fs';

export default class Database
{
    file = './data.json';

    data = {
        lastupdate:1588943802,
        toadd: [],
        torrents: [],
        todelete: [],
		lastid : 0
    };

    constructor()
    {
        if(!fs.existsSync(this.file))
        {
            fs.writeFileSync(this.file, JSON.stringify(this.data));
        }

        const read =  JSON.parse(fs.readFileSync(this.file));
        this.data = {...this.data, ...read};
    }

    update(update)
    {
        this.data = {...this.data, ...update}
    }

    get(prop)
    {
        return this.data[prop];
    }

    save()
    {
        if(!fs.existsSync(this.file))
        {
            fs.writeFileSync(this.file, JSON.stringify(this.data));
        }

        fs.writeFileSync(this.file, JSON.stringify(this.data));
    }
}