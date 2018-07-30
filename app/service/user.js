'use strict';
const Service = require('egg').Service;
const crypto = require('crypto');

/* 微信登陆 */
// var AppID = 'wx6f3a777231ad1747';
const AppID = "wx1dc40895f45755ba";
// var AppSecret = '881a3265d13a362a6f159fb782f951f9';
const AppSecret = 'c90dcd79135556af5d1ed69c8433b009';

class userService extends Service {

  async isOpenidIn (openid){
    const res = await this.app.mysql.get('user_auths',{ identifier : openid });
    return res;
  }

  async updateWxUserInfo(userid, openid, access_token, nickname, imgurl){
    var sql1 = "update users set nickname = ?,avatar = ? where userid = ?;";
    var sql2 = "update user_auths set credential = ? where identifier = ?;";
    var sql  = sql1+sql2;

    const res = await this.app.mysql.query(sql,[nickname, imgurl, userid,access_token,openid]);
    return res;
  }

  async getStuRealname(userid){
    const res = await this.app.mysql.get('users',{ userid : userid });
    return res;
  }

  async checkInvitationCode(code){
    const res = await this.app.mysql.get('user_invitecode',{ invitation_code : code , bind : 0 });
    return res;
  }

  async updateUsers(userid, nickname, imgurl){
    const row = {
      userid: userid,
      nickname: nickname,
      avatar : imgurl,
    };
    const result = await this.app.mysql.update('users', row); 
    return result;
  }

  async insertWxUserAuths(userid, openid, access_token){
    var sql1 = "insert into user_auths(userid, identity_type, identifier, credential) values(?, ?, ?, ?);";
    var sql2 = "update user_invitecode u set u.bind = 1 where u.userid = ?;";
    var sql  = sql1+sql2;

    const res = await this.app.mysql.query(sql,[userid, 'weixin', openid , access_token, userid]);
    return res;
  }

  // async getUser(username,password){
  //   const res = await this.app.mysql.select('user', {
  //       where : { username : username , password : password},
  //       columns : ['username','password','user_id'],
  //   });
  //   return res;
  // }

  async findOne(user){
    const res = await this.app.mysql.get('user_auths',{ identifier : user.username });
    return res;
  }

  async createUser(conditions){
    const res = await this.app.mysql.insert('user_auths', conditions);
    return res;
  }

  async signup(conditions) {
    if (conditions.password) {
      // salt:推荐使用16字节（128位）以上，因使用十六进制保存，所以除以2;
      const salt = crypto.randomBytes(128 / 2).toString('hex');
      // 进行pbkdf2加密，迭代100000次，返回key长度512字节
      const key = crypto.pbkdf2Sync(conditions.password, salt, 100000, 512, 'sha512');
      // 以16进制形式保存，所以字符长度会double，所以数据库中的密码字符长度是1024
      conditions.password = key.toString('hex');
      conditions.salt = salt;
    }
    // conditions.created_time = moment().unix();
    const newUser = await this.createUser(conditions);
    return newUser;
  }

  async signin(username, password) {
    const ctx = this.ctx;
    const user = await this.findOne({ username });
    if (user) {
      // const attemptKey = crypto.pbkdf2Sync(password, user.salt, 100000, 512, 'sha512');
      // const attemptPassword = attemptKey.toString('hex');
      // if (user.password === attemptPassword) return user;
      // return null;
      return user;
    }
    return null;

  }

  async getUsers(conditions, sortConditions, limit = -1, offset = 0) {
    const query = this.ctx.model.User.find(conditions).sort(sortConditions);
    if (offset) query.skip(offset);
    if (limit !== -1) query.limit(limit);
    const users = await query;

    return users;
  }

  async getWxAuth(code,state){
    const ctx = this.ctx;
    var redirect_uri = state;
    var newuser = 1;

    var url1='https://api.weixin.qq.com/sns/oauth2/access_token?appid='+AppID+'&secret='+AppSecret+'&code='+code+'&grant_type=authorization_code';
    const res1 = await ctx.curl(url1);
    var access_token = res1.access_token;
    var openid = res1.openid;

    var url2 = 'https://api.weixin.qq.com/sns/userinfo?access_token='+access_token+'&openid='+openid+'&lang=zh_CN';
    const res2 = await ctx.curl(url2);
    var nickname = res2.nickname;
    var imgurl = res2.headimgurl;

    const res3 = await this.isOpenidIn(openid);
    if(res3){
      const res4 = await this.updateWxUserInfo(res3.userid,openid,access_token,nickname,imgurl);
      const res5 = await this.getStuRealname(res3.userid);

      var group = {
        redirect_uri : redirect_uri,
        user_info : {
          userid : res3.userid,
          nickname : nickname,
          imgurl : imgurl,
          realname : res5.realname,          
        }, 
      };
      return group;
    }else{
      var wx_info = {
        nickname : nickname,
        imgurl : imgurl,
        openid : openid,
        access_token : access_token,
      };
      return({
          newuser:newuser,
          wx_info:wx_info
      });
    }
  }

  async checkInviteCode(invitationcode,wx_info){
    var hascode = 0;
    const res1 = await this.checkInvitationCode(invitationcode);
    if(res1.userid){//邀请码存在且未被使用 
      hascode = 1;
      const res2 = await this.updateUsers(res1.userid,wx_info.nickname,wx_info.imgurl);
      const res3 = await this.getStuRealname(res1.userid);
      const res4 = await this.insertWxUserAuths(res1.userid,wx_info.openid,wx_info.access_token);

      return ({
        hascode: hascode,
        user_info : {
          userid : res1.userid,
          nickname : wx_info.nickname,
          imgurl : wx_info.imgurl,
          realname : res3.realname,          
        }, 
      });
    }else{
      return ({hascode: hascode});
    }
  }

}

module.exports = userService;
 