'use strict'

const Controller = require('egg').Controller;

class GameController extends Controller {
    async getStuTasklog(){
        const { ctx, service } = this;
        const results = await service.task.getStuTasklog(ctx.request.query.student_id, 
            ctx.request.query.online, ctx.request.submit_time);
        this.ctx.body = results;
    }

    async deleteTaskLog(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.task_id && body.student_id){
            const results = await service.task.deleteTaskLog(body.task_id, [{student_id: body.student_id}]);
            this.ctx.body = results;
        }
    }

    async addTaskLog(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.student_id){
            const results = await service.assignTask.addTask(body.task, [{student_id: body.student_id}]);
            this.ctx.body = results;
        }
    }
}

module.exports = GameController;
