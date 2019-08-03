const config= require('./config/config');;

const boards=config.boards;
const logger=config.logger;
const downloadFile=config.utils.download;
const updateTracker=config.utils.updateTracker;
const getBoardName=config.utils.getBoardName;
const init=config.initialize
const dlTracker = require('./downloadTracking.json');


const puppeteer = require('puppeteer');

(async ()=>{
    logger.info('starting to run program')
    // for(ii=0;ii<boards.length;ii++){
    //     await getArchive(boards[ii])
    // };
    init();
    for(let board of boards){
        await getArchive(board);
    }
    logger.info('finished running program')
})()

async function getArchive(boardUrl) {
    //create board tracker if none exists
    logger.info(`running scrapper on boards ${boardUrl}`)
    if(!dlTracker[boardUrl]){
        logger.info(`created new tracker for board: ${boardUrl}`)
        dlTracker[boardUrl]={};
    }

    //launch browser
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    //goto catlog page of board
    await page.goto(`${boardUrl}/catalog`, { waitUntil: 'networkidle2' })
        .catch( (err)=>{
            logger.error(`error loading page ${boardUrl}. ${err}`)
        });
    await page.waitForSelector('.thread')
    .catch( (err)=>{
        logger.error(`could not find selector on  ${boardUrl}. ${err}`)
    });

    //get all threads on the page
    let threads = await page.$$('.thread');
    //loop over thread
    for (let j = 0; j < threads.length; j++) {
        //wait for page to load
        let threads = await page.$$('.thread');
        //get thread ID
        const propertyHandle = await threads[j].getProperty('id');
        const threadID = await propertyHandle.jsonValue();
        if(!dlTracker[boardUrl][threadID]){
            dlTracker[boardUrl][threadID]=0;
        }
        //go to thread page and wait for it to load
        let threadLink = await threads[j].$('a')
        await threadLink.click();
        await page.waitForNavigation({ waitUntil: 'load' });

        await page.$$('.replyContainer');

        
        let postsWAfile=await page.evaluate((lup)=>{
            let posts=Array.from(document.querySelectorAll('.replyContainer'))
           .filter(post=>{
                return(post.querySelector('.file'))
            })
           .filter(post=>{
                let postDate=parseInt(post.querySelector('.dateTime').dataset.utc);
                return(postDate>lup)
            })
           .map(post=>{
               return  post.querySelector('.file a').getAttribute('href')
            })
        
            if(posts.length>0){
                 return posts  
            }
            else{
                return undefined
            }
        },dlTracker[boardUrl][threadID]);

         console.log('after filtering, posts with a file:', postsWAfile)
         if(postsWAfile){
            for(let newPostWithAfile of postsWAfile){
                console.log('about to download file from ', newPostWithAfile);
                let boardName=getBoardName(boardUrl);
                try{
                    logger.info(`attemping to download from http:${newPostWithAfile}`);
                    await downloadFile(`http:${newPostWithAfile}`, `images/${boardName}`);
                    logger.info(`file downloaded succesfully: ${JSON.stringify(arguments)}`);
                    updateTracker(boardUrl ,threadID, Date.now());
                }
               catch(e){
                logger.error(`something went wrong in dowloading file ${url} to destination ${dest}: ${e}`)
               }
            }
         }
         else{
             logger.info(`no new posts in board ${boardUrl} in thread ${threadID}`)
         }
       
        await page.goBack();
        await page.waitForSelector('.thread');
    }
    //finished going thought all threads in catalog- close browser
    await browser.close();
}

