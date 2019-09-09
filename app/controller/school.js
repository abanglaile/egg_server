'use strict'

const Controller = require('egg').Controller;

class SchoolController extends Controller {
    async getTeacherList(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.school.getTeacherList(query.schoolId);
        ctx.body = results;
    }
    
    async getGroupTable(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.group.getGroupTable(query.schoolId);
        ctx.body = results;
    }

    async getContractTable(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.group.getContractTable(query.schoolId);
        ctx.body = results;
    }
    
    async getGroupOptionData(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.teacher.getGroupOptionData(query.schoolId);
        ctx.body = results;
    }
    
    async updateGroupTeacher(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.group.updateGroupTeacher(body.selected_teacher,body.group_id);
        ctx.body = results;
    }

    async updateGroupHour(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.group.updateGroupHour(body.stu_group_id,body.student_id,body.num,body.label);
        ctx.body = results;
    }

    async addNewSchoolGroup(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.group.addNewSchoolGroup(body.new_group, body.groupTeacher);
        ctx.body = results;
    }
    
    async getConsumeLesson(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lesson.getConsumeLesson(body.stu_group_id,body.label,body.filter_option);
        ctx.body = results;
    }
}

module.exports = SchoolController;