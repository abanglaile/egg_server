const Service = require('egg').Service;

class TestService extends Service {

    async addExerciseTest(testid,exercises){
        var sql = "";
        var params = [];
        for(var i = 0; i < exercises.length; i++){
            sql = sql + "insert into exercise_test set ?;"
            params.push({test_id: testid, exercise_id: exercises[i], exercise_index: i});
        }
        const res = await this.app.mysql.query(sql,params);
        return res;
    }

    async addStudentTest(id,keys,testsize){
        var sql = "";
        var params = [];
        console.log("student keys:" + keys);
        for(var i = 0; i < keys.length; i++){
            sql = sql + "insert into test_log set ?;"
            params.push({student_id: keys[i], test_id: id,start_time:null,finish_time:null,test_state:null,correct_exercise:null,total_exercise:testsize});   
        }
        const res = await this.app.mysql.query(sql,params);
        return res;
    }

    async getTestTable(teacher_id) {

        const results = await this.app.mysql.query(`select t.test_id,t.test_name,t.enable_time from
         teacher_test t where t.teacher_id = ?;`, [teacher_id]);
        var test_data = [];
        for(var i = 0; i < results.length; i++){
            var e = results[i];
            test_data.push({
                key:e.test_id,
                testname:e.test_name,
                teststate: e.enable_time ? 1 : 0,
                time : e.enable_time,
            });
        }
        return test_data;
    }

    async addNewTest(req){

        const addres = await this.app.mysql.query(`insert into teacher_test set test_name=?,
         teacher_id=?,group_time=(SELECT now()),test_type=1,total_exercise=?;`, [req.test_name,req.teacher_id,req.test_exercise.length]);
        
        const res = await this.addExerciseTest(addres.insertId,req.test_exercise);


        return addres.insertId;
    }

    async deleteOneTest(test_id){

        const del1 = await this.app.mysql.delete('teacher_test', {
            test_id: test_id,
        });
        const del2 = await this.app.mysql.delete('exercise_test', {
            test_id: test_id,
        });
        return del2;
    }

    async distributeTest(test_id,keys){

        const upres = await this.app.mysql.query(`update teacher_test t set t.enable_time = 
        (SELECT now()) where test_id = ?;`, [test_id]);

        const time = await this.app.mysql.get('teacher_test',{ test_id : test_id });

        const len = await this.app.mysql.query(`select count(*) as size from 
        exercise_test where test_id = ?;`, [test_id]);

        const addres = await this.addStudentTest(test_id, keys, len[0].size);
        
        return time.enable_time;
    }

    async getTestInfoById(test_id){
        const res = await this.app.mysql.get('teacher_test',{ test_id : test_id });
        var test_info = [];
        test_info.push({
            testname: res.test_name,
            teststate: res.enable_time ? 1 : 0,
        });
        return test_info;
    }

  

}

module.exports = TestService;
 