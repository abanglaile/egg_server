const Service = require('egg').Service;

class CourseService extends Service {
  async getCourse() {
    const res = await this.app.mysql.get('course',{});
    return res;
  }

  async getSchoolCourse() {
    const res = await this.app.mysql.select('course_label');
    return res;
  }

}

module.exports = CourseService;
 