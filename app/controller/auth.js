'use strict'

const Controller = require('egg').Controller;

class AuthController extends Controller {

    async login(){
        const { ctx, service } = this;
        const {body} = ctx.request;
        if(body.username){
            const results = await service.user.identityUser(body.username,body.password);
            console.log(results);
            
            this.ctx.body = results;
        }
    }

    
}

module.exports = AuthController;
