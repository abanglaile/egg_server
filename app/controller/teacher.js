'use strict'

const Controller = require('egg').Controller;

class TeacherController extends Controller {

    async getUserInfo(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.userid){
            const results = await service.user.getUserInfo(query.userid);
            
            this.ctx.body = results;
        }
    }

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

    async getTaskTable(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.task.getTaskTable(query.teacher_id);
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

    async deleteOneTask(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.taskid){
            const results = await service.task.deleteOneTask(body.taskid);
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

    async copyTest(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.test_id){
            const results = await service.test.copyTest(body.teacher_id, body.test_id, body.copy_name);
            this.ctx.body = results;
        }
    }

    async getClassGroup(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.group.getClassGroup(query.teacher_id);
        this.ctx.body = results;
    }

    async getStudentGroup(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.group.getStudentGroup(query.teacher_id);
        this.ctx.body = results;
    }
    
    async getGroupData(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.group.getGroupData(query.stu_group_id);
        this.ctx.body = results;
    }

    async getLessonStudent(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.lesson.getLessonStudent(query.lesson_id);
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

    async signLesson() {
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.lesson_id){
            const results = await service.lesson.signLesson(body.lesson_id);
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
        this.ctx.body = results[0];
    }

    async getTaskInfoById(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.task.getTaskInfoById(query.task_id);
        this.ctx.body = results;
    }

    async getTeacherTest(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.test.getTeacherTest(query.test_id);
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

    async getTaskResultInfo(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.task.getTaskResultInfo(query.task_id);
        this.ctx.body = results;
    }

    async getTeacherLesson(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.getTeacherLesson(body.teacher_id, body.filter_option);
        this.ctx.body = results;
    }

    async getOptionData(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.teacher.getOptionData(query.teacher_id);
        this.ctx.body = results;
    }
    
    async getLinkageOptionData(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.teacher.getLinkageOptionData(query.group_id);
        this.ctx.body = results;
    }

    async searchPfLabel(){
        const {ctx, service} = this;
        const {query} = ctx.request;
        const search_res = await service.comment.searchPfLabel(query.input);
        this.ctx.body = search_res;
    }

    async searchKpLabel(){
        const {ctx, service} = this;
        const {query} = ctx.request;
        const search_res = await service.bookchapter.searchKp(query.input);
        this.ctx.body = search_res;
    }

    async searchTaskSource(){
        const {ctx, service} = this;
        const {query} = ctx.request;
        const task_source = await service.task.searchTaskSource(query.input);
        this.ctx.body = task_source;
    }

    async searchTeacherTask(){
        const {ctx, service} = this;
        const {query} = ctx.request;
        const task_source = await service.task.searchTeacherTask(query.teacher_id, query.input);
        this.ctx.body = task_source;
    }

    async getStudentOneLesson(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.lesson.getStudentOneLesson(query.lesson_id, query.student_id);
        this.ctx.body = results;
    }

    async getOneLesson(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.lesson.getOneLesson(query.lesson_id);
        this.ctx.body = results;
    }

    async accLessonAward(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.lesson.accLessonAward(query.lesson_id);
        this.ctx.body = results;
    }
    
    async deleteOneLesson(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.deleteOneLesson(body.lesson_id);
        this.ctx.body = results;
    }

    async getLessonPfComment(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.getLessonPfComment(body.lesson_id);
        ctx.body = results;
    }

    async addLessonPfComment(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.addLessonPfComment(body.lesson_id, body.select_student, body.pf_comment);
        ctx.body = results;
    }

    async deleteLessonPfComment(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.deleteLessonPfComment(body.lesson_id, body.comment_id);
        ctx.body = results;
    }

    async getLessonKpComment(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.getLessonKpComment(body.lesson_id);
        ctx.body = results;
    }

    async addLessonKpComment(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.addLessonKpComment(body.lesson_id, body.select_student, body.kp_comment);
        ctx.body = results;
    }

    async deleteLessonKpComment(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.deleteLessonKpComment(body.lesson_id, body.comment_id);
        ctx.body = results;
    }

    async updatePfComment(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.comment.updatePfComment(body.pf_comment, body.comment_id);
        ctx.body = results;
    }

    async updateKpComment(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.comment.updateKpComment(body.kp_comment, body.comment_id);
        ctx.body = results;
    }

    async addHomework(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.addHomework(body.lesson_id, body.task, body.users);
        ctx.body = results;
    }

    async relateHomework(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.relateHomework(body.lesson_id, body.task_id, body.users);
        ctx.body = results;
    }

    async deleteHomework(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.deleteHomework(body.lesson_id, body.task_id, body.users);
        ctx.body = results;
    }

    async addLessonContent(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.addLessonContent(body.lesson_content);
        ctx.body = results;
    }

    async addLessonAward(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.addLessonAward(body.lesson_id);
        ctx.body = results;
    }

    async deleteLessonContent(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.deleteLessonContent(body.lesson_content);
        ctx.body = results;
    }

    // async addLessonContent(){
    //     const { ctx, service } = this;
    //     const {body} = ctx.request;
    //     const results = await service.lesson.addLessonContent(body.lesson_content);
    //     ctx.body = results;
    // }

    // async updateLessonContent(){
    //     const { ctx, service } = this;
    //     const {body} = ctx.request;
    //     const results = await service.lesson.updateLessonContent(body.lesson_content);
    //     ctx.body = results;
    // }

    async updateLessonTeacher(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.updateLessonTeacher(body.lesson_id, body.teacher_id);
        ctx.body = results;
    }

    async updateLessonAssistant(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.updateLessonAssistant(body.lesson_id, body.assistant_id);
        ctx.body = results;
    }

    // async updateLessonGroup(){
    //     const { ctx, service } = this;
    //     const {body} = ctx.request;
    //     const results = await service.lesson.updateLessonGroup(body.lesson_id, body.group_id);
    //     ctx.body = results;
    // }

    // async updateLessonCourse(){
    //     const { ctx, service } = this;
    //     const {body} = ctx.request;
    //     const results = await service.lesson.updateLessonCourse(body.lesson_id, body.course_label);
    //     ctx.body = results;
    // }

    async updateLessonRange(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.updateLessonRange(body.lesson_id, body.start_time, body.end_time);
        ctx.body = results;
    }

    // async updateLessonLabel(){
    //     const { ctx, service } = this;
    //     const {body} = ctx.request;
    //     const results = await service.lesson.updateLessonLabel(body.lesson_id, body.label_id);
    //     ctx.body = results;
    // }

    async addNewLesson(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.addNewLesson(body.lesson);
        ctx.body = results; 
    }

    async getStuInfoById(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.group.getStuInfoById(query.student_id);
        this.ctx.body = results;
    }

    async setVerifyRes(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.task.setVerifyRes(body.verifyState,
                         body.comment,body.taskid,body.teacher_id,body.student_id);
        this.ctx.body = results;   
    }

    async distributeNewHomeWork(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.task.assignTask(body.task, body.students);
        this.ctx.body = results;
    }

    //查询做题步骤分析
    async getStuTestStepAnalysis(){
        const {ctx, service } = this;
        const {query} = ctx.request;
        // console.log(query);
        
        if(query.student_id){
            const results = await service.exerciseLog.getStuTestStepAnalysis(query.student_id,query.test_id);
            // console.log(results);
            this.ctx.body=results;
        }
    }

    async getStuTestSurvey(){
        const {ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.testLog.getStuTestSurvey(query.student_id,query.test_id);
            this.ctx.body=results;
        }
    }

    async getSchool(){
        const {ctx, service } = this;
        const {query} = ctx.request;
        if(query.teacher_id){
            const results = await service.school.getSchool(query.teacher_id);
            this.ctx.body=results;
        }
    }

    async getStudentList(){
        const {ctx, service } = this;
        const {query} = ctx.request;
        if(query.teacher_id){
            const results = await service.group.getStudentList(query.teacher_id);
            this.ctx.body=results;
        }
    } 

    async getStuPfCommentList(){
        const {ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.comment.getStuPfCommentList(query.student_id);
            this.ctx.body=results;
        }
    }

    async getStuKpCommentList(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.comment.getStuKpCommentList(body.student_id, body.filter_option);
        this.ctx.body = results;
    }
    
    async getStuCourse(){
        const {ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.course.getStuCourse(query.student_id);
            this.ctx.body=results;
        }
    }
}

module.exports = TeacherController;
