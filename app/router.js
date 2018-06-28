module.exports = app => {
  const { router, controller } = app;
  console.log("controller :"+ controller);
  router.get('/', controller.home.index);
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

  router.get('/klmanager/getMyLadderScore', controller.student.getMyLadderScore);

};