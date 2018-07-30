const Service = require('egg').Service;

class TestLogService extends Service {
    async getStuNotFinishTest(student_id){
        const res = await this.app.mysql.query(`select t.*, u.nickname,s.start_time, s.finish_time, s.test_state, 
        s.correct_exercise, s.total_exercise ,date_format(t.enable_time, '%m/%d') as formatdate
        from teacher_test t, test_log s,users u where s.student_id = ? and 
        u.userid = t.teacher_id and t.test_id = s.test_id and s.finish_time
        is null and t.test_type = 1 and t.enable_time IS NOT NULL ORDER BY t.enable_time DESC;`
        , [student_id]);
        return res;
    }

    async getStuTestLogs(student_id){
        const res = await this.app.mysql.query(`select t.*, s.start_time, s.finish_time, s.test_state, `
        +`s.correct_exercise, s.total_exercise ,date_format(s.finish_time,'%m/%d') as `
        +`formatdate from teacher_test t, test_log s where s.student_id = ? and `
        +`t.test_id = s.test_id and s.finish_time is not null ORDER BY s.finish_time DESC;`
        , [student_id]);
        return res;
    }
}
module.exports = TestLogService;