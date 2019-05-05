'use strict'

const Controller = require('egg').Controller;

class SchoolController extends Controller {
    async getTeacherList(){
        const { ctx, service } = this;
        const {query} = ctx.request;
        const results = await service.school.getTeacherList(query.schoolId);
        ctx.body = results;
    }
}

module.exports = SchoolController;
