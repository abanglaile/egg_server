const Service = require('egg').Service;

class TeacherService extends Service {

    async getSchoolTeacher(group_id){
        const teachers = await this.app.mysql.query(`select tr.*, u.realname 
         from teacher_group tr, users u where tr.stu_group_id = ? and tr.teacher_id = u.userid`, 
         [group_id]);
        return teachers;
    }

    async getOptionData(group_id){

        const teacher_option = this.getSchoolTeacher(group_id);
        const course_option = this.service.course.getCourseLabel();
        const label_option = this.service.lessonLabel.getSchoolLabel();
        const room_option = this.service.school.getSchoolRoom(group_id);
        return {
            teacher_option: await teacher_option,
            course_option: await course_option,
            label_option: await label_option,
            // test_option: await test_option,
            room_option: await room_option, 
        }
    }

    
}

module.exports = TeacherService;
 