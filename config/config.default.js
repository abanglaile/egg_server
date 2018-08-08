'use strict';


exports.security={
  csrf: {
    enable: false,
  },
};

exports.cors = {
  origin: '*',
  allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
  allowHeaders :'Content-Type,Content-Length, Authorization, Accept,X-Requested-With',
  credentials: true,
};

exports.keys = 'my-cookie-secret-key';

exports.mysql = {
    // 单数据库信息配置
    client: {
      // host
      host:'rm-wz9irm56yc8scnyy6o.mysql.rds.aliyuncs.com',
      user     : 'root',
      port     : '3306',
      password : '!QAZ2wsx',    
      database : 'knowledge',
      multipleStatements: true
    
    },
    // 是否加载到 app 上，默认开启
    app: true,
    // 是否加载到 agent 上，默认关闭
    agent: false,
  };


exports.redis = {

  client: {
    port: 6379,          // Redis port
    host: '119.23.41.237',   // Redis host
    // host: '127.0.0.1',   // Redis host
    password: '123456',
    db: 0,
  },
};

