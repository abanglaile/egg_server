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

    
}

module.exports = SlideController;
