'use strict'

const Controller = require('egg').Controller;

class ParentController extends Controller {

    async getCodeByUserid() {
        const { ctx, service } = this;
        const results = await service.parentBond.getCodeByUserid(ctx.request.query.student_id);
        this.ctx.body = results;
    }

    async getUserByCode() {
        const { ctx, service } = this;
        const results = await service.parentBond.getUserByCode(ctx.request.query.code);
        this.ctx.body = results;
    }

    async parentBond() {
        const { ctx, service } = this;
        const results = await service.parentBond.parentBond(ctx.request.query.parent_id, ctx.request.query.student_id);
        this.ctx.body = results;
    }

    async parentUnBond() {
        const { ctx, service } = this;
        const results = await service.parentBond.parentUnBond(ctx.request.query.parent_id, ctx.request.query.student_id);
        this.ctx.body = results;
    }

    async getBondStudent() {
        const { ctx, service } = this;
        const results = await service.parentBond.getBondStudent(ctx.request.query.parent_id);
        this.ctx.body = results;
    }

    async getStudentLesson(){
        const { ctx, service } = this;
        const { student_id, filter_option } = ctx.request.body;
        if(filter_option.course_label_list){
            if(filter_option.course_label_list.length == 9){
                delete filter_option.course_label_list
            }else{
                filter_option.course_label_list = filter_option.course_label_list.map(c => c.course_label)
            } 
        }
        if(filter_option.label_id_list){
            if(filter_option.label_id_list.length == 2){
                delete filter_option.label_id_list
            }else{
                filter_option.label_id_list = filter_option.label_id_list.map(c => c.label_id)
            }
        }
        
        const results = await service.lesson.getStudentLesson(student_id, filter_option);
        this.ctx.body = results;
    }

    async getStudentGroup(){
        const { ctx, service } = this;
        const results = await service.group.getStudentGroup(ctx.request.query.student_id);
        this.ctx.body = results; 
    }
}

module.exports = ParentController;
