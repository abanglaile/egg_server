'use strict'

const Controller = require('egg').Controller;

class StudentController extends Controller {

    async getMyStudentRating(){
        const { ctx, service } = this;
        const results = await service.rating.getStudentRating(ctx.request.query.student_id, ctx.request.query.course_id);
        console.log(results);
        this.ctx.body = results;
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

    async getCourse(){
        const { ctx, service } = this;
        const results = await service.bookchapter.getCourse();
        this.ctx.body = results;
    }

    async getMyBookChapter(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.rating.getMyBookChapter(query.student_id, query.course_id);
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
        this.ctx.body = results[0];
    }

    async getChapterKpStatus(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.rating.getChapterKpStatus(query.student_id, query.chapter_id);
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
            const results = await service.exercise.generateTestByKp(body.kpid, body.kpname, body.student_id, body.course_id);
            console.log(results);
            
            this.ctx.body = results;
        }
    }

    async submitExerciseLog(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.exercise_log){
            const results = await service.exerciseLog.submitExerciseLog(body.exercise_log, body.exercise_type, body.exindex);
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

    async getTestRatingReward(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id && query.test_id){
            const results = await service.status.getTestRatingReward(query.student_id,query.test_id);
            console.log('getTestRatingReward: ',results);
            
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
            const results = await service.testLog.getTestStatus(body.test_id);
            console.log(results);
            
            this.ctx.body = results;
        }
    }
    //查询单个测试里的排名信息
    async getTestRankingList(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.test_id){
            const results = await service.testLog.getTestRankingList(body.test_id);
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
            console.log('getStudentInfo',results);
            
            this.ctx.body = results;
        }
    }
    
    //更新学生真实姓名
    async updateStuName(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.userid){
            const results = await service.user.updateStuName(body.userid, body.realname);
            this.ctx.body = results;
        }
    }
    
    //添加学生与班级的绑定
    async addStuGroupId(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.userid){
            const results = await service.group.addStuGroupId(body.userid, body.group_id);
            this.ctx.body = results;
        }
    }
    //根据学生id 获取学生综合能力（总正确率、近20/50题情况）  
    //在 kl_api
    async getStuAbility(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.status.getStuAbility(query.student_id, query.course_id);
            console.log('getStuAbility: ',results);
            
            this.ctx.body = results;
        }
    }

    //根据student_id,course_id获取所有时间节点天梯分变化情况  
    //在 kl_api
    async getStuRatingHistory(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.rating.getStuRatingHistory(query.student_id, query.course_id);
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
    async getStuPoorKp(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.status.getStuPoorKp(query.student_id);
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
    //根据学生id  获取最常训练到的知识点（3个）
    async getStuComUsedKp(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.status.getStuComUsedKp(query.student_id);
            console.log(results);
            this.ctx.body = results;
        }
    }
    //根据学生id  获取最近训练的知识点 (7个)
    async getStuRecentKp(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.status.getStuRecentKp(query.student_id);
            this.ctx.body = results;
        }
    }
    //根据chapterid 获取知识点（包含知识点天梯分和最新更新时间）
    async getKpWithScore(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        if(query.student_id){
            const results = await service.rating.getKpWithScore(query.student_id,query.chapter_id);
            this.ctx.body = results;
        }
    }

    //根据测试数据，生成学生的单份测试反馈情况
    async getStuEvalBytest(){
        const { ctx,service } = this;
        const { query } = ctx.request;
        if(query.student_id){
            
            const result = await service.rating
            this.ctx.body = result;
        }
    }
}

module.exports = StudentController;
