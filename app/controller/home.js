const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    // this.ctx.body = 'Hello old fat yang';
    // console.log("this.ctx.user :", );   
    this.ctx.body = this.ctx.user.userid;
  }
}

module.exports = HomeController;