'use strict'

const Controller = require('egg').Controller;

class EntryExerController extends Controller {
   
    async getBookChapter(){
        const { ctx, service } = this;
        console.log("ctx.request.query.course_id: ",ctx.request.query.course_id);
        const results = await service.bookchapter.getBookChapter(ctx.request.query.course_id);
        console.log(results);
        
        this.ctx.body = results;
    }

    async getChapterKp(){
        const { ctx, service } = this;
        const results = await service.bookchapter.getChapterKp(ctx.request.query.chapter_id);
        console.log(results);
        
        this.ctx.body = results;
    }

    async getExerciseByKp(){
        const { ctx, service } = this;
        const results = await service.exercise.getExerciseByKp(ctx.request.query.kpid);
        console.log(results);
    
        this.ctx.body = results;
    }

    async getExercise(){
        const { ctx, service } = this;
        const results = await service.exercise.getTotalExercise(ctx.request.query.exercise_id);

        console.log(results);
        
        this.ctx.body = results;
        
    }

    async getSampleList(){
        const { ctx, service } = this;
        const results = await service.sample.getSampleList(ctx.request.query.exercise_id);

        console.log(results);
        
        this.ctx.body = results;
        
    }

    async getCourse(){
        const { ctx, service } = this;
        const results = await service.bookchapter.getCourse();
        console.log(results);
        
        this.ctx.body = results;
             
    }

    async addExercise(){
        const { ctx, service } = this;
        const {body} = ctx.request;

        const reply = await service.exercise.addOneExercise(body.course_id,body.exercise);
        
        this.ctx.body = reply;
              
    }

    async addOneSample(){
        const { ctx, service } = this;
        const {body} = ctx.request;

        const reply = await service.sample.addOneSample(body.exercise_sample);
        
        this.ctx.body = reply;
              
    }

    async updateOneSample(){
        const { ctx, service } = this;
        const {body} = ctx.request;

        const reply = await service.sample.updateOneSample(body.exercise_sample,body.exercise_sample.exercise_id,body.exercise_sample.sample_index);
        
        this.ctx.body = reply;
              
    }

    async updateAllSample(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        var reply = null;

        for(let i = 0;i < body.sample_list.length; i++){
            let item = body.sample_list[i];
            reply = await service.sample.updateOneSample(item,item.exercise_id,item.sample_index);
        }

        this.ctx.body = reply;
              
    }

    async updateExercise(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        console.log("body :"+JSON.stringify(body));
        const reply = await service.exercise.updateOneExercise(body.exercise);

        this.ctx.body = reply;
              
    }

    async updateBreakdown(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const reply = await service.exercise.updateOneBreakdown(body.exercise_id, body.breakdown, body.answer_assist_url);

        this.ctx.body = reply;
    }

    async updateSample(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        console.log("body :"+JSON.stringify(body));
        const reply = await service.sample.updateSample(body.sample_list);

        this.ctx.body = reply;
              
    }

}

module.exports = EntryExerController;