const Controller = require('egg').Controller;

class HomeController extends Controller {
  async authsuc() {
    this.ctx.body = 'sucess';
    // console.log("this.ctx.user :", JSON.stringify(this.ctx.user));   
    // this.ctx.body = this.ctx.user.userid;
  }

  async authfail() {
    this.ctx.body = null;
    // console.log("this.ctx.user :", JSON.stringify(this.ctx.user));   
    // this.ctx.body = this.ctx.user.userid;
  }
}

module.exports = HomeController;