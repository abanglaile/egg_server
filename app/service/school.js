const Service = require('egg').Service;

class schoolService extends Service {
    async getSchoolRoom(group_id) {
        const results = await this.app.mysql.query(`select sr.* from school_room sr ,
        school_group sg where sr.school_id=sg.school_id and sg.stu_group_id = ?;`, [group_id]);
        return results;
    }

}

module.exports = schoolService;
 