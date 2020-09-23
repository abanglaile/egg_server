const { sumNthPowerDeviations } = require('simple-statistics');

const Subscription = require('egg').Subscription;

const STU_XCX_APPID = 'wx399694102b0ebc51';
const STU_XCX_APPSECRET = '9b372c2429d5d0e36abe44f4af6e443f';

class UpdateAccessToken extends Subscription {
  /**
   * @property {Object} schedule
   *  - {String} type - schedule type, `worker` or `all` or your custom types.
   *  - {String} [cron] - cron expression, see [below](#cron-style-scheduling)
   *  - {Object} [cronOptions] - cron options, see [cron-parser#options](https://github.com/harrisiirak/cron-parser#options)
   *  - {String | Number} [interval] - interval expression in millisecond or express explicitly like '1h'. see [below](#interval-style-scheduling)
   *  - {Boolean} [immediate] - To run a scheduler at startup
   *  - {Boolean} [disable] - whether to disable a scheduler, usually use in dynamic schedule
   *  - {Array} [env] - only enable scheduler when match env list
   */
  static get schedule() {
    return {
      type: 'worker',
      interval: '119m',
      immediate: true,
      disable : true,   
    };
  }

  async subscribe() {
     //拿到微信小程序操作的全局access_token
      const ctx = this.ctx;
      var url1 = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+STU_XCX_APPID+'&secret='+STU_XCX_APPSECRET;
      const res = await ctx.curl(url1,{dataType:'json',});
      await this.app.mysql.update('access_token', {
          access_token : res.data.access_token,
          expires_in : res.data.expires_in,
        },{
          where:{
            token_type : 'xcx_stu',//小程序学生端
          }
      });
  }
}

module.exports = UpdateAccessToken;