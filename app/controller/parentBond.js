'use strict'

const Controller = require('egg').Controller;

class ParentBondController extends Controller {

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
}

module.exports = ParentBondController;
