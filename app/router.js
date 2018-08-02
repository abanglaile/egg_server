module.exports = app => {
  const { router, controller } = app;
  const { middlewares: m } = app;
  console.log("controller :"+ controller);
  router.get('/', controller.home.index);
  router.get('/about', m.isSignined(), controller.home.index);
  router.get('/klmanager/getBookChapter', controller.entryexercise.getBookChapter);
  router.get('/klmanager/getChapterKp', controller.entryexercise.getChapterKp);
  router.get('/klmanager/getExerciseByKp', controller.entryexercise.getExerciseByKp);
  router.get('/klmanager/getExercise', controller.entryexercise.getExercise);
  router.get('/klmanager/getSampleList', controller.entryexercise.getSampleList);
  router.get('/klmanager/getCourse', controller.entryexercise.getCourse);
  router.post('/klmanager/addExercise', controller.entryexercise.addExercise);
  router.post('/klmanager/addOneSample', controller.entryexercise.addOneSample);
  router.post('/klmanager/updateOneSample', controller.entryexercise.updateOneSample);
  router.post('/klmanager/updateAllSample', controller.entryexercise.updateAllSample);
  router.post('/klmanager/updateExercise', controller.entryexercise.updateExercise);
  router.post('/klmanager/updateBreakdown', controller.entryexercise.updateBreakdown);

  router.post('/klmanager/renderly', controller.manager.renderly);
  router.post('/klmanager/saveTestMedia', controller.manager.saveTestMedia);
  router.post('/klmanager/queryMediaList', controller.manager.queryMediaList);
  router.post('/klmanager/searchMedia', controller.manager.searchMedia);

  // router.get('/klmanager/getMyLadderScore', controller.student.getMyLadderScore);

  // 1.user
  // r.get('/signup', c.user.new);
  // r.post('/signup', c.user.signup);

  // r.get('/signin', c.user.old);

  // const options = {
  //   successRedirect: '/',
  //   failureRedirect: '/signin',
  // };

  // passport-local
  const local = app.passport.authenticate('local');
  router.get('/signin', local);
  //weixin
  router.get('/klmanager/get_wx_auth',controller.auth.getWxAuth);
  //邀请码绑定
  router.post('/klmanager/check_invi_code',controller.auth.checkInviteCode);
  router.get('/klmanager/getHistoryTest', controller.student.getHistoryTest);
  router.get('/klmanager/getNotFinishTest', controller.student.getNotFinishTest);
  router.get('/klmanager/getMyTestData', controller.student.getMyTestData);
  router.get('/klmanager/getStuComUsedKp', controller.student.getStuComUsedKp);
  router.post('/klmanager/getMyTestStatus',controller.student.getMyTestStatus);
  //router.get('/klmanager/getMyBookChapter', controller.student.getMyBookChapter);

  router.post('/klmanager/submitExerciseLog', controller.student.submitExerciseLog);
  router.post('/klmanager/submitBreakdownLog', controller.student.submitBreakdownLog);
  router.get('/klmanager/getMyStudentRating', controller.student.getMyStudentRating);
  router.get('/klmanager/getChapterKpStatus', controller.student.getChapterKpStatus);
  router.get('/klmanager/getMyBookChapter', controller.student.getMyBookChapter);
  

  router.get('/klmanager/getCourseBook', controller.student.getCourseBook);

  //个人中心
  router.post('/klmanager/getStudentInfo',controller.student.getStudentInfo);
  //个人信息统计
  router.get('/klmanager/getStuAbility',controller.student.getStuAbility);
  router.get('/klmanager/getStuLadderWithTime',controller.student.getStuLadderWithTime);

  router.post('/klmanager/getTestStatus',controller.student.getTestStatus);
  router.post('/klmanager/getTestRankingList',controller.student.getTestRankingList);
  
};