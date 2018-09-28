const Service = require('egg').Service;

class slideService extends Service {

  async getLessonSlide(lesson_slide_id) {
    const res = await this.app.mysql.query(`select s.*, ls.lesson_id from slide s, lesson_slide ls 
    where ls.lesson_slide_id = ? and s.slide_id = ls.slide_id`, [lesson_slide_id]);
    if(!res[0]){
      return {}
    }
    const lesson_test = await this.service.testLog.getLessonTest(res[0].lesson_id);
    return {
      lesson_slide: res[0],
      lesson_test: lesson_test,
    }
  }

  async getLessonSlideFeedback(student_id, lesson_slide_id){
    const res = await this.app.mysql.select('slide_feedback',{
      where: { lesson_slide_id: lesson_slide_id }
    });
    const slide_feedback = [];
    for(var i = 0; i < res.length; i++){
      const index = res[i].indexh;
      const feedback = res[i].feedback ? 'Q' : 'L';
      if(slide_feedback[index]){
        slide_feedback[index][feedback]++;
      }else{
        slide_feedback[index] = {
          L: 0,
          Q: 0,
          my: -1,
        }
        slide_feedback[index][feedback]++;
      }
      if(student_id == res[i].userid){
        slide_feedback[index].my = res[i].feedback;
      }
    }
    return slide_feedback;
  }

}

module.exports = slideService;
 