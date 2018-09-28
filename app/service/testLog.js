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

    async getLessonTest(lesson_id){
        const res = await this.app.mysql.query(`select t.*, u.nickname, date_format(t.enable_time, '%m/%d') as formatdate
        from teacher_test t, lesson_test lt, users u 
        where lt.lesson_id = ? and lt.test_id = t.test_id and u.userid = t.teacher_id;`, lesson_id);
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

    async getTestLog(student_id, test_id){
        const res = await this.app.mysql.query('select t.*, tt.test_type, tt.test_config, tt.test_name '
        +'from test_log t, teacher_test tt where t.student_id = ? and tt.test_id = t.test_id and t.test_id = ?;'
        , [student_id, test_id]);

        return res[0];
    }

    async getTestRankingList(test_id){
        const res = await this.app.mysql.query(`SELECT s.finish_time, s.start_time,
        timestampdiff(SECOND, s.start_time, s.finish_time) as time_consuming,
        s.correct_exercise, s.total_exercise, u.realname from test_log s,
        users u where s.test_id = ? and s.student_id = u.userid and 
        s.correct_exercise is not null and s.finish_time is not null ORDER BY correct_exercise DESC LIMIT 7`
        , test_id);
        
        return res;
    }

    async getTestStatus(test_id){      
        const test_log = await this.app.mysql.select('test_log', {where: {test_id: test_id}});
        const test_size = test_log[0].total_exercise;
        var accurracy = 0;//总答对数量
        var bingo = 0;
        var test_submit = 0;
        var time_sum = 0;
        for(var i = 0; i < test_log.length; i++){
            if(test_log[i].finish_time){
                accurracy += test_log[i].correct_exercise;//一共对了多少题
                let time_consuming = test_log[i].finish_time - test_log[i].start_time;
                test_submit++;
                time_sum = time_sum+time_consuming/1000;
            }
            if(test_log[i].test_state == 100){
                bingo++;
            }
        }
        const avg_accurracy = (accurracy/(test_submit))? (accurracy/(test_submit)).toFixed(1) : 0;
        const avg_timeconsuming = Math.round(time_sum/test_submit);
    
        return {
            avg_accurracy: avg_accurracy,//平均答对的题目数
            test_students: test_log.length,
            test_submit: test_submit,
            bingo: bingo,
            avg_timeconsuming: avg_timeconsuming,
        };
    }

}
module.exports = TestLogService;