module.exports = app => {
  const { router, controller } = app;
  const { middlewares: m } = app;
  console.log("controller :"+ controller);
  router.get('/', controller.home.index);
  router.get('/about', m.isSignined(), controller.home.index);
  router.get('/api/getBookChapter', controller.entryexercise.getBookChapter);
  router.get('/api/getChapterKp', controller.entryexercise.getChapterKp);
  router.get('/api/getExerciseByKp', controller.entryexercise.getExerciseByKp);
  router.get('/api/getExercise', controller.entryexercise.getExercise);
  router.get('/api/getSampleList', controller.entryexercise.getSampleList);
  router.get('/api/getCourse', controller.entryexercise.getCourse);
  router.post('/api/addExercise', controller.entryexercise.addExercise);
  router.post('/api/addOneSample', controller.entryexercise.addOneSample);
  router.post('/api/updateOneSample', controller.entryexercise.updateOneSample);
  router.post('/api/updateAllSample', controller.entryexercise.updateAllSample);
  router.post('/api/updateExercise', controller.entryexercise.updateExercise);
  router.post('/api/updateBreakdown', controller.entryexercise.updateBreakdown);

  router.post('/api/renderly', controller.manager.renderly);
  router.post('/api/saveTestMedia', controller.manager.saveTestMedia);
  router.post('/api/queryMediaList', controller.manager.queryMediaList);
  router.post('/api/searchMedia', controller.manager.searchMedia);

  // router.get('/api/getMyLadderScore', controller.student.getMyLadderScore);

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
  // router.get('/api/get_wx_auth',controller.auth.getWxAuth);
  router.get('/api/get_wx_auth',controller.auth.getWxAuth);
  //邀请码绑定
  // router.post('/api/check_invi_code',controller.auth.checkInviteCode);
  router.post('/api/check_invi_code',controller.auth.checkInviteCode);
  router.get('/api/getHistoryTest', controller.student.getHistoryTest);
  router.get('/api/getNotFinishTest', controller.student.getNotFinishTest);
  router.get('/api/getMyTestData', controller.student.getMyTestData);
  router.get('/api/getStuComUsedKp', controller.student.getStuComUsedKp);
  router.post('/api/getMyTestStatus',controller.student.getMyTestStatus);
  //router.get('/api/getMyBookChapter', controller.student.getMyBookChapter);

  router.post('/api/submitExerciseLog', controller.student.submitExerciseLog);
  router.get('/api/getMyStudentRating', controller.student.getMyStudentRating);
  router.get('/api/getChapterKpStatus', controller.student.getChapterKpStatus);
  router.get('/api/getMyBookChapter', controller.student.getMyBookChapter);
  
  router.get('/klmanager/getKpRatingHistory', controller.student.getKpRatingHistory);
  router.get('/klmanager/getKpAbility', controller.student.getKpAbility);

  router.get('/api/getCourseBook', controller.student.getCourseBook);

  //个人中心
  router.post('/api/getStudentInfo',controller.student.getStudentInfo);
  //个人信息统计
  router.get('/api/getStuAbility',controller.student.getStuAbility);
  router.get('/api/getStuLadderWithTime',controller.student.getStuLadderWithTime);

  router.post('/api/getTestStatus',controller.student.getTestStatus);
  router.post('/api/getTestRankingList',controller.student.getTestRankingList);
  
};