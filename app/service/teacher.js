const Service = require('egg').Service;

class TeacherService extends Service {

    async getSchoolTeacher(school_id){
        const teachers = await this.app.mysql.query(`select st.*, u.realname 
         from school_teacher st, users u where st.school_id = ? and st.teacher_id = u.userid`, 
         [school_id]);
        return teachers;
    }

    async getOptionData(teacher_id, school_id){
        const teacher_option = this.getSchoolTeacher(school_id);
        const course_option = this.service.course.getSchoolCourse();
        const label_option = this.service.lessonLabel.getSchoolLabel();
        return {
            teacher_option: await teacher_option,
            course_option: await course_option,
            label_option: await label_option,
        }
    }

    
}

module.exports = TeacherService;
 