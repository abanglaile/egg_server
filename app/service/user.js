const Service = require('egg').Service;
const crypto = require('crypto');
const uuid = require('uuid');
var WXBizDataCrypt = require('./WXBizDataCrypt')

/* 微信登陆 */
// var AppID = 'wx6f3a777231ad1747';
const AppID = "wx1dc40895f45755ba";
const XCX_APPID = 'wxdaa11d7859e34a5e';
const XCX_APPSECRET = '931ad7ea1c0d91082111e36aae4aac7e';
const STU_XCX_APPID = 'wx399694102b0ebc51';
const STU_XCX_APPSECRET = '9b372c2429d5d0e36abe44f4af6e443f';
// var AppSecret = '881a3265d13a362a6f159fb782f951f9';
const AppSecret = 'c90dcd79135556af5d1ed69c8433b009';

class userService extends Service {

  async getUserInfo(userid){
    const res = await this.app.mysql.get('users',{userid : userid});
    console.log("res:",res);
    return res;
  }

  async getMyRealname(userid){
    const res = await this.app.mysql.get('users',{userid : userid});
    let name = res? res.realname : null;
    return name;
  }

  async getStudentInfo(student_id){
    var sql = `select u.userid,u.realname,u.avatar,u.score,t.stu_group_id,t.group_name from users u left join 
    (select g.student_id,g.stu_group_id,sg.group_name from group_student g,
    school_group sg where g.stu_group_id = sg.stu_group_id) as t on t.student_id = u.userid 
     where u.userid = ?;`;
//需要处理下  TODO
    var group = [];
    const res = await this.app.mysql.query(sql,student_id);
    var realname = res[0].realname;
    var avatar = res[0].avatar;
    var score = res[0].score;
    for(var i=0;i<res.length;i++){
      group.push({
        group_id : res[i].stu_group_id,
        group_name : res[i].group_name,
      });
    }
    var stu_info = {
      realname : realname,
      avatar : avatar,
      score : score,
      group : group,
    };
    return stu_info;
  }

