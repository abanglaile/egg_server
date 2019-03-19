const Service = require('egg').Service;

class TeacherService extends Service {

    async getSchoolTeacher(group_id){
        const teachers = await this.app.mysql.query(`select tr.*, u.realname 
         from teacher_group tr, users u where tr.stu_group_id = ? and tr.teacher_id = u.userid`, 
         [group_id]);
        return teachers;
    }
    

    async getSchoolTeacher2(teacher_id){
        const teachers = await this.app.mysql.query(`select tr.teacher_id, u.realname from 
        teacher_group tr, users u where tr.stu_group_id in(select stu_group_id from 
        teacher_group where teacher_id = "3044f0f040ba11e9ad2ca1607a4b5d90") and 
        tr.teacher_id = u.userid group by tr.teacher_id;`, 
        [teacher_id]);
        return teachers;
    }

    async getOptionData(teacher_id){

        const teacher_option = this.getSchoolTeacher2(teacher_id);
        const course_option = this.service.course.getCourseLabel();
        const label_option = this.service.lessonLabel.getSchoolLabel();
        const room_option = this.service.school.getSchoolRoom2(teacher_id);
        return {
            teacher_option: await teacher_option,
            course_option: await course_option,
            label_option: await label_option,
            room_option: await room_option, 
        }
    }
    
    async getLinkageOptionData(group_id){

        const teacher_link_option = this.getSchoolTeacher(group_id);
        // const course_option = this.service.course.getCourseLabel();
        // const label_option = this.service.lessonLabel.getSchoolLabel();
        const room_link_option = this.service.school.getSchoolRoom(group_id);
        return {
            teacher_link_option: await teacher_link_option,
            // course_option: await course_option,
            // label_option: await label_option,
            // test_option: await test_option,
            room_link_option: await room_link_option, 
        }
    }

    
}

module.exports = TeacherService;
 