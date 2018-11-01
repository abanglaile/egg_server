'use strict'

const Controller = require('egg').Controller;

class SlideController extends Controller {
    async getLessonSlide(){
        const { ctx, service } = this;
        const results = await service.slide.getLessonSlide(ctx.request.query.lesson_slide_id);
        this.ctx.body = results;
    }

    async getLessonSlideFeedback(){
        const { ctx, service } = this;
        const results = await service.slide.getLessonSlideFeedback(ctx.request.query.student_id, ctx.request.query.lesson_slide_id);
        this.ctx.body = results;
    }

    async updateQFeedback(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.userid){
            const results = await service.slide.updateQFeedback(body.lesson_slide_id, body.q, body.indexh, body.userid);
            this.ctx.body = results;
        }
    }

    
}

module.exports = SlideController;
