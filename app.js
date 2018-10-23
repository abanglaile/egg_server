'use strict';
const LocalStrategy = require('passport-local').Strategy;
// const WeixinStrategy = require('passport-weixin');
module.exports = app => {

  // // 挂载 strategy
  // app.passport.use(new LocalStrategy({
  //   passReqToCallback: true,
  // }, (req, username, password, done) => {
  //   // format user
  //   const user = {
  //     provider: 'local',
  //     username,
  //     password,
  //   };
  //   // debug('%s %s get user: %j', req.method, req.url, user);
  //   app.passport.doVerify(req, user, done);
  // }));
  // app.passport.use('loginByWeixinClient',new WeixinStrategy({
  //   clientID: 'CLIENTID'
  //   , clientSecret: 'CLIENT SECRET'
  //   , callbackURL: 'CALLBACK URL'
  //   , requireState: false
  //   , authorizationURL: 'https://open.weixin.qq.com/connect/oauth2/authorize' //[公众平台-网页授权获取用户基本信息]的授权URL 不同于[开放平台-网站应用微信登录]的授权URL
  //   , scope: 'snsapi_userinfo' //[公众平台-网页授权获取用户基本信息]的应用授权作用域 不同于[开放平台-网站应用微信登录]的授权URL
  // }, function(accessToken, refreshToken, profile, done){
  //   done(null, profile);
  // }));


  app.passport.verify(async (ctx, user) => {
    let userDoc;
    let alertMsg = '登录失败。';
    console.log("user",user);
    if (user.provider != 'local') {
      ctx.logger.debug('verify by OAuth:' + user.provider);
      // 1. OAuth by Github
      const authConditions = {
        uid: user.id,
        provider: user.provider,
      };
      // 查找授权文档
      let authDoc = await ctx.model.Authorization.findOne(authConditions);
      // 查找用户文档
      if (authDoc) {
        userDoc = await ctx.model.User.findById(authDoc.user);
      } else {
        // 创建匿名用户文档
        const conditions = {
          username: `${user.name}(G)`,
          email: user.profile._json.email,
          avatar: user.photo,
          github: user.profile.profileUrl,
        };
        userDoc = await ctx.service.user.signup(conditions);
        // 创建授权文档
        authConditions.user = userDoc.id;
        authDoc = await ctx.model.Authorization.create(authConditions);
      }
    } else {
      ctx.logger.debug('verify by Local');
      // 2. Local
      userDoc = await ctx.service.user.signin(user.username, user.password);
      // ctx.body = userDoc;
      // if (!userDoc) alertMsg = '用户名或密码不正确。';
    }
    // if (!userDoc) ctx.service.router.storeAlertMsg(alertMsg);
    return userDoc;
  });
  //序列化用户信息后存储进 session
  app.passport.serializeUser(async (ctx, user) => {
    // return user.id;
    console.log("user",JSON.stringify(user));
    return user.userid;
     
  });
  //反序列化后取出用户信息
  app.passport.deserializeUser(async (ctx, user) => {
    // const userDoc = await ctx.model.User.findOne({ _id: user }).populate('messages');
    // return userDoc;
    const userDoc = await ctx.service.user.findOneinUsers({ userid: user });
    // var user = {id: 1, username: 'admin', password: '123456'};
    return userDoc;
  });
};
