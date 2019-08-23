'use strict'

const Controller = require('egg').Controller

class VirtualroomController extends Controller {

    // 虚拟自习室基础接口
    async getVirtualroom () {
        const { ctx, service } = this
        const results = await service.virtualroom.getVirtualroom()
        this.ctx.body = results
    }

    async getVirtualroomByID () {
        const { ctx, service } = this
        const results = await service.virtualroom.getVirtualroomByID(ctx.request.query.id)
        this.ctx.body = results
    }
    
    async getVirtualroomByName () {
        const { ctx, service } = this
        const results = await service.virtualroom.getVirtualroomByName(ctx.request.query.name)
        this.ctx.body = results
    }

    async getVirtualroomByAdmin () {
        const { ctx, service } = this
        const results = await service.virtualroom.getVirtualroomByAdmin(ctx.request.query.id)
        this.ctx.body = results
    }

    async addVirtualroom () {
        const { ctx, service } = this
        const { body } = ctx.request
        const results = await service.virtualroom.addVirtualroom(body)
        this.ctx.body = results
    }

    async updateVirtualroom () {
        const { ctx, service } = this
        const { body } = ctx.request
        const results = await service.virtualroom.updateVirtualroom(body)
        this.ctx.body = results
    }

    async deleteVirtualroom () {
        const { ctx, service } = this
        const results = await service.virtualroom.deleteVirtualroom(ctx.request.query.id)
        this.ctx.body = results
    }

    // 签约
    async addVirtualroomSign () {
        const { ctx, service } = this
        const { body } = ctx.request
        const results = await service.virtualroom.addVirtualroomSign(body.virtual_room_id, body.user_id)
        this.ctx.body = results
    }
    async getVirtualroomSign () {
        const { ctx, service } = this
        const results = await service.virtualroom.getVirtualroomSign(ctx.request.query)
        this.ctx.body = results
    }

    // 增益
    async addVirtualroomBuff () {
        const { ctx, service } = this
        const { body } = ctx.request
        const results = await service.virtualroom.addVirtualroomBuff(body.virtual_room_id, body.buff_id, body.day)
        this.ctx.body = results
    }
    async getVirtualroomBuff () {
        const { ctx, service } = this
        const results = await service.virtualroom.getVirtualroomBuff(ctx.request.query)
        this.ctx.body = results
    }
}

module.exports = VirtualroomController
