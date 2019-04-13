const Service = require('egg').Service;

class schoolService extends Service {
    async getSchoolRoom(group_id) {
        const results = await this.app.mysql.query(`select sr.* from school_room sr ,
        school_group sg where sr.school_id=sg.school_id and sg.stu_group_id = ?;`, [group_id]);
        return results;
    }

    async getSchoolRoom2(teacher_id) {
        const results = await this.app.mysql.query(`select * from school_room where school_id 
        in (select school_id from school_teacher st where st.teacher_id = ?);`, [teacher_id]);
        return results;
    }

    async getSchool(teacher_id){
        const results = await this.app.mysql.query(`select s.* from school_teacher st,
            school s where st.teacher_id = ? and st.school_id = s.school_id;`, [teacher_id]);
        return results;
    }

}

module.exports = schoolService;
 