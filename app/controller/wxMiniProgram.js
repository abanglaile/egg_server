const wxMiniProgram = require('egg').Controller;

class WXMiniProgramAPI extends wxMiniProgram {
    async wxGetAllComment() {
        const { ctx, service } = this;
        const { query } = ctx.request;
        if (query) {
            const result = await service.wxMiniProgram.getAllComment(query.avatarUrl);
            this.ctx.body = result;
        }
    }

    async wxPostComment() {
        const { ctx, service } = this;
        const { body } = ctx.request;
        if (body) {
            const result = await service.wxMiniProgram.postComment(body);
            this.ctx.body = result;
        }
    }

    async getStudentLesson() {
        const { ctx, service } = this;
        const { body } = ctx.request;
        if (body) {
            const result = await service.lesson.getStudentLesson(query.student_id, query.filter_option);
            this.ctx.body = result;
        }
    }
}
module.exports = WXMiniProgramAPI;