const Service = require('egg').Service;
const promise = require('bluebird');
const exec = require('node-cmd');
var fs = require("fs");
// var cmdStr = `"D:\\Program Files (x86)\\LilyPond\\usr\\bin\\lilypond" -fpng -o D:\\www\\kpmanager\\img\\test D:\\Github\\egg_server\\test.ly`;
var cmdStr = `lilypond -fpng -o /usr/local/www/kpmanager/img/test /usr/local/server/egg_server/test.ly`;


const execAsync = promise.promisify(exec.get, { multiArgs: true, context: exec });
class lilyService extends Service {
    async renderly(text) {
        await fs.writeFileSync('test.ly', text);
        const stdout = await execAsync(cmdStr);
        return {
            log: stdout,
            url: "http://119.23.41.237/kpmanager/img/test.png?t=" + new Date().getTime(),
        }
    }

    async getTestly(){
        const code = await fs.readFileSync('test.ly', 'utf-8');
        return code;
    }
}

module.exports = lilyService;
 