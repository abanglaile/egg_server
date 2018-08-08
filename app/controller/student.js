'use strict'

const Controller = require('egg').Controller;

class StudentController extends Controller {

    async getMyStudentRating(){
        const { ctx, service } = this;
        const results = await service.rating.getStudentRating(ctx.request.query.student_id, ctx.request.query.course_id);
        console.log(results);
        this.ctx.body = results[0];
    }

    async getKpRatingHistory(){
        const { ctx, service } = this;
        const results = await service.rating.getKpRatingHistory(ctx.request.query.student_id, ctx.request.query.kpid);
        this.ctx.body = results;
    }

    async getKpAbility(){
        const {ctx, service} = this;
        const results = await service.rating.getKpAbility(ctx.request.query.student_id, ctx.request.query.kpid);
        this.ctx.body = results;
    }

    async getCourseBook(){
        const { ctx, service } = this;
        const results = await service.book.getCourseBook(ctx.request.query.course_id);
        this.ctx.body = results;
    }

    async getMyBookChapter(){
        const { ctx, service } = this;
        const {query} = ctx.request;

        const results = await service.rating.getMyBookChapter(query.student_id, query.course_id);
        console.log(results);
        
        this.ctx.body = results;
    }

    async getChapterName(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.bookchapter.getChapterName(query.chapter_id);
        console.log(results);
        
        this.ctx.body = results[0];
    }

    async getChapterStatus(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.status.getChapterStatus(query.student_id, query.chapter_id);
        console.log(results);
        
        this.ctx.body = results[0];
    }

    async getChapterKpStatus(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.rating.getChapterKpStatus(query.student_id,query.chapter_id);
        console.log(results);
        
        this.ctx.body = results;
    }

    // async getExerciseByTest(){
    //     const { ctx, service } = this;
    //     const {query} = ctx.request;
    //     if(query.student_id && query.test_id){
    //         const results = await service.exercise.getExerciseByTest(query.test_id,query.student_id);
    //         console.log(results);
            
    //         this.ctx.body = results;
    //     }
        
    // }

    async getMyTestData(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id && query.test_id){
            const results = await service.exerciseLog.getMyTestData(query.test_id,query.student_id);
            console.log(results);
            
            this.ctx.body = results;
        }
        
    }

    async submitTestLog(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.exercise_log){
            const results = await service.testLog.submitTestLog(body.exercise_log);
            this.ctx.body = results;
        }
    }

    async generateTestByKp(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.kpid && body.kpname && body.student_id){
            const results = await service.exercise.generateTestByKp(body.kpid, body.kpname, body.student_id);
            console.log(results);
            
            this.ctx.body = results;
        }
    }

    async submitExerciseLog(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.exercise_log){
            const results = await service.exerciseLog.submitExerciseLog(body.exercise_log);
            console.log(results);
            this.ctx.body = results;
        }
    }

    async submitBreakdownLog(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.exercise_log){
            const results = await service.exerciseLog.submitBreakdownLog(body.exercise_log);
            console.log(results);
            this.ctx.body = results;
        }
    }

    async getTestKpReward(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id && query.test_id){
            const results = await service.status.getTestKpReward(query.student_id,query.test_id);
            console.log(results[0]);
            
            this.ctx.body = results[0];
        }
        
    }

    async getTestRatingReward(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id && query.test_id){
            const results = await service.status.getTestRatingReward(query.student_id,query.test_id);
            console.log(results);
            
            this.ctx.body = results;
        }
        
    }

    async getHistoryTest(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.testLog.getStuTestLogs(query.student_id);
            console.log(results);
            
            this.ctx.body = results;
        }
    }

    async getNotFinishTest(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.testLog.getStuNotFinishTest(query.student_id);
            console.log(results);
            
            this.ctx.body = results;
        }
    }

    async getTestStatus(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.test_id){
            const results = await service.status.getTestStatusBytestid(body.test_id);
            console.log(results);
            
            this.ctx.body = results;
        }
    }
    //查询单个测试里的排名信息
    async getTestRankingList(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.test_id){
            const results = await service.status.getTestRankingList(body.test_id);
            console.log(results);
            
            this.ctx.body = results;
        }
    }
    //查询个人测试结果数据（test_kp）
    async getMyTestStatus(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.student_id){
            const results = await service.exerciseLog.getMyTestStatus(body.student_id,body.test_id);
            console.log(results);
            
            this.ctx.body = results;
        }
    }
    //获取学生个人情况信息（姓名 班级等）
    async getStudentInfo(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.student_id){
            const results = await service.user.getStudentInfo(body.student_id);
            console.log(results);
            
            this.ctx.body = results[0];
        }
    }
    //根据学生id 获取学生综合能力（总正确率、近20/50题情况）  
    //在 kl_api
    async getStuAbility(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.status.getStuAbility(query.student_id);
            console.log(results);
            
            this.ctx.body = results;
        }
    }

    //根据学生id  获取所有时间节点天梯分变化情况  
    //在 kl_api
    async getStuLadderWithTime(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.status.getLadderChangeWithTime(query.student_id);
            console.log(results);
            
            this.ctx.body = results;
        }
    }

    //根据学生id,kpid  获取kpid各时间节点天梯分变化情况 
    //在 kl_api
    async getStuKpLadder(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.status.getKpLadderChange(query.student_id,query.kpid);
            console.log(results);
            
            this.ctx.body = results;
        }
    }

    //根据学生id  获取最常训练到的知识点（3个）
    //在 kl_api
    async getStuComUsedKp(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.status.getStuComUsedKp(query.student_id);
            console.log(results);
            
            this.ctx.body = results;
        }
    }

    //根据学生id,kpid 获取学生知识点能力综合概况（天梯分，正确率，练习次数）
    async getStuKpAbility(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.status.getKpAbility(query.student_id,query.kpid);
            console.log(results);
            
            this.ctx.body = results[0];
        }
    }


    
}

module.exports = StudentController;
