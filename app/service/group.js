const Service = require('egg').Service;

class GroupService extends Service {

    async getClassGroup(teacher_id){
        const res = await this.app.mysql.query(`select t.stu_group_id, s.group_name from 
        teacher_group t,school_group s where t.teacher_id = ? and s.stu_group_id = t.stu_group_id;`, teacher_id);
        return res;
    }

    async getGroupData(stu_group_id){
        const res = await this.app.mysql.query(`select g.student_id, u.realname from group_student g,
        users u where u.userid = g.student_id and g.stu_group_id = ?;`, stu_group_id);
        return res;
    }

    async addNewGroup(teacher_id,group_name){
        const addres = await this.app.mysql.insert('teacher_group',{ teacher_id: teacher_id, group_name:group_name});
        return addres.insertId;
    }

    async deleteOneGroup(stu_group_id){
        const del1 = await this.app.mysql.delete('teacher_group', {
            stu_group_id: stu_group_id,
        });
        const del2 = await this.app.mysql.delete('group_student', {
            stu_group_id: stu_group_id,
        });
        return del2;
    }

    async deleteOneStudent(student_id){
        const del = await this.app.mysql.delete('group_student', {
            student_id: student_id,
        });
        return del;
    }

    async addOneStudent(body){
        const addres = await this.app.mysql.insert('group_student',{ 
            student_name: body.student_name,
            student_id:body.student_id,
            phone_num: body.phone_num,
            stu_group_id:body.stu_group_id,
        });
        return addres.insertId;
    }

    async getStuInfoById(student_id){
        const res = await this.app.mysql.query(`select u.realname,s.group_name from users u,
        school_group s,group_student g where g.stu_group_id=s.stu_group_id and u.userid = g.student_id and u.userid = ?;`, student_id);

        return res;
    } 
    
}

module.exports = GroupService;
 