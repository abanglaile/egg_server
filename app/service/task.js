const Service = require('egg').Service;

class TaskService extends Service {

    // async addExerciseTest(testid,exercises){
    //     var sql = "";
    //     var params = [];
    //     for(var i = 0; i < exercises.length; i++){
    //         sql = sql + "insert into exercise_test set ?;"
    //         params.push({test_id: testid, exercise_id: exercises[i], exercise_index: i});
    //     }
    //     const res = await this.app.mysql.query(sql,params);
    //     return res;
    // }

    // async addSomeTestLog(test_id, keys, total_exercise){
    //     let test_log = [];
    //     for(var i = 0; i < keys.length; i++){
    //         test_log.push({
    //             student_id: keys[i],
    //             test_id: test_id,
    //             total_exercise: total_exercise,
    //         })
    //     }
    //     const res = await this.app.mysql.insert("test_log", test_log);
    //     return res;
    // }

    async getTaskTable(teacher_id) {
        const results = await this.app.mysql.query(`select t.*,s.source_name from task t ,task_source s 
        where t.create_user = ? and t.source_id = s.source_id order by t.create_time desc;`, [teacher_id]);
    
        return results;
    }

    // async getTeacherTest(teacher_id) {
    //     return await this.app.mysql.select('teacher_test', {
    //         where: {teacher_id: teacher_id},
    //         orders: [['group_time', 'desc']],
    //         limit: 10,
    //     })
    // }

    // async addNewTest(req){
    //     console.log("req",JSON.stringify(req));
    //     const addres = await this.app.mysql.query(`insert into teacher_test set test_name=?,
    //      teacher_id=?,group_time=(SELECT now()),test_type=1,total_exercise=?;`, [req.test_name,req.teacher_id,req.test_exercise.length]);
        
    //     const res = await this.addExerciseTest(addres.insertId,req.test_exercise);

    //     console.log("addres.insertId",addres.insertId);
    //     return addres.insertId;
    // }

    async deleteOneTask(taskid){

        const del1 = await this.app.mysql.delete('task', {
            task_id: taskid,
        });
        const del2 = await this.app.mysql.delete('task_log', {
            task_id: taskid,
        });
        return del2;
    }

    // async distributeTest(test_id,keys){
    //     const upres = await this.app.mysql.query(`update teacher_test t set t.enable_time = 
    //     (SELECT now()) where test_id = ?;`, [test_id]);
    //     const test = await this.app.mysql.get('teacher_test',{ test_id : test_id });
    //     console.log("keys:",keys);
    //     const addres = await this.addSomeTestLog(test_id, keys, test.total_exercise);        
    //     return test.enable_time;
    // }

    async getTaskInfoById(task_id){

        const results = await this.app.mysql.query(`select t.*,s.source_name from task t,
        task_source s where t.source_id = s.source_id and t.task_id = ?; `, [task_id]);

        return results[0];
    }
}

module.exports = TaskService;
 