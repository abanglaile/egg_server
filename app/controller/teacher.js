'use strict'

const Controller = require('egg').Controller;

class TeacherController extends Controller {

    async getTestStatus(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.test_id){
            const results = await service.testLog.getTestStatus(body.test_id);
            console.log(results);
            
            this.ctx.body = results;
        }
    }

    async getTestTable(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.test.getTestTable(query.teacher_id);
        this.ctx.body = results;
    }
    
    async addNewTest(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        // console.log("body",JSON.stringify(body));
        if(body.test_name){
            const results = await service.test.addNewTest(body);
            this.ctx.body = results;
        }
    }

    async deleteOneTest(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.test_id){
            const results = await service.test.deleteOneTest(body.test_id);
            this.ctx.body = results;
        }
    }

    async distributeTest(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.test_id){
            const results = await service.test.distributeTest(body.test_id,body.keys);
            this.ctx.body = results;
        }
    }

    async getClassGroup(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.group.getClassGroup(query.teacher_id);
        this.ctx.body = results;
    }
    
    async getGroupData(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.group.getGroupData(query.stu_group_id);
        this.ctx.body = results;
    }

    async addNewGroup(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.teacher_id){
            const results = await service.group.addNewGroup(body.teacher_id,body.group_name);
            this.ctx.body = results;
        }
    }

    async deleteOneGroup(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.stu_group_id){
            const results = await service.group.deleteOneGroup(body.stu_group_id);
            this.ctx.body = results;
        }
    }

    async deleteOneStudent(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.student_id){
            const results = await service.group.deleteOneStudent(body.student_id);
            this.ctx.body = results;
        }
    }
    
    async addOneStudent(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.student_id){
            const results = await service.group.addOneStudent(body);
            this.ctx.body = results;
        }
    }
    
    async getBookChapter(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.bookchapter.getBookChapter(query.course_id);
        this.ctx.body = results;
    }
    
    async getChapterKp(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.bookchapter.getChapterKp(query.chapter_id);
        this.ctx.body = results;
    }

    async getTestDetail(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.testLog.getTestDetail(query.test_id);
        this.ctx.body = results;
    }
    
    async getTestInfoById(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.test.getTestInfoById(query.test_id);
        this.ctx.body = results;
    }

    async getTestKpResult(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.testLog.getTestKpResult(query.test_id);
        this.ctx.body = results;
    }
    
    async getTestResultInfo(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.testLog.getTestResultInfo(query.test_id);
        this.ctx.body = results;
    }

    async getTeacherLesson(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.lesson.getTeacherLesson(query.teacher_id, query.start_time, query.end_time, query.stu_group_id);
        this.ctx.body = results;
    }

    async getOptionData(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.teacher.getOptionData(query.teacher_id, query.school_id);
        this.ctx.body = results;
    }

    async getOneLesson(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.lesson.getOneLesson(query.lesson_id);
        this.ctx.body = results;
    }

    async addLessonContent(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.addLessonContent(body.lesson_content);
        ctx.body = results;
    }

    async updateLessonContent(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.updateLessonContent(body.lesson_content);
        ctx.body = results;
    }

    async updateLessonTeacher(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.updateLessonTeacher(body.lesson_id, body.lesson_teacher);
        ctx.body = results;
    }

    async updateLessonGroup(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.updateLessonGroup(body.lesson_id, body.group_id);
        ctx.body = results;
    }

    async updateLessonCourse(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.updateLessonCourse(body.lesson_id, body.course_label);
        ctx.body = results;
    }

    async updateLessonRange(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.updateLessonRange(body.lesson_id, body.start_time, body.end_time);
        ctx.body = results;
    }

    async updateLessonLabel(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.updateLessonLabel(body.lesson_id, body.label_id);
        ctx.body = results;
    }

    async getStuInfoById(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.group.getStuInfoById(query.student_id);
        this.ctx.body = results;
    }
    
}

module.exports = TeacherController;
