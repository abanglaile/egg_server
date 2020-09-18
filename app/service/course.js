const Service = require('egg').Service;

class CourseService extends Service {
  async getCourse() {
    const res = await this.app.mysql.get('course',{});
    return res;
  }

  async getStuCourse() {
    const course_list = await this.app.mysql.query('select course from course inneer join teacher_test tt ', {});
    course_list.map({

    })
  }

  async getCourseLabel() {
    const res = await this.app.mysql.select('course_label');
    return res;
  }

  async getStuCourse(student_id){
    const results = await this.app.mysql.query(`select cl.course_label,
    cl.course_label_name from group_student gs
    left join school_group sg on sg.stu_group_id = gs.stu_group_id
    left join course_label cl on cl.course_label = sg.course_label
    where gs.student_id = ?;`, [student_id]);

    return results;
  }

  async getStudentCourse(student_id){
    return await this.app.mysql.query(`select c.course_id, c,course_name
    from teacher_test tt inner join test_log tl on tt.test_id = tl.test_id and tl.student_id = ?
    inner join course c on tt.course_id = c.course_id`, [student_id]);
  }

}

module.exports = CourseService;
 