const Service = require('egg').Service;

class TestLogService extends Service {

    async compare(property){//用于排序--降序
        return (a,b)=>(b[property]-a[property]);
    }
    
    async compareRise(property){//用于排序--升序
        return (a,b)=>(a[property]-b[property]);
    }

    async getStuNotFinishTest(student_id){
        const res = await this.app.mysql.query(`select t.*, u.nickname,s.start_time, s.finish_time, s.test_state, 
        s.correct_exercise,date_format(t.enable_time, '%m/%d') as formatdate
        from teacher_test t, test_log s,users u where s.student_id = ? and 
        u.userid = t.teacher_id and t.test_id = s.test_id and s.finish_time
        is null and (t.test_type = 1 or t.test_type = 3) and t.enable_time IS NOT NULL ORDER BY t.enable_time DESC;`
        , [student_id]);
        return res;
    }

    async getLessonContentTest(lesson_id){
        const res = await this.app.mysql.query(`select t.*, u.nickname, date_format(t.enable_time, '%m/%d') as formatdate
        from teacher_test t, lesson_content lc, users u 
        where lc.lesson_id = ? and lc.content_type = 3 and lc.resource = t.test_id and u.userid = t.teacher_id;`, lesson_id);
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

    //舍弃
    async submitTestLog(exercise_log){
        var delta_score = 0; 
        var correct = 0;
        for(var i = 0; i < exercise_log.length; i++){
            correct += exercise_log[i].exercise_state ? 1 : 0;
            delta_score += exercise_log[i].exercise_state ? 5 : 2;
        }
        var sta = ((correct/exercise_log.length)*100).toFixed(1);
        const res = await this.app.mysql.update('test_log', {
                finish_time: new Date(), 
                delta_score: delta_score,
                correct_exercise: correct,
                test_state: sta,
            }, {
            where: {
                test_id: exercise_log[0].test_id,
                student_id:exercise_log[0].student_id,
            }
        })
        const update_result = await this.app.mysql.query('update users set score = score + ? where userid = ?', [delta_score, exercise_log[0].student_id]);
        return {code: 0};
    }

    async isTestLogFinish(test_id, student_id, exindex){
        const logs = await this.app.mysql.query(`select tt.is_eval, e.exercise_id, e.exercise_index, el.exercise_status, el.exercise_state 
        from teacher_test tt, exercise_test e left join 
        (select distinct exercise_id, exercise_status, exercise_state from exercise_log 
            where test_id = ? and student_id = ?) el on e.exercise_id = el.exercise_id
            where e.test_id = ? and tt.test_id = ? order by e.exercise_index`, [test_id, student_id, test_id, test_id])
        let correct_exercise = logs[exindex].exercise_state == 1 ? 1 : 0, total_exercise = logs.length
        var next = -1
        var i = (exindex + 1) % logs.length
        while(i != exindex){
            if(logs[i].exercise_status == 2){
                i = ++i % logs.length
                if(logs[i].exercise_state == 1){
                    correct_exercise++
                }
            }else if(logs[i].exercise_status == 1 && !(logs[i].exercise_state >= 0)){
                //主观题
                i = ++i % logs.length
                next = -2
            }else{
                return i
            }             
        }
        if(next == -2){
            return -2
        }

        //test finish
        let result = {}
        if(logs[0].is_eval == 2){
            //学前测评
            result = await this.service.path.getPreTestResult(student_id, test_id)
            //可异步执行
            await this.service.path.finishPreTest(student_id, test_id)
        }
        console.log(result);
        var delta_score = total_exercise + correct_exercise * 2; 
        var sta = ((correct_exercise/total_exercise)*100).toFixed(1);
        
        const res = await this.app.mysql.update('test_log', {
                finish_time: new Date(), 
                delta_score: delta_score,
                correct_exercise: correct_exercise,
                total_exercise: total_exercise,//动态测试需要更改teacher_test题目数目
                test_state: sta,
                result: JSON.stringify(result),
            }, {
            where: {
                test_id: test_id,
                student_id: student_id,
            }
        })
        return -1
    }

    async checkTestLogFinish(test_id, student_id){
        const logs = await this.app.mysql.query(`select e.exercise_id, e.exercise_index, el.exercise_status, el.exercise_state from exercise_test e
        left join (select distinct exercise_id, exercise_status, exercise_state from exercise_log 
            where test_id = ? and student_id = ?) el on e.exercise_id = el.exercise_id
            where e.test_id = ?`, [test_id, student_id, test_id])

        let correct_exercise = 0, total_exercise = logs.length
        for(let i = 0; i < logs.length; i++){
            if(logs[i].exercise_state == 1){
                correct_exercise++
            }
            if(logs[i].exercise_status != 2)
                return 
        }
        var delta_score = total_exercise + correct_exercise * 2; 
        var sta = ((correct_exercise/total_exercise)*100).toFixed(1);
        const res = await this.app.mysql.update('test_log', {
                finish_time: new Date(), 
                delta_score: delta_score,
                correct_exercise: correct_exercise,
                total_exercise: total_exercise,//动态测试需要更改teacher_test题目数目
                test_state: sta,
            }, {
            where: {
                test_id: test_id,
                student_id: student_id,
            }
        })
    }

    async getTestLog(student_id, test_id){
        const res = await this.app.mysql.query('select t.*, tt.is_eval, tt.test_type, tt.test_config, tt.test_name, tt.course_id '
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


    async getTestDetail(test_id){
        //题目详情
        const res1 = await this.app.mysql.query(`select a.*,s.sample,s.answer as sample_answer,
        s.title_img_url as sam_title_img,s.title_audio_url as sam_title_audio from 
        (select e.* , b.sn,b.content ,b.presn ,b.kpid , t.kpname from exercise_test k, exercise e, 
        breakdown b, kptable t where k.test_id = ? and e.exercise_id = k.exercise_id and 
        b.exercise_id = e.exercise_id and b.kpid = t.kpid) as a LEFT JOIN  exercise_sample s on 
        a.exercise_id = s.exercise_id and s.sample_index = 0;`, test_id);
        //获取题目正确率
        const res2 = await this.app.mysql.query(`select l.exercise_state,l.student_id,
        l.exercise_id,g.realname from exercise_log l, users g where l.test_id = ? 
        and g.userid = l.student_id;`, test_id);
        //获取各知识点完成率
        const res3 = await this.app.mysql.query(`select g.sn,g.exercise_id,g.sn_state from
         breakdown_log g where g.test_id = ? and g.sn_state >=0;`, test_id);

        // var test_data = [];
        // var index_sn = [];
        // for(var i = 0; i < res1.length; i++){
        //     var e = res1[i];
        //     const index = index_sn[e.exercise_id.toString()];
        //     if(index >= 0){
        //         test_data[index].breakdown.push({
        //             sn :e.sn,
        //             content : e.content,
        //             presn: e.presn, 
        //             kpid : e.kpid,
        //             kpname : e.kpname,
        //         });
        //     }else{
        //         var breakdown = [{
        //             sn :e.sn,
        //             content : e.content,
        //             presn: e.presn, 
        //             kpid : e.kpid,
        //             kpname : e.kpname,
        //         }];
        //         test_data.push({
        //             exercise_id : e.exercise_id,
        //             title : e.title,
        //             answer : e.answer,
        //             type : e.exercise_type,
        //             title_img_url: e.title_img_url,
        //             title_audio_url:e.title_audio_url,
        //             correct_rate : 0, //此题正确率，需根据后面数据完善
        //             stu_false : [],  //该题错误的同学，需根据后面数据完善
        //             kp_rate : [],  // 每个sn（知识点）完成率，先为空
        //             breakdown : breakdown,
        //         });  
        //         index_sn[e.exercise_id.toString()] = test_data.length -1;
        //     }
        // }
        var test_data = [];
        var exercise_index = [];
        var list_index = 0;
        for(var i = 0; i < res1.length; i++){
            var e = res1[i];
            const index = exercise_index[e.exercise_id.toString()];
            console.log(i + " " + index);
            if(index >= 0){
                console.log(index);
                test_data[index].exercise.breakdown.push({
                    sn: e.sn, 
                    content: e.content, 
                    presn: e.presn, 
                    kpid: e.kpid,
                    kpname: e.kpname,
                });
            }else{
                var breakdown = [];
                breakdown.push({
                    sn: e.sn, 
                    content: e.content, 
                    presn: e.presn, 
                    kpid: e.kpid,
                    kpname: e.kpname,
                });
                var exercise = {
                    exercise_id: e.exercise_id, 
                    exercise_type: e.exercise_type, 
                    title: e.title, 
                    answer: JSON.parse(e.answer),
                    breakdown: breakdown,
                    title_img_url : e.title_img_url,
                    title_audio_url : e.title_audio_url,
                };
                var exercise_sample = {
                    sample : JSON.parse(e.sample),
                    answer : JSON.parse(e.sample_answer),
                    title_img_url : e.sam_title_img,
                    title_audio_url : e.sam_title_audio,
                };
                var one_exercise = {
                    exercise : exercise,
                    exercise_sample : exercise_sample,
                    correct_rate : 0, //此题正确率，需根据后面数据完善
                    stu_false : [],  //该题错误的同学，需根据后面数据完善
                    kp_rate : [],  // 每个sn（知识点）完成率，先为空
                };

                test_data[list_index] = one_exercise;
                exercise_index[e.exercise_id] = list_index;
                list_index++;
            }
        }
        var stu_res = [];
        var index_stu = [];
        for(var i = 0; i < res2.length; i++){
            var e = res2[i];
            const index = index_stu[e.exercise_id.toString()];
            if(index >= 0){
                stu_res[index].count++;
                stu_res[index].right = e.exercise_state? stu_res[index].right+1 : stu_res[index].right;
                if(e.exercise_state == 0 ){
                    stu_res[index].stu_false.push({
                        student_id : e.student_id,
                        student_name : e.realname,
                    });
                }
            }else{
                var count = 1;
                var right = e.exercise_state? 1 : 0;
                var stu_false = e.exercise_state? [] : [{
                        student_id : e.student_id,
                        student_name : e.realname,
                    }];
                stu_res.push({
                    exercise_id : e.exercise_id,
                    count : count,
                    right : right,
                    stu_false : stu_false,
                });  
                index_stu[e.exercise_id.toString()] = stu_res.length -1;
            }
        }

        var kp_res = []; 
        var index_exer = [];
        var index_correct = [];
        for(var i = 0; i < res3.length; i++){  //根据 exercise_id 以及 sn 确定该项目知识点完成率，先转换成便于计算的数组。
            var e = res3[i];
            const index = index_exer[e.exercise_id.toString()]; 
            const index2 = index_correct[e.exercise_id+'-'+e.sn]; 
            if(index >= 0){
                if(index2 >=0){//能唯一确定元素时
                    kp_res[index].sn_correct[index2].count++;
                    kp_res[index].sn_correct[index2].right = e.sn_state ? kp_res[index].sn_correct[index2].right +1 : kp_res[index].sn_correct[index2].right;
                    kp_res[index].sn_correct[index2].rate = Math.round((kp_res[index].sn_correct[index2].right / kp_res[index].sn_correct[index2].count)*100);
                }
                else{
                    var newsn = {
                        sn : e.sn,
                        count : 1,
                        right : e.sn_state>0 ? 1 : 0,
                        rate : Math.round((right/count)*100),
                    }
                    kp_res[index].sn_correct.push(newsn);                
                    index_correct[e.exercise_id+'-'+e.sn] = kp_res[index].sn_correct.length - 1; 
                }
            }else{
                var sn_correct = [{
                    sn : e.sn,
                    count : 1,
                    right : e.sn_state>0 ? 1 : 0,
                    rate : Math.round((right/count)*100),
                }];
                var group = {
                    exercise_id : e.exercise_id,
                    sn_correct : sn_correct,
                };
                kp_res.push(group);
                index_exer[e.exercise_id.toString()] = kp_res.length - 1;
                index_correct[e.exercise_id+'-'+e.sn] = 0; //hashmap 记录下新增元素在 sn_correct 里的位置
            }
        }
        console.log('kp_res---------------------------');
        for(var i = 0; i < kp_res.length; i++){  //将res3 中的知识点完成率赋予到 test_data 中
            var e = kp_res[i];
            const index = exercise_index[e.exercise_id.toString()];
            test_data[index].kp_rate = e.sn_correct;
        }
        console.log('stu_res---------------------------');
        for(var i = 0; i < stu_res.length; i++){  //将res2 中的题目正确率和该题错误的学生赋值给 test_data
            var e = stu_res[i];
            const index = exercise_index[e.exercise_id.toString()];
            if(e.count > 0){
                test_data[index].correct_rate = Math.round((e.right/e.count)*100);
            }else{
                test_data[index].correct_rate = 0;
            }
            test_data[index].stu_false = e.stu_false;
        }
        console.log("test_data",JSON.stringify(test_data));
        return test_data;
    }

    async getTestKpResult(test_id){
        const results = await this.app.mysql.query(`select b.kpid, k.kpname,l.student_id,g.realname,
        l.sn_state from breakdown b, breakdown_log l ,kptable k,users g where l.test_id = ? 
        and l.exercise_id = b.exercise_id and l.sn = b.sn and l.student_id = g.userid and 
        b.kpid = k.kpid and l.sn_state >= 0;`, test_id);

        var kp_data = [];
        var kp_index = [];
        var kp_stu = [];
        for(var i = 0; i < results.length; i++){
            var e = results[i];
            const index_kp = kp_index[e.kpid.toString()]; //kpid 知识点的索引
            const index_stu = kp_stu[e.kpid+'-'+e.student_id]; //知识点id以及学生id共同确定错误次数的索引
            if(index_kp >= 0){
                kp_data[index_kp].kp_count_all++;//此知识点测试次数加1
                if(index_stu >=0){//能唯一确定元素时
                    if(e.sn_state === 0){//当state 错误时,count 加1
                        kp_data[index_kp].stu_mistake[index_stu].stu_count++; 
                    }else{
                        kp_data[index_kp].kp_count++;//当state 正确时,kp_count 加1
                    }
                }
                else{//知识点id确定，stu id为新id时，需新增元素
                    if(e.sn_state === 1){
                        kp_data[index_kp].kp_count++; //正确次数加1
                    }
                    var newstu = {
                        student_id: e.student_id, 
                        student_name: e.realname, 
                        stu_count: e.sn_state>0 ? 0 : 1,
                        stu_rate:0,
                    }
                    kp_data[index_kp].stu_mistake.push(newstu);                
                    kp_stu[e.kpid+'-'+e.student_id] = kp_data[index_kp].stu_mistake.length - 1; //hashmap 记录下新增元素在 stu_mistake 里的位置
                }
            }else{//kpid 为新增id时
                var stu_mistake = [{
                    student_id: e.student_id, 
                    student_name: e.realname, 
                    stu_count : e.sn_state>0 ? 0 : 1,
                    stu_rate:0,
                }];
                var group = {
                    kpid: e.kpid, 
                    kpname: e.kpname, 
                    kp_count : e.sn_state>0 ? 1 : 0, //此知识点的正确次数（在单次测验中）
                    kp_count_all : 1,
                    kp_correct_rate: 0, //此知识点的正确率
                    stu_mistake: stu_mistake,
                };
                kp_data.push(group);
                kp_index[e.kpid.toString()] = kp_data.length - 1;
                kp_stu[e.kpid+'-'+e.student_id] = 0; //hashmap 记录下新增元素在 stu_mistake 里的位置
            }
        }
        // kp_data = kp_data.sort(compare('kp_count'));//将数组按 count大小进行排序
        for(var j=0;j< kp_data.length;j++){
            kp_data[j].kp_correct_rate = Math.round((kp_data[j].kp_count/kp_data[j].kp_count_all)*100);
            kp_data[j].stu_mistake=kp_data[j].stu_mistake.sort(this.compare('stu_count'));
            var  kp_num = (kp_data[j].kp_count_all)/(kp_data[j].stu_mistake.length);
            for(var i=0;i< kp_data[j].stu_mistake.length;i++){
                kp_data[j].stu_mistake[i].stu_rate = Math.round(((kp_num-kp_data[j].stu_mistake[i].stu_count)/kp_num)*100);
            }
        }

        return kp_data;
    }

    async getTestResultInfo(test_id){
        // console.log('getTestResultInfo  test_id: ',test_id);
        // const results = await this.app.mysql.query(`select sg.group_name,s.student_id,
        // s.finish_time,timestampdiff(MINUTE,s.start_time,s.finish_time) as time_consuming,
        // s.test_state,u.realname from test_log s, users u,group_student g,
        // school_group sg where s.test_id = ? and s.student_id = u.userid and 
        // g.student_id = s.student_id and g.stu_group_id = sg.stu_group_id;`, test_id);

        const results = await this.app.mysql.query(`select s.student_id,s.finish_time,
        timestampdiff(SECOND,s.start_time,s.finish_time) as time_consuming,s.test_state,u.realname from 
        test_log s, users u where s.test_id = ? and s.student_id = u.userid;`, test_id);

        console.log('results: ',results);
        var test_data = [];
        var completion_num = 0;//提交完成数
        var score_sum = 0;
        var time_sum = 0;
        var testRes = {
                test_data : test_data,
                completion_num : 0,
                completion_per : 0,
                correct_rate : 0,
                timeconsuming_per : 0,
            };
        for(var i = 0; i < results.length; i++){
            if(results[i].finish_time){
                completion_num++;
                score_sum = score_sum+results[i].test_state;
                time_sum = time_sum+parseFloat((results[i].time_consuming/60).toFixed(1));
            }
            test_data.push({
                student_id:results[i].student_id,
                groupname:results[i].group_name,
                studentname:results[i].realname,
                completion: results[i].finish_time? true : false,
                score:results[i].test_state,
                end_time:results[i].finish_time,
                time_consuming: parseFloat((results[i].time_consuming/60).toFixed(1)),
            });
        }
        testRes.completion_num = completion_num ;
        testRes.completion_per = Math.round((completion_num/results.length)*100)? Math.round((completion_num/results.length)*100):0;
        testRes.correct_rate = Math.round(score_sum/completion_num)? Math.round(score_sum/completion_num):0;
        testRes.timeconsuming_per = (time_sum/completion_num).toFixed(1);
        
        console.log('testRes: ',testRes);
        return testRes;
    }

    async getStuTestSurvey(student_id, test_id){
        const test_log = await this.getTestLog(student_id, test_id);
        const res = await this.app.mysql.get('users',{userid:student_id});
        const rating = await this.app.mysql.select('exercise_log', { 
            where: { 
                test_id: test_id, 
                student_id:student_id,
            }, // WHERE 条件
            orders: [['logid','desc']], 
        });
        var student_rating = 500;
        var delta_rating = 0;
        if(rating[0]){
            student_rating = rating[0].delta_student_rating + rating[0].old_student_rating;
        }
        for(var i=0;i<rating.length;i++){
            delta_rating += rating[i].delta_student_rating;
        }
        return({
            test_log: test_log,
            student_rating : student_rating,
            delta_rating : delta_rating,
            student_name : res.realname,
        });
    }

}
module.exports = TestLogService;