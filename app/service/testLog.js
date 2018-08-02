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

    async submitTestLog(exercise_log){
        var delta_score = 0; 
        for(var i = 0; i < exercise_log.length; i++){
            delta_score += exercise_log[i].exercise_state ? 5 : 2;
        }
        const res = await this.app.mysql.update('test_log', {finish_time: new Date(), delta_score: delta_score}, {
            where: {test_id: exercise_log[0].test_id}
        })
        const update_result = await this.app.mysql.query('update users set score = score + ? where userid = ?', [delta_score, exercise_log[0].student_id]);
        return {code: 0};
    }
}
module.exports = TestLogService;