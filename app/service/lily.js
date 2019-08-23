const Service = require('egg').Service;
const promise = require('bluebird');
const exec = require('node-cmd');
var fs = require("fs");
// var cmdStr = `"D:\\Program Files (x86)\\LilyPond\\usr\\bin\\lilypond" -fpng -o D:\\www\\kpmanager\\img\\test D:\\Github\\egg_server\\test.ly`;
var cmdStr = `"C:\\Program Files (x86)\\LilyPond\\usr\\bin\\lilypond" -fpng -o C:\\Users\\Administrator\\Documents\\GitHub\\kpmanager\\img\\test C:\\Users\\Administrator\\Documents\\GitHub\\egg_server\\test.ly`;
// var cmdStr = `lilypond -fpng -o /usr/local/www/kpmanager/img/test /usr/local/server/egg_server/test.ly`;
var cmdMidiStr = 'timidity /usr/local/www/kpmanager/img/test.midi -Ow -o - | lame - -b 64 /usr/local/www/kpmanager/img/test.wav';

const execAsync = promise.promisify(exec.get, { multiArgs: true, context: exec });
class lilyService extends Service {
    async renderly(text) {
        await fs.writeFileSync('test.ly', text);
        const stdout = await execAsync(cmdStr);
        var isMidi = false;
        // let t1 = await fs.statSync('/usr/local/www/kpmanager/img/test.midi');
        // // console.log('t1:',t1.ctime);
        // let t2 = await fs.statSync ('/usr/local/www/kpmanager/img/test.png');
        // // console.log('t2:',t2.ctime);
        // if((t2.ctime.getTime() - t1.ctime.getTime()) < 1000){
        //     isMidi = true;
        // }
        if(isMidi){
            await execAsync(cmdMidiStr);
            return {
                log: stdout,
                url: "http://119.23.41.237/kpmanager/img/test.png?t=" + new Date().getTime(),
                wavUrl: "http://119.23.41.237/kpmanager/img/test.wav?t=" + new Date().getTime(),
            }
        }else{
            return {
                log: stdout,
                url: "http://119.23.41.237/kpmanager/img/test.png?t=" + new Date().getTime(),
                wavUrl: '',
            }
        }
    }

    async getTestly(){
        const code = await fs.readFileSync('test.ly', 'utf-8');
        return code;
    }
}

module.exports = lilyService;
 