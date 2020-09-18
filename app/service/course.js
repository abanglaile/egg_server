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

  getGradeName(grade){
    switch(grade){
      case 1: return "初中"
      case 2: return "高中"
      case 3: return "音乐理论"
    }
  }

  async getStudentCourse(student_id){
    const course_list = await this.app.mysql.query(`select distinct c.course_id, c.course_name, c.grade
    from teacher_test tt inner join test_log tl on tt.test_id = tl.test_id and tl.student_id = ?
    inner join course c on tt.course_id = c.course_id`, [student_id]);

    let default_course = await this.app.mysql.queryOne(`select c.course_id, c.course_name from default_course dc
    inner join course c on c.course_id = dc.course_id and dc.student_id = ? and is_default = 1`, [student_id])

    if(!course_list){
      return null
    }
    if(!default_course){
      default_course = course_list[0]
    }
    //grade分类
    let grade_list = []
    for(let i = 0; i < course_list.length; i++){
      const c = course_list[i]
      if(grade_list[c.grade]){
        grade_list[c.grade].course_list.push(c)
      }else{
        grade_list[c.grade] = {
          grade: this.getGradeName(c.grade),
          course_list: [c]
        }
      }
    }
    return {
      current_course: {
        course_id: default_course.course_id,
        course_name: default_course.course_name
      },
      grade_list: grade_list
    }
  }

  async setDefaultCourse(student_id, course_id){
    await this.app.mysql.query("update default_course set is_default = 0 where is_default = 1", [])
    const current_course = await this.app.mysql.queryOne(`select book_id, course_id from default_course where course_id = ? and student_id = ?`, [course_id, student_id])
    let sql = "insert into default_course (course_id, student_id, is_default) values (?, ?, 1)";
    if(current_course){
      sql = "update default_course set is_default = 1 where course_id = ? and student_id = ?";
    }
    await this.app.mysql.query(sql, [course_id, student_id])
    return await this.getStudentCourse(student_id) 
  }

}

module.exports = CourseService;
 