  async updateStuName(userid, realname){
    const row = {
      realname: realname,
    };
    const res = await this.app.mysql.update('users', row, {
      where: {
        userid: userid,
      }
    } );
    return res;
  }

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
      nickname: nickname,
      avatar : imgurl,
    };
    const result = await this.app.mysql.update('users', row, {
      where: {
        userid: userid,
      }
    }); 
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

  async findOneinUsers(userid){
    const res = await this.app.mysql.get('users',{ userid : userid });
    return res;
  }

  async createUser(conditions){
    const res = await this.app.mysql.insert('user_auths', {
      userid : conditions.userid,
      identity_type : 'username',
      identifier : conditions.username,
      credential : conditions.password,
      salt : conditions.salt,
    });
    return res;
  }

  async signup(conditions) {
    if (conditions.password) {
      console.log("uudi.v1():",uuid.v1());
      // salt:推荐使用16字节（128位）以上，因使用十六进制保存，所以除以2;
      const salt = crypto.randomBytes(128 / 2).toString('hex');
      // 进行pbkdf2加密，迭代100000次，返回key长度512字节
      const key = crypto.pbkdf2Sync(conditions.password, salt, 100000, 512, 'sha512');
      // 以16进制形式保存，所以字符长度会double，所以数据库中的密码字符长度是1024
      conditions.password = key.toString('hex');
      conditions.salt = salt;
      conditions.userid = uuid.v1().replace(/-/g,'');
    }
    // conditions.created_time = moment().unix();
    const newUser = await this.createUser(conditions);
    return conditions.userid;
  }

  async signin(username, password, redirect) {
    if(redirect != '/school-zq/'){
      const user = await this.findOne({ username });
      if (user) {
        if(user.credential === password){
          return user;
        }
        // const attemptKey = crypto.pbkdf2Sync(password, user.salt, 100000, 512, 'sha512');
        // const attemptPassword = attemptKey.toString('hex');
        // if (user.password === attemptPassword) return user;
        // return null;
      }
    }else{
      const user = await this.findOne({ username });
      if (user) {
        if(user.credential === password){
          const one = await this.findOneinUsers(user.userid);
          if(one.role == 3){
            return user;
          }
        }
      }
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

  async batchGetwxInfo(){
    //step1: 拿到微信公众号操作的全局access_token
    const ctx = this.ctx;
    var url1 = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+AppID+'&secret='+AppSecret;
    const res = await ctx.curl(url1,{dataType:'json',});
    this.ctx.logger.error("全局 access_token:",JSON.stringify(res.data.access_token));
    //step2: 获取目前所有的unionid为空，且有openid的项
    var openids = await this.app.mysql.query(`select * from user_auths where identity_type = 'weixin' and unionid IS NULL and identifier IS NOT NULL;`,[]);
    var all_list = [];
    var one_list = [];
    var count = 0;
    for(var i = 0; i < openids.length; i++){
      if(count < 100){
        one_list.push({
            "openid" : openids[i].identifier, 
            "lang" : "zh_CN"
        });
        count += 1;
      }else{
        all_list.push({
          "user_list" : one_list,
        });
        count = 0;
        one_list = [];
      }
    }
    if(count > 0){
      all_list.push({
        "user_list" : one_list,
      });
    }
    //
    // var test_list = [];
    // var temp_one = [];
    // for(var m=2;m<all_list.length;m++){
    //   for(var n=0;n<all_list[m].user_list.length;n++){
    //     temp_one.push(all_list[m].user_list[n]);
    //     test_list.push({
    //       "user_list" : temp_one,
    //     });
    //     temp_one = [];
    //   }
    // }
    // this.ctx.logger.error("test_list长度:",test_list.length);
    //step3: 
    var url2 = 'https://api.weixin.qq.com/cgi-bin/user/info/batchget?access_token='+res.data.access_token;
    var res_wx = null;
    var count_update = 0;
    for(var j = 0; j < all_list.length; j++){
        res_wx = await ctx.curl(url2,{
          method: 'POST',
          contentType: 'json',
          data: all_list[j],
          dataType:'json',
        });
        // if(res_wx.data.errcode){
        //   this.ctx.logger.error("错误openid：",JSON.stringify(test_list[j].user_list[0].openid));
        // }
        // this.ctx.logger.error("微信返回：",JSON.stringify(res_wx.data));
        this.ctx.logger.error("微信返回多少个：",JSON.stringify(res_wx.data.user_info_list.length));
        if(res_wx.status == 200){
          for(var m = 0; m < res_wx.data.user_info_list.length; m++){
            var e = res_wx.data.user_info_list[m];
            if(e.subscribe == 1){//关注了公众号才会返回unionid
              count_update += 1;
              let res_update = await this.app.mysql.update('user_auths', {unionid:e.unionid}, {where: {identifier: e.openid}});
            }
          }
        }
    }
    return count_update;
  }

  async getXcxAuth(code){
    const ctx = this.ctx;
    var url='https://api.weixin.qq.com/sns/jscode2session?appid=' + XCX_APPID + '&secret=' + XCX_APPSECRET + '&grant_type=authorization_code&js_code=' + code;
    const res = await ctx.curl(url,{dataType:'json',});
    // this.ctx.logger.error("res getXcxAuth:",JSON.stringify(res));
    if(res.data.unionid){
      const res_user = await this.app.mysql.get('user_auths', { unionid: res.data.unionid });
      // this.ctx.logger.error("[res_user]:",JSON.stringify(res_user));
      if(res_user){
        return { userid : res_user.userid, unionid : res.data.unionid, openid : res.data.openid};
      }else{//
        return { unionid : res.data.unionid ,openid : res.data.openid};
      }
    }else{
      const user = await this.app.mysql.get('user_auths', { identifier: res.data.openid });
      if(user){
        return { userid : user.userid, openid : res.data.openid };
      }else{
        return {openid : res.data.openid};
      }
    }

    //在数据库保存返回的session_key，用于后续用户数据的解密鉴权
    // const res1 = await this.app.mysql.get('xcx_session_key', { xcx_openid: res.data.openid });
    // if(res1.session_key){
    //   const res2 = await this.app.mysql.update('xcx_session_key', {session_key:res.data.session_key}, {where: {xcx_openid: res.data.openid}});
    // }else{
    //   const res2 = await this.app.mysql.insert('xcx_session_key', {
    //     xcx_openid : res.data.openid,
    //     session_key : res.data.session_key,
    //   });
    // }
    // return res;
  }

  async getStuXcxAuth(code,wx_info){
    // this.ctx.logger.error("wx_info:",JSON.stringify(wx_info));
    const ctx = this.ctx;
    var url='https://api.weixin.qq.com/sns/jscode2session?appid=' + STU_XCX_APPID + '&secret=' + STU_XCX_APPSECRET + '&grant_type=authorization_code&js_code=' + code;
    const res = await ctx.curl(url,{dataType:'json',});
    // this.ctx.logger.error("res:",JSON.stringify(res));
    if(res.data.unionid){
      const res_user = await this.app.mysql.get('user_auths', { unionid: res.data.unionid });
      //存在userid，则进行users的头像和昵称更新
      if(res_user){
        const row = {
          nickname: wx_info.nickname,
          avatar : wx_info.imgurl,
        };
        const result = await this.app.mysql.update('users', row, {
          where: {
            userid: res_user.userid,
          }
        }); 
        return { userid : res_user.userid, unionid : res.data.unionid, openid : res.data.openid};
      }else{//不存在则新建userid
        let userid = uuid.v1().replace(/-/g, '');
        await this.app.mysql.insert('user_auths', {
            userid: userid,
            unionid: res.data.unionid,
            identity_type: 'weixin_xcx_stu',
            identifier: res.data.openid,
        });
        await this.app.mysql.insert('users', {
            userid: userid,
            nickname: wx_info.nickname,
            avatar: wx_info.imgurl,
            role: 2,//4、家长，3、管理员,2、学生
            // realname: realname,
        });
        return { userid : userid, unionid : res.data.unionid ,openid : res.data.openid};
      }
    }else{//不存在unionid,但是有openid
      const user = await this.app.mysql.get('user_auths', { identifier: res.data.openid });
      if(user){
        const row = {
          nickname: wx_info.nickname,
          avatar : wx_info.imgurl,
        };
        await this.app.mysql.update('users', row, {
          where: {
            userid: user.userid,
          }
        }); 
        return { userid : user.userid, openid : res.data.openid };
      }else{
        let userid = uuid.v1().replace(/-/g, '');
        await this.app.mysql.insert('user_auths', {
            userid: userid,
            // unionid: null,
            identity_type: 'weixin_xcx',
            identifier: res.data.openid,
        });
        await this.app.mysql.insert('users', {
            userid: userid,
            nickname: wx_info.nickname,
            avatar: wx_info.imgurl,
            role: 2,//4、家长，3、管理员,2、学生
            // realname: realname,
        });
        return { userid : userid, openid : res.data.openid};
      }
    }
  }

  async getXcxUnionid(encryptedData,iv,openid){
    this.ctx.logger.error("openid:",openid);
    const res_session = await this.app.mysql.get('xcx_session_key', { xcx_openid: openid });
    var pc = new WXBizDataCrypt(XCX_APPID, res_session.session_key);
    var res = pc.decryptData(encryptedData , iv);
    this.ctx.logger.error("getXcxUnionid res:",JSON.stringify(res));
    //解码出unionid,并通过unionid拿到对应的userid
    if(res.unionId){
      const res_user = await this.app.mysql.get('user_auths', { unionid: res.unionId });
      if(res_user){
        return { userid : res_user.userid, unionid : res.unionId };
      }else{//
        return { unionid : res.unionId };
      }
    }
    // this.ctx.logger.error("decryptData:",JSON.stringify(data));
    return 0;
  }

  async getWxAuth(code,state){
    const ctx = this.ctx;
    var redirect_uri = state;
    var newuser = 1;

    var url1='https://api.weixin.qq.com/sns/oauth2/access_token?appid='+AppID+'&secret='+AppSecret+'&code='+code+'&grant_type=authorization_code';
    const res1 = await ctx.curl(url1,{dataType:'json',});
    console.log("res1 :",JSON.stringify(res1));

    var access_token = res1.data.access_token;
    var openid = res1.data.openid;
    console.log("openid :",JSON.stringify(openid));

    var url2 = 'https://api.weixin.qq.com/sns/userinfo?access_token='+access_token+'&openid='+openid+'&lang=zh_CN';
    const res2 = await ctx.curl(url2,{dataType:'json',});
    var nickname = res2.data.nickname;
    var imgurl = res2.data.headimgurl;
    console.log("nickname :",JSON.stringify(nickname));

    const res3 = await this.isOpenidIn(openid);
    console.log("res3 :",JSON.stringify(res3));
    if(res3){
      const res4 = await this.updateWxUserInfo(res3.userid,openid,access_token,nickname,imgurl);
      console.log("res4 :",JSON.stringify(res4));
      const res5 = await this.getStuRealname(res3.userid);
      console.log("res5 :",JSON.stringify(res5));

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

  async setUserInfo(realname,wx_info,stu,groupValue){
    var userid = uuid.v1().replace(/-/g,'');
    console.log("userid: ",userid);
    const res1 = await this.app.mysql.insert('user_auths', {
      userid : userid,
      identity_type : 'weixin',
      identifier : wx_info.openid,
      credential : wx_info.access_token,
    });

    const res2 = await this.app.mysql.insert('users', {
      userid : userid,
      nickname : wx_info.nickname,
      avatar : wx_info.imgurl,
      role : stu? 2 : 1,
      realname : realname,
    });

    if(stu && groupValue){
      const res3 = await this.app.mysql.insert('group_student', {
       stu_group_id : groupValue,
       student_id : userid,
      });
    }

    return ({
        userid : userid,
        nickname : wx_info.nickname,
        imgurl : wx_info.imgurl,
        realname : realname,          
    });

  }

  async setTeacherInfo(realname,wx_info,school_id){
    const {openid} = wx_info;
    const res1 = await this.isOpenidIn(openid);
    var userid = null;
    if(!res1){
      userid = uuid.v1().replace(/-/g,'');
      console.log("userid: ",userid);
      const res2 = await this.app.mysql.insert('user_auths', {
        userid : userid,
        identity_type : 'weixin',
        identifier : wx_info.openid,
        credential : wx_info.access_token,
      });

      const res3 = await this.app.mysql.insert('users', {
        userid : userid,
        nickname : wx_info.nickname,
        avatar : wx_info.imgurl,
        role : 1,
        realname : realname,
      });

      const res4 = await this.app.mysql.insert('school_teacher',{
        teacher_id : userid,
        school_id : school_id,
        addtime : new Date(),
      });
    }else{
      userid = res1[0].userid;
    }

    return ({
        userid : userid,
        nickname : wx_info.nickname,
        imgurl : wx_info.imgurl,
        realname : realname,          
    });

  }
  
  async setStuInfo(realname,wx_info){
    const {openid} = wx_info;
    const res1 = await this.isOpenidIn(openid);
    var userid = null;
    if(!res1){
      userid = uuid.v1().replace(/-/g,'');
      console.log("userid: ",userid);
      const res2 = await this.app.mysql.insert('user_auths', {
        userid : userid,
        identity_type : 'weixin',
        identifier : wx_info.openid,
        credential : wx_info.access_token,
      });

      const res3 = await this.app.mysql.insert('users', {
        userid : userid,
        nickname : wx_info.nickname,
        avatar : wx_info.imgurl,
        role : 2,
        realname : realname,
      });

    }else{
      userid = res1[0].userid;
    }

    return ({
        userid : userid,
        nickname : wx_info.nickname,
        imgurl : wx_info.imgurl,
        realname : realname,          
    });

  }

  async searchStuName(input){
    const sql = "select u.userid as student_id,u.realname from users u where u.realname like ?;";
    let params = [];
    params.push('%'+input+'%');
    return await this.app.mysql.query(sql, params);
  }
}

module.exports = userService;
 