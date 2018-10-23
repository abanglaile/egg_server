const Service = require('egg').Service;

class CourseService extends Service {
  async getCourse() {
    const res = await this.app.mysql.select('course',{where : {course_id : 3}});
    return res;
  }

  async getSchoolCourse() {
    const res = await this.app.mysql.select('course');
    return res;
  }

}

module.exports = CourseService;
 