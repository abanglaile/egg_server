const Service = require('egg').Service;
const uuid = require('uuid');

class AwardService extends Service {
    async addAward(award){
        award.award_id = uuid.v1();
        const ret = await this.app.mysql.insert("award_log", student_award);
        return award;
    }

}

module.exports = AwardService;
 