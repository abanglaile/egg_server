const Service = require('egg').Service;

class slideService extends Service {

  async getLessonSlide(lesson_content_id) {
    const res = await this.app.mysql.query(`select s.*, lc.lesson_id from slide s, lesson_content lc 
    where lc.lesson_content_id = ? and s.slide_id = lc.resource and lc.content_type = 1;`, [lesson_content_id]);
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
    const res = await this.app.mysql.select(`slide_feedback`,{
      where: { lesson_content_id: lesson_content_id }
    });
    const slide_feedback = [];
    for(var i = 0; i < res.length; i++){
      const index = res[i].indexh;
      // const feedback = res[i].feedback ? 'Q' : 'L';
      if(slide_feedback[index]){
        slide_feedback[index].Q = slide_feedback[index].Q + 1;
      }else{
        slide_feedback[index] = {
          Q: 1,
          my: false,
        }
      }
      if(student_id == res[i].userid){
        slide_feedback[index].my = true;
      }
    }
    return slide_feedback;
  }

  async updateQFeedback(lesson_content_id, q, indexh, userid){
    //q为true,说明需要改为false，即删除这条记录；为false，说明需要改为true，需要增加一条记录
    if(q){
      const del1 = await this.app.mysql.delete('slide_feedback', {
        lesson_content_id : lesson_content_id,
        userid : userid,
        indexh : indexh,
      });
    }else{
      const add1 = await this.app.mysql.insert('slide_feedback', {
        lesson_content_id : lesson_content_id,
        userid : userid,
        indexh : indexh,

      });
    }
    return 1;
  }

  async getFeedbackStu(lesson_content_id, indexh){
    const res = await this.app.mysql.query(`select u.nickname  from slide_feedback s, 
                users u where s.lesson_content_id = ? and s.indexh = ? and
                 s.userid = u.userid;`, [lesson_content_id, indexh]);

    return res;
  }

}

module.exports = slideService;
 