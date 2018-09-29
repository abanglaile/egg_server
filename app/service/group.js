const Service = require('egg').Service;

class GroupService extends Service {

    async getClassGroup(teacher_id){
        const name = await this.app.mysql.select('teacher_group',{ 
            where : { teacher_id : teacher_id }, 
        });
        return name;
    }

    async getGroupData(stu_group_id){
        const group = await this.app.mysql.select('group_student',{ 
            where : {stu_group_id : stu_group_id },
        });
        return group;
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
        const res = await this.app.mysql.query(`select g.student_name,t.group_name 
        from group_student g,teacher_group t where t.stu_group_id=g.stu_group_id and g.student_id = ?;`, student_id);

        return res;
    } 
    
}

module.exports = GroupService;
 