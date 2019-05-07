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
  //本地图片上传与删除管理
  router.get('/api/getQiniuToken', controller.manager.getQiniuToken);
  router.post('/api/saveUploadUrl', controller.manager.saveUploadUrl);
  router.post('/api/deleteSelectedFile', controller.manager.deleteSelectedFile);
  
  //上传七牛图片
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
  //邀请码绑定,用户信息注册
  router.post('/api/check_invi_code',controller.auth.checkInviteCode);
  router.post('/api/set_userinfo',controller.auth.setUserInfo);
  router.post('/api/set_teacherinfo',controller.auth.setTeacherInfo);
  router.post('/api/set_stuinfo',controller.auth.setStuInfo);
  router.get('/api/getSclGroup',controller.auth.getSclGroup);

  router.get('/api/getHistoryTest', controller.student.getHistoryTest);
  router.get('/api/getNotFinishTest', controller.student.getNotFinishTest);
  router.get('/api/getMyTestData', controller.student.getMyTestData);
  router.get('/api/getStuPoorKp', controller.student.getStuPoorKp);
  router.post('/api/getMyTestStatus',controller.student.getMyTestStatus);
  
  router.post('/api/generateTestByKp', controller.student.generateTestByKp)
  //router.get('/api/getMyBookChapter', controller.student.getMyBookChapter);

  router.post('/api/submitExerciseLog', controller.student.submitExerciseLog);
  router.post('/api/submitBreakdownLog', controller.student.submitBreakdownLog);
  router.post('/api/submitTestLog', controller.student.submitTestLog);
  router.get('/api/getMyStudentRating', controller.student.getMyStudentRating);
  router.get('/api/getChapterKpStatus', controller.student.getChapterKpStatus);
  router.get('/api/getMyBookChapter', controller.student.getMyBookChapter);
  
  router.get('/api/getKpRatingHistory', controller.student.getKpRatingHistory);
  router.get('/api/getKpAbility', controller.student.getKpAbility);

  router.get('/api/getCourse', controller.student.getCourse);

  //个人中心
  router.post('/api/getStudentInfo',controller.student.getStudentInfo);
  router.get('/api/getUserInfo',controller.teacher.getUserInfo);
  router.post('/api/updateStuName',controller.student.updateStuName);
  router.post('/api/addStuGroupId',controller.student.addStuGroupId);
  

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
  router.post('/api/copyTest', controller.teacher.copyTest);
  router.get('/api/getTestDetail', controller.teacher.getTestDetail);
  router.get('/api/getTestInfoById', controller.teacher.getTestInfoById);
  router.get('/api/getTestKpResult', controller.teacher.getTestKpResult);
  router.get('/api/getTestResultInfo', controller.teacher.getTestResultInfo);

  router.get('/api/getClassGroup', controller.teacher.getClassGroup);
  router.get('/api/getSchool', controller.teacher.getSchool);
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
  
  router.get('/api/getStuTestStepAnalysis',controller.teacher.getStuTestStepAnalysis);//评测
  router.get('/api/getStuTestSurvey', controller.teacher.getStuTestSurvey);//学生测试的评测概要

  router.get('/api/getOptionData', controller.teacher.getOptionData);
  router.get('/api/getLinkageOptionData', controller.teacher.getLinkageOptionData);
  router.get('/api/searchPfLabel', controller.teacher.searchPfLabel);
  router.get('/api/searchKpLabel', controller.teacher.searchKpLabel);
  
  router.get('/api/getOneLesson', controller.teacher.getOneLesson);
  router.get('/api/getStudentOneLesson', controller.teacher.getStudentOneLesson);
  router.get('/api/getLessonStudent', controller.teacher.getLessonStudent);

  router.post('/api/getTeacherLesson', controller.teacher.getTeacherLesson);

  router.post('/api/deleteLessonKpComment', controller.teacher.deleteLessonKpComment);
  router.post('/api/addLessonKpComment', controller.teacher.addLessonKpComment);
  router.post('/api/updateKpComment', controller.teacher.updateKpComment);
  router.post('/api/getLessonKpComment', controller.teacher.getLessonKpComment);

  router.post('/api/deleteLessonPfComment', controller.teacher.deleteLessonPfComment);
  router.post('/api/addLessonPfComment', controller.teacher.addLessonPfComment);
  router.post('/api/updatePfComment', controller.teacher.updatePfComment);
  router.post('/api/getLessonPfComment', controller.teacher.getLessonPfComment);

  router.post('/api/addLessonContent', controller.teacher.addLessonContent);
  router.post('/api/deleteLessonContent', controller.teacher.deleteLessonContent);
  router.get('/api/searchTeacherTask', controller.teacher.searchTeacherTask);

  router.post('/api/addHomework', controller.teacher.addHomework);
  router.post('/api/relateHomework', controller.teacher.relateHomework);
  router.post('/api/deleteHomework', controller.teacher.deleteHomework);
  
  //router.post('/api/updateLessonGroup', controller.teacher.updateLessonGroup);
  router.post('/api/updateLessonTeacher',controller.teacher.updateLessonTeacher);
  router.post('/api/updateLessonAssistant',controller.teacher.updateLessonAssistant);
  //router.post('/api/updateLessonCourse',controller.teacher.updateLessonCourse);
  router.post('/api/updateLessonRange',controller.teacher.updateLessonRange);
  // router.post('/api/updateLessonLabel',controller.teacher.updateLessonLabel);
  router.post('/api/addNewLesson',controller.teacher.addNewLesson);
  router.post('/api/deleteOneLesson',controller.teacher.deleteOneLesson);

  router.post('/api/signLesson', controller.teacher.signLesson);

  router.get('/api/getTaskTable', controller.teacher.getTaskTable);
  router.post('/api/deleteOneTask', controller.teacher.deleteOneTask);
  router.get('/api/getTaskInfoById', controller.teacher.getTaskInfoById);
  router.get('/api/getTaskResultInfo', controller.teacher.getTaskResultInfo);
  router.get('/api/searchTaskSource', controller.teacher.searchTaskSource);
  router.post('/api/setVerifyRes',controller.teacher.setVerifyRes);
  router.post('/api/distributeNewHomeWork',controller.teacher.distributeNewHomeWork);
  
  router.get('/api/getStuInfoById', controller.teacher.getStuInfoById);

  //个人考试评价
  router.get('/api/getStuEvalBytest',controller.student.getStuEvalBytest);
  //教师班级配置管理
  router.get('/api/getTeacherList',controller.school.getTeacherList);

};