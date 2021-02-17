module.exports = app => {
  const { router, controller } = app;
  const { middlewares: m } = app;
  // console.log("controller :"+ controller);
  // router.get('/api/home', controller.home.index);
  // router.get('/about', m.isSignined(), controller.home.index);
  router.get('/api/getBookChapter', controller.entryexercise.getBookChapter);
  router.get('/api/getChapterKp', controller.entryexercise.getChapterKp);
  router.get('/api/getKpTagBykpid', controller.entryexercise.getKpTagBykpid);
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
  router.get('/api/get_xcx_auth',controller.auth.getXcxAuth);
  router.post('/api/get_stu_xcx_auth',controller.auth.getStuXcxAuth);
  router.get('/api/get_xcx_unionid',controller.auth.getXcxUnionid);
  router.get('/api/batchGetwxInfo',controller.auth.batchGetwxInfo);
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
  router.post('/api/submitFeedback', controller.student.submitFeedback);
  router.get('/api/getMyStudentRating', controller.student.getMyStudentRating);
  router.get('/api/getChapterKpStatus', controller.student.getChapterKpStatus);
  router.get('/api/getMyBookChapter', controller.student.getMyBookChapter);
  
  router.get('/api/getKpRatingHistory', controller.student.getKpRatingHistory);
  router.get('/api/getKpAbility', controller.student.getKpAbility);

  //个人中心
  router.post('/api/getStudentInfo',controller.student.getStudentInfo);
  router.get('/api/getUserInfo',controller.teacher.getUserInfo);
  router.post('/api/updateStuName',controller.student.updateStuName);
  router.post('/api/addStuGroupId',controller.student.addStuGroupId);

  /*微信小程序学生端个人中心开始*/
  router.get('/api/getMyStuGroupData',controller.student.getMyStuGroupData);
  router.get('/api/getMyRealname',controller.student.getMyRealname);
  router.get('/api/getCodeByGroupid', controller.school.getCodeByGroupid);
  router.get('/api/getGroupByCode', controller.school.getGroupByCode);
  router.post('/api/groupBind', controller.student.groupBind);
  /*微信小程序学生端个人中心结束*/
  
  /*微信小程序学生端学科*/
  router.get('/api/getStudentCourse', controller.student.getStudentCourse)
  router.post('/api/setDefaultCourse', controller.student.setDefaultCourse)
  router.get('/api/getStudentBook', controller.student.getStudentBook)
  router.post('/api/setDefaultBook', controller.student.setDefaultBook)
  router.get('/api/getCourseStatus', controller.student.getCourseStatus)
  router.get('/api/getBookChapterStatus', controller.student.getBookChapterStatus)
  /********/

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
  //路径管理
  router.get('/api/getStudentChapterNode', controller.teacher.getStudentChapterNode);

  router.get('/api/getTestTable', controller.teacher.getTestTable);
  router.post('/api/addNewTest', controller.teacher.addNewTest);
  router.post('/api/deleteOneTest', controller.teacher.deleteOneTest);
  router.post('/api/distributeTest', controller.teacher.distributeTest);
  router.post('/api/copyTest', controller.teacher.copyTest);
  router.get('/api/getTestDetail', controller.teacher.getTestDetail);
  router.get('/api/getTestInfoById', controller.teacher.getTestInfoById);
  router.get('/api/getTestKpResult', controller.teacher.getTestKpResult);
  router.get('/api/getTestResultInfo', controller.teacher.getTestResultInfo);
  router.get('/api/getXcxCode', controller.teacher.getXcxCode);

  router.get('/api/getStudentList', controller.teacher.getStudentList);
  router.get('/api/getStuCourse', controller.teacher.getStuCourse);
  router.get('/api/getStuPfCommentList', controller.teacher.getStuPfCommentList);
  router.post('/api/getStuKpCommentList', controller.teacher.getStuKpCommentList);

  router.get('/api/getClassHourTable', controller.teacher.getClassHourTable);
  //作业批改接口
  router.get('/api/getUncheckedExers', controller.teacher.getUncheckedExers);
  router.get('/api/getCheckedExers', controller.teacher.getCheckedExers);

  router.get('/api/getClassGroup', controller.teacher.getClassGroup);
  router.get('/api/getSchool', controller.teacher.getSchool);
  router.get('/api/getGroupData', controller.teacher.getGroupData);
  router.get('/api/getTeacherGroup', controller.teacher.getTeacherGroup);
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
  router.get('/api/accLessonAward', controller.teacher.accLessonAward);
  
  router.post('/api/addLessonAward', controller.teacher.addLessonAward);
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

  router.post('/api/addTask', controller.teacher.addTask);
  router.post('/api/addHomework', controller.teacher.addHomework);
  router.post('/api/relateHomework', controller.teacher.relateHomework);
  router.post('/api/deleteHomework', controller.teacher.deleteHomework);
  
  //router.post('/api/updateLessonGroup', controller.teacher.updateLessonGroup);
  router.post('/api/updateLessonLabel',controller.teacher.updateLessonLabel);
  router.post('/api/updateLessonTeacher',controller.teacher.updateLessonTeacher);
  router.post('/api/updateLessonAssistant',controller.teacher.updateLessonAssistant);
  //router.post('/api/updateLessonCourse',controller.teacher.updateLessonCourse);
  router.post('/api/updateLessonRange',controller.teacher.updateLessonRange);
  // router.post('/api/updateLessonLabel',controller.teacher.updateLessonLabel);
  router.post('/api/addNewLesson',controller.teacher.addNewLesson);
  router.post('/api/deleteOneLesson',controller.teacher.deleteOneLesson);

  router.post('/api/signLesson', controller.teacher.signLesson);
  router.post('/api/undoSignLesson', controller.teacher.undoSignLesson);

  router.get('/api/getTaskTable', controller.teacher.getTaskTable);
  router.get('/api/getTaskLogTable', controller.teacher.getTaskLogTable);
  router.post('/api/deleteOneTask', controller.teacher.deleteOneTask);
  router.get('/api/getTaskInfoById', controller.teacher.getTaskInfoById);
  router.get('/api/getTaskResultInfo', controller.teacher.getTaskResultInfo);
  router.get('/api/searchTaskSource', controller.teacher.searchTaskSource);
  router.post('/api/setVerifyRes',controller.teacher.setVerifyRes);
  router.post('/api/distributeNewHomeWork',controller.teacher.distributeNewHomeWork);
  
  router.get('/api/getStuInfoById', controller.teacher.getStuInfoById);

  router.post('/api/submitCheckAnswer', controller.teacher.submitCheckAnswer);

  //个人考试评价
  router.get('/api/getTestResult',controller.student.getTestResult);
  //教师、班级配置管理、合同管理
  router.get('/api/getTeacherList',controller.school.getTeacherList);
  // router.get('/api/getStuEvalBytest',controller.student.getStuEvalBytest);

  /****学校管理端：班级配置管理、合同管理**********/
  router.get('/api/getTeacherList',controller.school.getTeacherList);
  router.get('/api/getGroupTable',controller.school.getGroupTable);
  router.get('/api/getMyStuGroupData2',controller.student.getMyStuGroupData2);
  router.get('/api/getGroupOptionData',controller.school.getGroupOptionData);
  router.post('/api/updateGroupTeacher',controller.school.updateGroupTeacher);
  router.post('/api/changGroupState',controller.school.changGroupState);
  router.post('/api/addNewSchoolGroup',controller.school.addNewSchoolGroup);
  router.get('/api/getContractTable',controller.school.getContractTable);
  router.post('/api/updateGroupHour',controller.school.updateGroupHour);
  router.post('/api/getConsumeLesson',controller.school.getConsumeLesson);
  router.get('/api/searchStuName',controller.school.searchStuName);
  router.post('/api/addNewContract',controller.school.addNewContract);
  router.get('/api/getHistoryContract',controller.school.getHistoryContract);
  /********************************************/

  //game
  router.get('/api/getStuTasklog', controller.game.getStuTaskLog);
  router.get('/api/getTaskLog',controller.game.getTaskLog);
  router.get('/api/getExp', controller.game.getExp);
  router.post('/api/deleteTaskLog',controller.game.deleteTaskLog);
  router.post('/api/submitTaskLog',controller.game.submitTaskLog);
  router.post('/api/gainExp', controller.game.gainExp);
  

  // 增益
  router.get('/api/getBuffByID', controller.buff.getBuffByID);
  router.get('/api/getBuffByName', controller.buff.getBuffByName);
  router.post('/api/addBuff', controller.buff.addBuff);
  router.put('/api/updateBuff', controller.buff.updateBuff);
  router.delete('/api/deleteBuff', controller.buff.deleteBuff);
  // 虚拟自习室
  router.get('/api/getVirtualroom', controller.virtualroom.getVirtualroom);
  router.get('/api/getVirtualroomByID', controller.virtualroom.getVirtualroomByID);
  router.get('/api/getVirtualroomByName', controller.virtualroom.getVirtualroomByName);
  router.get('/api/getVirtualroomByAdmin', controller.virtualroom.getVirtualroomByAdmin);
  router.post('/api/addVirtualroom', controller.virtualroom.addVirtualroom);
  router.put('/api/updateVirtualroom', controller.virtualroom.updateVirtualroom);
  router.delete('/api/deleteVirtualroom', controller.virtualroom.deleteVirtualroom);
  // 签约
  router.post('/api/addVirtualroomSign', controller.virtualroom.addVirtualroomSign);
  router.get('/api/getVirtualroomSign', controller.virtualroom.getVirtualroomSign);
  // 增益管理
  router.post('/api/addVirtualroomBuff', controller.virtualroom.addVirtualroomBuff);
  router.get('/api/getVirtualroomBuff', controller.virtualroom.getVirtualroomBuff);
  
  //微信小程序
  router.get('/api/wxGetAllComment',controller.wxMiniProgram.wxGetAllComment);
  router.post('/api/wxPostComment',controller.wxMiniProgram.wxPostComment);

  router.post('/api/getStudentLesson',controller.parent.getStudentLesson);
  router.get('/api/getStudentGroup',controller.parent.getStudentGroup);

  // 家长学生绑定
  router.get('/api/getCodeByUserid', controller.parent.getCodeByUserid);
  router.get('/api/getUserByCode', controller.parent.getUserByCode);
  router.post('/api/parent', controller.parent.parentBond);
  router.delete('/api/parentUnBond', controller.parent.parentUnBond);
  router.get('/api/getBondStudent', controller.parent.getBondStudent);
};