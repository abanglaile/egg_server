const Service = require('egg').Service;
const fs = require('fs');

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

    async copyExerciseTest(test_id,exercises){
        for(var i = 0; i < exercises.length; i++){
            const res = await this.app.mysql.insert('exercise_test', { 
                test_id : test_id,
                exercise_id : exercises[i].exercise_id,
                exercise_index : exercises[i].exercise_index,
            });
        }
        return test_id;
    }

    async addSomeTestLog(test_id, keys, total_exercise){
        let test_log = [];
        for(var i = 0; i < keys.length; i++){
            test_log.push({
                student_id: keys[i],
                test_id: test_id,
                total_exercise: total_exercise,
            })
        }
        const res = await this.app.mysql.insert("test_log", test_log);
        return res;
        // var sql = "";
        // var params = [];
        // console.log("student keys:" + keys);
        // for(var i = 0; i < keys.length; i++){
        //     sql = sql + "insert into test_log set ?;"
        //     params.push({student_id: keys[i], test_id: id,start_time:null,finish_time:null,test_state:null,correct_exercise:null,total_exercise:testsize});   
        // }
        // const res = await this.app.mysql.query(sql,params);
        // return res;
    }

    async getTestTable(teacher_id) {
        // const results = await this.app.mysql.query(`select t.test_id,t.test_name,t.enable_time from
        //  teacher_test t where t.teacher_id = ? ORDER BY t.group_time desc;`, [teacher_id]);
        // var test_data = [];
        // for(var i = 0; i < results.length; i++){
        //     var e = results[i];
        //     test_data.push({
        //         key:e.test_id,
        //         testname:e.test_name,
        //         teststate: e.enable_time ? 1 : 0,
        //         time: e.enable_time,
        //     });
        // }
        //res_test 测试信息，及每个测试待批改题数
        const res_test = await this.app.mysql.query(`select t.test_id,t.test_name,t.test_type,
            t.enable_time,count(c.logid) as uncheck_num from teacher_test t LEFT JOIN 
            exercise_log el on t.test_id = el.test_id LEFT JOIN 
            check_msg c on el.logid = c.logid and c.read = 0 where t.teacher_id = ? 
            GROUP BY t.test_id ORDER BY t.group_time desc;`, [teacher_id]);
        //res_check 需要批改的testid，包括已批改完毕的
        const res_check = await this.app.mysql.query(`select t.test_id from
            teacher_test t INNER JOIN  exercise_log el on t.test_id = el.test_id
            INNER JOIN check_msg c on el.logid = c.logid 
            where t.teacher_id = ? GROUP BY t.test_id;`, [teacher_id]);

        var test_data = [];
        for(var i = 0; i < res_test.length; i++){
            var e = res_test[i];
            test_data.push({
                key:e.test_id,
                testname:e.test_name,
                test_type:e.test_type,
                teststate: e.enable_time ? 1 : 0,
                time: e.enable_time,
                is_check: await this.is_check(res_check,e.test_id),//是否存在批改题目
                uncheck_num: e.uncheck_num,//未批改的题目
            });
        }        
        return test_data;
    }

    async is_check(res_check,test_id){
        if(res_check.length){
            for(var i = 0; i < res_check.length; i++){
                if(res_check[i].test_id == test_id){
                    return 1;
                }
            }
        }
        return 0;
    }

    async getTeacherTest(teacher_id) {
        return await this.app.mysql.select('teacher_test', {
            where: {teacher_id: teacher_id},
            orders: [['group_time', 'desc']],
            limit: 10,
        })
    }

    async addNewTest(req){
        const addres = await this.app.mysql.insert('teacher_test', { 
            test_name: req.test_name,
            teacher_id: req.teacher_id,
            // test_type: 1,
            total_exercise: req.test_exercise.length,
            course_id: req.course_id,
        });
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

    async distributeTest(test_id,keys,test_type){
        if(test_type == 1){//班组测试
            const upres = await this.app.mysql.query(`update teacher_test t set t.enable_time = 
            (SELECT now()) where test_id = ?;`, [test_id]);
            const test = await this.app.mysql.get('teacher_test',{ test_id : test_id });
            console.log("keys:",keys);
            const addres = await this.addSomeTestLog(test_id, keys, test.total_exercise);        
            return test.enable_time;
        }else{//公开测试
            const upres = await this.app.mysql.query(`update teacher_test t set t.enable_time = 
            (SELECT now()) ,t.test_type = 3 where test_id = ?;`, [test_id]);
            const test = await this.app.mysql.get('teacher_test',{ test_id : test_id });
            return test.enable_time;
        }
    }

    async copyTest(teacher_id, test_id, copy_name){
        const test = await this.app.mysql.get('teacher_test',{test_id : test_id});
        const newtest = await this.app.mysql.insert('teacher_test', { 
            test_name: copy_name,
            teacher_id: teacher_id,
            test_type: 1,
            total_exercise: test.total_exercise,
            course_id: test.course_id,
        });
        const test_exercise = await this.app.mysql.select('exercise_test',{
            where: {test_id : test_id},
        });
        const res = await this.copyExerciseTest(newtest.insertId,test_exercise);
        return newtest.insertId;
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

    async getXcxCode(test_id){
        const res = await this.app.mysql.get('teacher_test',{ test_id : test_id });
        if(res.xcx_code_url){
            return res.xcx_code_url;
        }
        const res_token = await this.app.mysql.get('access_token',{ token_type : 'xcx_stu' });
        var url = 'https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token='+res_token.access_token;
        var res_wxacode = await this.ctx.curl(url,{
            method: 'POST',
            contentType: 'json',
            data: {
                // page : 'pages/index/index',
                page : 'pages/test/test',
                scene : 'id='+test_id,
                width : 300,
                // scene : '',
            },
            // writeStream: fs.createWriteStream('./qrcode.txt'),
            // dataType:'json',
        });
        // console.log('res_wxacode:',JSON.stringify(res_wxacode));
        // console.log('all:',res_wxacode);
        // console.log('data:',res_wxacode.buffer);
        if(res_wxacode.status == 200){
            // return res_wxacode.data.data;
            var base64Img = res_wxacode.data.toString('base64');
            console.log('base64Img:',base64Img);
            // var decodeImg = Buffer.from(base64Img, 'base64'); 
            // const fileName = './qrcode.png';
            // fs.writeFileSync(fileName, decodeImg);
            return base64Img;
        }else{
            return '';
        }

    }

}

module.exports = TestService;
 