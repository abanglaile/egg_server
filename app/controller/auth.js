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

    // post /signup
  async signup() {
    const username = this.ctx.request.body.username;
    const existUserDoc = await this.ctx.model.User.findOne({ username });
    let alertMsg = '注册失败。';
    if (existUserDoc) {
      alertMsg = '用户名已存在。';
    } else {
      const password = this.ctx.request.body.password;
      const newUser = await this.ctx.service.user.signup({ username, password });
      if (newUser) {
        // 自动登录并跳转到主页
        this.ctx.login(newUser);
        this.ctx.redirect('/');
        return;
      }
    }
    this.ctx.service.router.storeAlertMsg(alertMsg);
    this.ctx.redirect('/signup');
  }

  // get /signout
  async signout() {
    this.ctx.logout();
    this.ctx.service.router.storeAlertMsg('您已成功退出。');
    this.ctx.redirect('/');
  }

  async getWxAuth(){
    const { ctx, service } = this;
    const {query} = ctx.request;

    // const results = await service.user.getWxAuth(query.code,query.state);
    // console.log(results);
    var results = {identifier : 1};
    this.ctx.login(results);
    this.ctx.body = results;
  }

  async checkInviteCode(){
    const { ctx, service } = this;
    const {body} = ctx.request;

    if(body.invitationcode){
      const results = await service.user.checkInviteCode(body.invitationcode,body.wx_info);
      console.log(results);
      
      this.ctx.body = results;
    }
    
  }
    
}

module.exports = AuthController;
