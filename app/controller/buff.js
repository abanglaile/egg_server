'use strict'

const Controller = require('egg').Controller

class buffController extends Controller {

    async getBuffByID () {
        const { ctx, service } = this
        const results = await service.buff.getBuffByID(ctx.request.query.id)
        this.ctx.body = results
    }
    
    async getBuffByName () {
        const { ctx, service } = this
        const results = await service.buff.getBuffByName(ctx.request.query.name)
        this.ctx.body = results
    }

    async addBuff () {
        const { ctx, service } = this
        const { body } = ctx.request
        const results = await service.buff.addBuff(body)
        this.ctx.body = results
    }

    async updateBuff () {
        const { ctx, service } = this
        const { body } = ctx.request
        const results = await service.buff.updateBuff(body)
        this.ctx.body = results
    }

    async deleteBuff () {
        const { ctx, service } = this
        const results = await service.buff.deleteBuff(ctx.request.query.id)
        this.ctx.body = results
    }
}

module.exports = buffController
