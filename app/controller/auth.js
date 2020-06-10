'use strict'

const Controller = require('egg').Controller;

class AuthController extends Controller {

  async login(){
      const { ctx, service } = this;
      const {body} = ctx.request;
      if(body.username){
          const results = await service.user.signin(body.username, body.password, body.redirect);
          console.log(results);
          
          this.ctx.body = results;
      }
  }

    // post /signup
  async signup() {
    const { ctx, service } = this;
    const username = ctx.request.body.username;
    const existUserDoc = await service.user.findOne({ username });
    var msg = {};
    msg.signMsg = 'failed';
    if (existUserDoc) {
      msg.signMsg = 'existed';
    } else {
      const password = ctx.request.body.password;
      const newUser = await service.user.signup({ username, password });
      if (newUser) {
        this.ctx.login(newUser);
        // this.ctx.redirect('/');
        msg.signMsg = 'sucess';
        msg.userid = newUser;
      }
    }
    this.ctx.body = msg;
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

    const results = await service.user.getWxAuth(query.code,query.state);
    console.log('results :',JSON.stringify(results));
    // var results = {identifier : 1};
    //为用户启动一个登录的 session
    if(results.user_info){
      this.ctx.login(results.user_info);
    }
    this.ctx.body = results;
  }

  async getXcxAuth(){
    const { ctx, service } = this;
    const {query} = ctx.request;

    const results = await service.user.getXcxAuth(query.code);
    this.ctx.body = results;
  }

  async getStuXcxAuth(){
    const { ctx, service } = this;
    const {body} = ctx.request;
    const results = await service.user.getStuXcxAuth(body.code,body.wx_info);
    this.ctx.body = results;
  }

  async batchGetwxInfo(){
    const { ctx, service } = this;
    const {query} = ctx.request;
    const results = await service.user.batchGetwxInfo();
    this.ctx.body = results;
  }

  async getXcxUnionid(){
    const { ctx, service } = this;
    const {query} = ctx.request;
    const results = await service.user.getXcxUnionid(query.encryptedData,query.iv,query.openid);
    this.ctx.body = results;
  }

  async checkInviteCode(){
    const { ctx, service } = this;
    const {body} = ctx.request;

    if(body.invitationcode){
      const results = await service.user.checkInviteCode(body.invitationcode,body.wx_info);

      if(results.user_info){
        this.ctx.login(results.user_info);
      }
      
      this.ctx.body = results;
    }
    
  }

  async setUserInfo(){
    const { ctx, service } = this;
    const {body} = ctx.request;

    if(body.realname){
      const results = await service.user.setUserInfo(body.realname,body.wx_info,body.stu,body.groupValue);
      this.ctx.body = results;
    }
  }

  async setTeacherInfo(){
    const { ctx, service } = this;
    const {body} = ctx.request;

    if(body.realname){
      const results = await service.user.setTeacherInfo(body.realname,body.wx_info,body.school_id);
      this.ctx.body = results;
    }
  }
  
  async setStuInfo(){
    const { ctx, service } = this;
    const {body} = ctx.request;

    if(body.realname){
      const results = await service.user.setStuInfo(body.realname,body.wx_info);
      this.ctx.body = results;
    }
  }

  async getSclGroup(){
    const { ctx, service } = this;
    const results = await service.group.getSclGroup(ctx.request.query.school_id);

    console.log(results);
    
    this.ctx.body = results;
  }
    
}

module.exports = AuthController;
