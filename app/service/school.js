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

    async getTeacherList(schoolId){
        const results = await this.app.mysql.query(`select st.*,u.realname,u.avatar, 
            sg.group_name from school_teacher st,users u, teacher_group tg, school_group sg 
            where st.school_id = ? and st.teacher_id = u.userid and tg.teacher_id = st.teacher_id 
            and tg.stu_group_id = sg.stu_group_id;`, [schoolId]);

        var teacher_list = [];
        var teacher_index = [];
        var list_index = 0;
        for(var i = 0; i < results.length; i++){
            var e = results[i];
            const index = teacher_index[e.teacher_id];
            if(index >= 0){
                teacher_list[index].group.push({
                    group_id: e.stu_group_id,
                    group_name: e.group_name,
                });
            }else{
                var group = [];
                group.push({
                    group_id: e.stu_group_id,
                    group_name: e.group_name,
                });
                var teacher = {
                    teacher_id : e.teacher_id,
                    realname : e.realname,
                    avatar : e.avatar,
                    group : group,
                };

                teacher_list[list_index] = teacher;
                teacher_index[e.teacher_id] = list_index;
                list_index++;
            }

            return teacher_list;
        }
    }

}

module.exports = schoolService;
 