const Service = require('egg').Service;
const uuid = require('uuid');

class LessonService extends Service {

    async getTeacherLesson(teacher_id, start_time, end_time, stu_group_id){
        let query = `select l.*, u.nickname, r.room_name, g.group_name, 
            ll.label_name, lc.course_label_name from lesson l, users u, 
            course_label lc,school_room r, school_group g, 
            lesson_label ll where l.teacher_id = u.userid and 
            lc.course_label = l.course_label and 
            l.stu_group_id = g.stu_group_id and l.label_id = ll.label_id`;
        let params = [];

        if(teacher_id){
            query += ' and l.teacher_id = ?';
            params.push(teacher_id);
        }
        if(start_time){
            query += ' and l.start_time >= ?';
            params.push(start_time);
        }
        if(end_time){
            query += ' and l.end_time <= ?';
            params.push(end_time);
        }
        if(stu_group_id){
            query += ' and l.stu_group_id = ?';
            params.push(stu_group_id);
        }

        query += ' order by l.end_time desc;';

        const lesson_list = await this.app.mysql.query(query, params);
        return lesson_list;
    }

    async getOneLesson(lesson_id){
        let lesson = await this.app.mysql.query(`select l.*, r.room_name, g.group_name, l.course_label, ll.label_name
            from lesson l, school_room r, school_group g, lesson_label ll 
            where l.lesson_id = ? and l.stu_group_id = g.stu_group_id and l.label_id = ll.label_id`, 
            [lesson_id]);
        lesson = lesson[0];
        let lesson_content = this.getLessonContent(lesson_id);
        let lesson_teacher = this.getLessonTeacher(lesson_id);
        let homework = this.getHomework(lesson_id);
        let lesson_student = this.service.group.getGroupData(lesson.stu_group_id);
        let teacher_comment = this.getTeacherComment(lesson_id);
        lesson.lesson_teacher = await lesson_teacher;
        lesson.homework = await homework;
        lesson.lesson_content = await lesson_content;
        lesson.lesson_student = await lesson_student;
        lesson.teacher_comment = await teacher_comment;
        return lesson;
    }

    async getHomework(lesson_id){
        return await this.app.mysql.select('homework', {lesson_id: lesson_id});
    }

    async addHomework(homework){
        homework.homework_id = uuid.v1();
        const iret = await this.app.mysql.insert('homework', homework);
        return await this.getHomework(homework.lesson_id);
    }

    async updateHomework(homework){
        const iret = await this.app.mysql.update('homework', homework, {where: {homework_id: homework.homework_id}});
        return await this.getHomework(getHomework.lesson_id);
    }

    async deleteHomework(homework){
        const iret = await this.app.mysql.delete('homework', {homework_id: homework.homework_id});
        return await this.getHomework(getHomework.lesson_id);
    }

    async getTeacherComment(lesson_id){
        return await this.app.mysql.select('teacher_comment', {lesson_id: lesson_id});
    }

    async addTeacherComment(label_id, label_type, teacher_comment){
        teacher_comment.comment_id = uuid.v1();
        let ret = await this.app.mysql.insert('teacher_comment', teacher_comment);
        //TO-DO：插入Tweet
        return await this.getTeacherComment(teacher_comment.lesson_id);
    }

    async deleteTeacherComment(comment_id, lesson_id){
        let ret = await this.app.mysql.delete('teacher_comment', comment_id);
        //TO-DO：删除Tweet
        return await this.getTeacherComment(teacher_comment.lesson_id);
    }

    async getLessonContent(lesson_id){
        const lesson_content = await this.app.mysql.select('lesson_content',
            {where: {lesson_id: lesson_id}});
        return lesson_content;
    }

    async getLessonTeacher(lesson_id){
        const lesson_teacher = await this.app.mysql.query(
        `select lt.*, u.realname from lesson_teacher lt, users u 
            where lt.lesson_id = ? and lt.teacher_id = u.userid`, [lesson_id]);
        return lesson_teacher;
    }

    async addNewLesson(lesson){
        const lesson_teacher = lesson;
        delete lesson.lesson_teacher;
        const ret = await this.app.mysql.insert('lesson', lesson);
        const iret = await this.app.mysql.insert('lesson_teacher', lesson_teacher);
        return ret;
    }

    async addLessonContent(lesson_content){
        lesson_content.lesson_content_id = uuid.v1();
        const iret = await this.app.mysql.insert('lesson_content', lesson_content);
        return await this.getLessonContent(lesson_content.lesson_id);
    }

    async updateLessonContent(lesson_content){
        const iret = await this.app.mysql.update('lesson_content', lesson_content, {where: {lesson_content_id: lesson_content.lesson_content_id}});
        return await this.getLessonContent(lesson_content.lesson_id);
    }

    async deleteLessonContent(lesson_content){
        const iret = await this.app.mysql.delete('lesson_content', {lesson_content_id: lesson_content.lesson_content_id});
        return await this.getLessonContent(lesson_content.lesson_id);
    }

    async updateLessonTeacher(lesson_id, lesson_teacher){
        const dret = await this.app.mysql.delete('lesson_teacher', {
            lesson_id: lesson_id
        })
        const iret = await this.app.mysql.insert('lesson_teacher', lesson_teacher);
        return await this.getLessonTeacher(lesson_id);
    }

    async updateLessonGroup(lesson_id, stu_group_id){
        const group = await this.app.mysql.get('school_group', {stu_group_id: stu_group_id});
        const uret = await this.app.mysql.update('lesson', {stu_group_id: stu_group_id, course_id: group.course_id}, {
                where: {lesson_id: lesson_id}
            });
        return await this.getOneLesson(lesson_id);
    }

    async updateLessonRange(lesson_id, start_time, end_time){
        const uret = await this.app.mysql.update('lesson', {
            start_time: start_time,
            end_time: end_time,
        },{where: {lesson_id: lesson_id}})
        return uret;
    }

    async updateLessonCourse(lesson_id, course_label){
        const uret = await this.app.mysql.update('lesson', {course_label: course_label},
            {where: {lesson_id: lesson_id}})
        return uret;
    }

    async updateLessonLabel(lesson_id, label_id){
        const uret = await this.app.mysql.update('lesson', {label_id: label_id},
            {where: {lesson_id: lesson_id}});
        return uret; 
    }
    
}

module.exports = LessonService;
 