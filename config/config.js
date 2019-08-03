const download = require('image-downloader');
const winston= require('winston');
const fs=require('fs');
const dlTracker=require('../downloadTracking.json')

module.exports.boards=[
    'http://boards.4chan.org/hm/',
    'http://boards.4chan.org/s/',
    'http://boards.4chan.org/hc/',
    'http://boards.4chan.org/h/',
    'http://boards.4chan.org/e/',
    'http://boards.4chan.org/u/',
    'http://boards.4chan.org/d/',
    'http://boards.4chan.org/y/',
    'http://boards.4chan.org/hr/',
    'http://boards.4chan.org/aco/',
 ];




module.exports.utils={
      download: async function downloadFile(url, dest) {
        console.log('trying to download file' , url , 'to', dest)
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
          };
        try {
            const { filename, image } = await download.image({ url: url, dest: dest })
        } catch (e) {
            throw e;
        }
    },
    updateTracker: async function updateTracker(board,threadId,lastUpdate) {
        dlTracker[board][threadId] = lastUpdate;
        data = JSON.stringify(dlTracker);
        fs.writeFileSync('downloadTracking.json', data)
    },
    getBoardName: function getBoardName(url){
        let start=url.lastIndexOf('/',url.length-2);
        return url.substring(start+1,url.length-1)
    }
  }

  module.exports.logger =winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(), 
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log', 'timestamp':true })
    ]
  });

  module.exports.initialize=  ()=>{
      if(!fs.existsSync('logs')){
        fs.mkdirSync('logs')
      };
      if(!fs.existsSync('images')){
          fs.mkdirSync('images')
      };
      if(!fs.existsSync('downloadTracking.json')){
          fs.writeFileSync('downloadTracking.json',{})
      }
  }