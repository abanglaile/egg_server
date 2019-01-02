module.exports = app => {
  const { router, controller } = app;
  const { middlewares: m } = app;
  // console.log("controller :"+ controller);
  // router.get('/api/home', controller.home.index);
  // router.get('/about', m.isSignined(), controller.home.index);
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
  router.post('/api/signup', controller.auth.signup);

  // r.get('/signin', c.user.old);

  const options = {
    successRedirect: '/api/authsuc',
    failureRedirect: '/api/authfail',
  };
  router.get('/api/authsuc',controller.home.authsuc);
  router.get('/api/authfail',controller.home.authfail);
  // passport-local
  const local = app.passport.authenticate('local',options);
  // router.get('/api/login', local);
  router.post('/api/login', controller.auth.login);
  //weixin
  // router.get('/api/get_wx_auth',controller.auth.getWxAuth);
  router.get('/api/get_wx_auth',controller.auth.getWxAuth);
  //邀请码绑定
  router.post('/api/check_invi_code',controller.auth.checkInviteCode);
  router.post('/api/set_userinfo',controller.auth.setUserInfo);

  router.get('/api/getHistoryTest', controller.student.getHistoryTest);
  router.get('/api/getNotFinishTest', controller.student.getNotFinishTest);
  router.get('/api/getMyTestData', controller.student.getMyTestData);
  router.get('/api/getStuPoorKp', controller.student.getStuPoorKp);
  router.post('/api/getMyTestStatus',controller.student.getMyTestStatus);
  router.post('/api/generateTestByKp', controller.student.generateTestByKp)
  //router.get('/api/getMyBookChapter', controller.student.getMyBookChapter);

  router.post('/api/submitExerciseLog', controller.student.submitExerciseLog);
  router.post('/api/submitTestLog', controller.student.submitTestLog);
  router.get('/api/getMyStudentRating', controller.student.getMyStudentRating);
  router.get('/api/getChapterKpStatus', controller.student.getChapterKpStatus);
  router.get('/api/getMyBookChapter', controller.student.getMyBookChapter);
  
  router.get('/api/getKpRatingHistory', controller.student.getKpRatingHistory);
  router.get('/api/getKpAbility', controller.student.getKpAbility);

  router.get('/api/getCourse', controller.student.getCourse);

  //个人中心
  router.post('/api/getStudentInfo',controller.student.getStudentInfo);
  
  //个人信息统计
  router.get('/api/getStuAbility',controller.student.getStuAbility);
  router.get('/api/getStuRatingHistory', controller.student.getStuRatingHistory);
  router.get('/api/getStuComUsedKp', controller.student.getStuComUsedKp);
  router.get('/api/getStuRecentKp', controller.student.getStuRecentKp);
  router.get('/api/getKpWithScore', controller.student.getKpWithScore);

  router.get('/api/getTestRatingReward', controller.student.getTestRatingReward);
  router.post('/api/getTestStatus', controller.student.getTestStatus);
  router.post('/api/getTestRankingList', controller.student.getTestRankingList);
  
  /*教师端接口*/
  router.get('/api/getTestTable', controller.teacher.getTestTable);
  router.post('/api/addNewTest', controller.teacher.addNewTest);
  router.post('/api/deleteOneTest', controller.teacher.deleteOneTest);
  router.post('/api/distributeTest', controller.teacher.distributeTest);
  router.get('/api/getTestDetail', controller.teacher.getTestDetail);
  router.get('/api/getTestInfoById', controller.teacher.getTestInfoById);
  router.get('/api/getTestKpResult', controller.teacher.getTestKpResult);
  router.get('/api/getTestResultInfo', controller.teacher.getTestResultInfo);

  router.get('/api/getClassGroup', controller.teacher.getClassGroup);
  router.get('/api/getGroupData', controller.teacher.getGroupData);
  router.get('/api/getStudentGroup', controller.teacher.getStudentGroup);
  router.post('/api/addNewGroup', controller.teacher.addNewGroup);
  router.post('/api/deleteOneGroup', controller.teacher.deleteOneGroup);
  router.post('/api/deleteOneStudent', controller.teacher.deleteOneStudent);
  router.post('/api/addOneStudent', controller.teacher.addOneStudent);

  router.get('/api/getBookChapter', controller.teacher.getBookChapter);
  router.get('/api/getChapterKp', controller.teacher.getChapterKp);

  router.get('/api/getLessonSlide', controller.slide.getLessonSlide);
  router.get('/api/getLessonSlideFeedback', controller.slide.getLessonSlideFeedback);
  router.post('/api/updateQFeedback', controller.slide.updateQFeedback);
  router.get('/api/getFeedbackStu', controller.slide.getFeedbackStu);

  router.get('/api/getOptionData', controller.teacher.getOptionData);
  router.get('/api/searchKp', controller.teacher.searchKp);
  router.get('/api/getTeacherLesson', controller.teacher.getTeacherLesson);
  router.get('/api/getOneLesson', controller.teacher.getOneLesson);
  
  router.get('/api/getLessonTweet', controller.teacher.getLessonTweet);

  router.post('/api/addTweet', controller.teacher.addTweet);
  router.post('/api/deleteTweet', controller.teacher.deleteTweet);

  router.post('/api/deleteTeacherComment', controller.teacher.deleteTeacherComment);
  router.post('/api/addTeacherComment', controller.teacher.addTeacherComment);
  router.post('/api/addLessonContent', controller.teacher.addLessonContent);
  router.post('/api/updateLessonContent', controller.teacher.updateLessonContent);
  router.post('/api/deleteLessonContent', controller.teacher.updateLessonContent);

  router.post('/api/addHomework', controller.teacher.addHomework);
  router.post('/api/updateHomework', controller.teacher.updateHomework);
  router.post('/api/deleteHomework', controller.teacher.deleteHomework);
  
  router.post('/api/updateLessonGroup', controller.teacher.updateLessonGroup);
  router.post('/api/updateLessonTeacher',controller.teacher.updateLessonTeacher);
  router.post('/api/updateLessonCourse',controller.teacher.updateLessonCourse);
  router.post('/api/updateLessonRange',controller.teacher.updateLessonRange);
  router.post('/api/updateLessonLabel',controller.teacher.updateLessonLabel);
  
  router.get('/api/getStuInfoById', controller.teacher.getStuInfoById);
};