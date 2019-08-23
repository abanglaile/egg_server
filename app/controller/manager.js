'use strict'

const Controller = require('egg').Controller;

class ManagerController extends Controller {
    async renderly(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        const results = await service.lily.renderly(body.code);
        this.ctx.body = results;
    }

    async queryMediaList(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.tag){
            const results = await service.media.queryMediaByPage(0, 5, body.tag);
            this.ctx.body = results;
        }
    }

    async saveTestMedia(){
        const {ctx, service} = this;
        const {body} = ctx.request;
        if(body.save_url){
            const ret = await service.media.saveTestMedia(body.save_url, body.save_wav_url);
            this.ctx.body = ret;
        }        
    }

    async searchMedia(){
        const {ctx, service} = this;
        const {body} = ctx.request;
        if(body.media_url){
            const ret = await service.media.searchMeidaByUrl(body.media_url);
            this.ctx.body = ret;
        }
    }

    async getQiniuToken(){
        const { ctx, service } = this;
        const results = await service.qiniu.getQiniuToken();
        console.log(results);
        this.ctx.body = results;
    }

    async deleteSelectedFile(){
        const {ctx, service} = this;
        const {body} = ctx.request;
        if(body.keys){
            const ret = await service.qiniu.deleteFile(body.keys);
            this.ctx.body = ret;
        }
    }

    async saveUploadUrl(){
        const {ctx, service} = this;
        const {body} = ctx.request;
        if(body.upload_url){
            const ret = await service.media.saveUploadUrl(body.upload_url,body.courseid);
            this.ctx.body = ret;
        }
    }
}

module.exports = ManagerController;
