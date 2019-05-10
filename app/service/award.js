const Service = require('egg').Service;

class AwardService extends Service {
    async addAward(student_award){
        const ret = await this.app.mysql.insert("award_log", student_award)
    }

}

module.exports = AwardService;
 