const Service = require('egg').Service;

class slideService extends Service {

  async getLessonSlide(lesson_content_id) {
    const res = await this.app.mysql.query(`select s.*, ls.lesson_id from slide s, lesson_content lc 
    where lc.lesson_content_id = ? and s.slide_id = ls.slide_id`, [lesson_content_id]);
    if(!res[0]){
      return {}
    }
    const lesson_test = await this.service.testLog.getLessonContentTest(res[0].lesson_id);
    return {
      lesson_slide: res[0],
      lesson_test: lesson_test,
    }
  }

  async getLessonSlideFeedback(student_id, lesson_content_id){
    const res = await this.app.mysql.query(`slide_feedback`,{
      where: { lesson_content_id: lesson_content_id }
    });
    const slide_feedback = [];
    for(var i = 0; i < res.length; i++){
      const index = res[i].indexh;
      const feedback = res[i].feedback ? 'Q' : 'L';
      if(slide_feedback[index]){
        slide_feedback[index][Q]++;
      }else{
        slide_feedback[index] = {
          Q: 0,
          my: false,
        }
        slide_feedback[index][feedback]++;
      }
      if(student_id == res[i].userid){
        slide_feedback[index].my = true;
      }
    }
    return slide_feedback;
  }

}

module.exports = slideService;
 