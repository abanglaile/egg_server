const Service = require('egg').Service;

class schoolService extends Service {
    async getSchoolRoom(school_id) {
        return await this.app.mysql.select('school_room', {
            where: {school_id: school_id},
        })
    }

}

module.exports = schoolService;
 