const Service = require('egg').Service;
const { promisify } = require('util');

class ExerciseLogService extends Service {
    //利用elo_rating方法更新rating
    elo_rating(Ra, Rb){
        const m = (Rb - Ra)/400;
        return 1/(1 + Math.pow(10, m));
    }

    async updateKpRating(breakdown_sn){
        const K = 128;
        for(var j = 0; j < breakdown_sn.length; j++){
            var log = breakdown_sn[j];
            //只记录已评估的知识点
            if(log.sn_state >= 0){
                //学生知识点与知识点在题目中体现的难度变化
                const kp_SA = log.sn_state ? 1 : 0;
                const sn_SA = log.sn_state ? 0 : 1;
                
                let student_chapter = await this.app.mysql.queryOne(`select k.chapterid, sc.chapter_rating from kptable k left join student_chapter sc
                    on sc.student_id = ? and k.chapterid = sc.chapterid where k.kpid = ?`, [log.student_id, log.kpid]);
                const chapter_old_rating = student_chapter.chapter_rating ? student_chapter.chapter_rating : 500;
                const chapter_delta = this.elo_rating(chapter_old_rating, log.sn_old_rating);
                const chapter_delta_rating = K*(kp_SA - chapter_delta);
                const chapter_result = await this.app.mysql.query(`replace into student_chapter 
                    (student_id, chapter_rating, chapterid) VALUES(?,?,?);`
                    ,[log.student_id, (chapter_old_rating + chapter_delta_rating), student_chapter.chapterid]);

                const kp_delta = this.elo_rating(log.kp_old_rating, log.sn_old_rating);
                const sn_delta = this.elo_rating(log.sn_old_rating, log.kp_old_rating);
                log.kp_delta_rating = K*(kp_SA - kp_delta);
                log.sn_delta_rating = K*(sn_SA - sn_delta);
            }else{
                log.kp_delta_rating = 0;
                log.sn_delta_rating = 0;
            }
        }
        return breakdown_sn;
    }

    async submitBreakdownLog(exercise_log){
        let breakdown_sn = exercise_log.breakdown_sn;
        breakdown_sn = await this.updateKpRating(breakdown_sn);
        const insert_result = await this.app.mysql.insert('breakdown_log', breakdown_sn);
        const update_result = await this.app.mysql.update('exercise_log', {exercise_status: 2},
            {where: {logid: exercise_log.logid}});
        
        exercise_log.exercise_status = 2;
        exercise_log.breakdown_sn = breakdown_sn;
        return exercise_log;
    }

    async getMyTestStatus(student_id, test_id) {
        const test_kp = await this.app.mysql.query(`select count(b.kpid) as count, ks.kp_standard, b.kpid, kt.kpname, sk.kp_rating, sk.practice, sk.correct from exercise_test t, 
        exercise e, kptable kt, breakdown b LEFT JOIN student_kp sk on sk.kpid = b.kpid and student_id = ?
        left join kp_standard ks on ks.kpid = b.kpid 
        where t.test_id = ? and t.exercise_id = e.exercise_id 
        and e.exercise_id = b.exercise_id and kt.kpid = b.kpid group by b.kpid`, [student_id,test_id]);

        // const test_log = this.service.testLog.getTestLog(student_id, test_id);
        // const exercise_log = this.app.mysql.query(`select et.*, el.exercise_state from exercise_test et left join exercise_log el
        //     on et.exercise_id = el.exercise_id and el.student_id = ? where et.test_id = ? order by et.exercise_index`, 
        //     [student_id, test_id]); 
        return test_kp;
    }

    //当学生student_chapter表中没有存储chapter standard时，设定chapter standard初始值
    defaultChapterRating(chapterid){
        return 500
    }
    
    //查询做题步骤分析
    async getStuTestStepAnalysis(student_id, test_id){
        const query_result = await this.app.mysql.query(
            `select bk.kpname, bk.sn_state,bk.kp_delta_rating,ks.kp_standard, sk.kp_rating,kt.chapterid, c.chaptername,cs.chapter_standard,sc.chapter_rating from breakdown_log bk 
            INNER JOIN student_kp sk on bk.student_id =sk.student_id and bk.kpid = sk.kpid
            INNER JOIN kp_standard ks on bk.kpid = ks.kpid
            INNER JOIN kptable kt on bk.kpid = kt.kpid 
            INNER JOIN chapter c on kt.chapterid = c.chapterid 
            INNER JOIN chapter_standard cs on cs.chapterid = c.chapterid 
			LEFT JOIN student_chapter sc on sc.student_id = bk.student_id and sc.chapterid = kt.chapterid
            where bk.student_id = ? and bk.test_id = ? ORDER BY kt.chapterid,bk.kpname`,[student_id,test_id]
        ) 
        //归类KP，汇总数据
        let result = [];
        let now_chapter_id;
        let now_kp_name;
        let chapter_length=0;
        let kp_length=0;
        query_result.forEach(element => {
            if (now_chapter_id != element.chapterid){
                //不同chapter，新建一个新的chapter数组且更新chapterid
                result.push({
                    'chapter_id':element.chapterid,
                    'chapter_name':element.chaptername,
                    'chapter_ratting': ((element.chapter_rating!=null?element.chapter_rating:this.defaultChapterRating(element.chapter_id))/element.chapter_standard)*100,
                    'chapter_correct_percent': 0,
                    'chapter_correct_times': 0,
                    'chapter_exercise_times': 0,
                    'kp_status':[
                        {
                            'kp_name': element.kpname,
                            'kp_delta_rating':0,
                            'kp_correct_percent': 0,
                            'kp_correct_times': 0,
                            'kp_exercise_times': 0,
                            'kp_rating':element.kp_rating,
                            'kp_standard':element.kp_standard,
                            'kp_correct_rating': ((element.kp_rating/element.kp_standard)*100),
                        }
                    ]
                });
                now_chapter_id = element.chapterid
            } else if (now_kp_name != element.kpname){
                //不同KP，新建一个KP数组且更新KPname
                result[chapter_length-1].kp_status.push(
                    {
                        'kp_name': element.kpname,
                        'kp_delta_rating':0,
                        'kp_correct_percent': 0,
                        'kp_correct_times': 0,
                        'kp_exercise_times': 0,
                        'kp_rating':element.kp_rating,
                        'kp_standard':element.kp_standard,
                        'kp_correct_rating': ((element.kp_rating/element.kp_standard)*100).toFixed(1),
                    }
                )
            }
            now_kp_name = element.kpname;
            chapter_length = result.length;
            kp_length = result[chapter_length-1].kp_status.length;
            if (element.sn_state != -1){
                //更新正确题目数
                result[chapter_length-1].kp_status[kp_length-1].kp_correct_times += element.sn_state;
                result[chapter_length-1].chapter_correct_times += element.sn_state;
                //更新题目数量
                result[chapter_length-1].chapter_exercise_times++;
                result[chapter_length-1].kp_status[kp_length-1].kp_exercise_times++;
                //更新delta_rating
                result[chapter_length-1].kp_status[kp_length-1].kp_delta_rating += element.kp_delta_rating;
            }
        });
        // 循环计算KP正确率
        for (var i=0;i<result.length;i++){
            var chapter_correct_percent_tmp = (result[i].chapter_correct_times/result[i].chapter_exercise_times)*100;
            result[i].chapter_correct_percent = chapter_correct_percent_tmp.toFixed(1);
            result[i].kp_status.forEach(element => {
                var kp_correct_percent_tmp = (element.kp_correct_times/element.kp_exercise_times)*100;
                element.kp_correct_percent= kp_correct_percent_tmp.toFixed(1);
            });
        }
        return result;
    }

    async submitExerciseLog(exercise_log) {
        const exercise_rating = exercise_log.old_exercise_rating;
        const student_id = exercise_log.student_id;
        exercise_log.submit_time = new Date();
        let kp_exercise = await this.app.mysql.get('kp_exercise', {exercise_id: exercise_log.exercise_id});
        
        let student_rating = this.service.rating.getStudentRating(student_id, kp_exercise.course_id);
        // let chapter_rating = this.app.mysql.get('student_chapter', {student_id: student_id, chapterid: kp_exercise.chapterid});

        student_rating = await student_rating;
        // chapter_rating = await chapter_rating;

        student_rating = student_rating ? student_rating : 500;
        //chapter_rating = chapter_rating ? chapter_rating.chapter_rating : 500;
        
        const result = exercise_log.exercise_state;

        //计算学生、章节、题目得分
        const st_delta = this.elo_rating(student_rating, exercise_rating);
        const ex_delta = this.elo_rating(exercise_rating, student_rating);
        //const ch_delta = this.elo_rating(chapter_rating, exercise_rating);
        console.log("st_delta ",st_delta);

        const K = 128;
        const ex_SA = result ? 0 : 1;
        const st_SA = result ? 1 : 0;

        // const delta_chapter_rating = Math.ceil(K*(st_SA - ch_delta));

        exercise_log.old_student_rating = student_rating
        exercise_log.delta_exercise_rating = Math.ceil(K*(ex_SA - ex_delta))
        exercise_log.delta_student_rating = Math.ceil(K*(st_SA - st_delta));
        exercise_log.exercise_status = result ? 2 : 1;//题目正确不需要再反馈

        var answer = exercise_log.answer;
        exercise_log.answer = JSON.stringify(exercise_log.answer);
        var breakdown_sn = exercise_log.breakdown_sn;
        delete exercise_log.breakdown_sn;
        const insert_result = await this.app.mysql.insert('exercise_log', exercise_log);

        //更新学生总体、章节天梯分
        const rating_history_result = await this.app.mysql.insert('student_rating_history', {
            student_id: student_id,
            student_rating: student_rating + exercise_log.delta_student_rating,
            course_id: kp_exercise.course_id,
        })
        const rating_result = await this.app.mysql.query(`replace into student_rating
            (student_id,student_rating ,course_id) VALUES(?,?,?)`
         ,[student_id,(student_rating + exercise_log.delta_student_rating),kp_exercise.course_id]);

        // console.log("chapter_rating ",chapter_rating);
        // console.log("delta_chapter_rating", delta_chapter_rating);
        // const chapter_result = await this.app.mysql.query(`replace into student_chapter 
        // (student_id,chapter_rating ,chapterid) VALUES(?,?,?);`
        // ,[student_id,(chapter_rating + delta_chapter_rating),kp_exercise.chapterid]);

        exercise_log.logid = insert_result.insertId;
        //async
        this.app.mysql.insert('exercise_log_trigger', {logid: exercise_log.logid});

        for(var i = 0; i < breakdown_sn.length; i++){
            breakdown_sn[i].logid = exercise_log.logid;
            if(result){
                breakdown_sn[i].sn_state = 1;
            }else if(breakdown_sn.length == 1){
                breakdown_sn[i].sn_state = 0;
            }    
        }
        exercise_log.breakdown_sn = breakdown_sn;
        exercise_log.answer = answer;
        if(result || breakdown_sn.length == 1)
            exercise_log = await this.submitBreakdownLog(exercise_log);
        
        return exercise_log; 
    }

    async getTestExerciseLog(test_id, student_id){
        const breakdown_log = await this.app.mysql.query(`select bl.*, el.* ,k.kpname, es.sample, 
        es.answer as s_answer, es.title_img_url,es.title_audio_url,  
        et.exercise_index from exercise_log el left join exercise_sample es on
        es.exercise_id = el.exercise_id and es.sample_index = el.sample_index 
        left join breakdown_log bl on bl.logid = el.logid left join kptable k on k.kpid = bl.kpid,
        exercise_test et where et.test_id = el.test_id
        and et.exercise_id = el.exercise_id and el.student_id = ? and el.test_id = ?;`
        , [student_id, test_id]);

        var exercise_log = [];
        for(var i = 0; i < breakdown_log.length; i++){
            const b = breakdown_log[i];
            var index = b.exercise_index;
            if(exercise_log[index]){
                if(exercise_log[index].exercise_status == 1)
                    continue;
                
                exercise_log[index].breakdown_sn[b.sn-1] = {
                    student_id: b.student_id,
                    test_id: b.test_id,
                    exercise_id: b.exercise_id,
                    sn: b.sn,
                    sn_state: b.sn_state,
                    kpid: b.kpid,
                    kpname: b.kpname,
                    kp_old_rating: b.kp_old_rating,
                    kp_delta_rating: b.kp_delta_rating,
                }                
            }else{
                exercise_log[index] = {
                    logid: b.logid,
                    student_id: b.student_id,
                    test_id: b.test_id,
                    exercise_id: b.exercise_id,
                    exercise_state: b.exercise_state,
                    exercise_status: b.exercise_status,
                    start_time: b.start_time,
                    submit_time: b.submit_time,
                    answer: JSON.parse(b.answer),
                    sample_index: b.sample_index,
                    delta_student_rating: b.delta_student_rating,
                    //sample : b.sample ? b.sample : {},
                    exercise_sample : {
                        sample : b.sample,
                        answer : JSON.parse(b.s_answer),
                        title_img_url : b.title_img_url,
                        title_audio_url : b.title_audio_url,
                    },
                    breakdown_sn:[],
                };
                if(exercise_log[index].exercise_status == 1)
                    continue;
                
                exercise_log[index].breakdown_sn[b.sn-1] = {
                    student_id: b.student_id,
                    test_id: b.test_id,
                    exercise_id: b.exercise_id,
                    sn: b.sn,
                    sn_state: b.sn_state, 
                    kpid: b.kpid,
                    kpname: b.kpname,
                    kp_old_rating: b.kp_old_rating,
                    kp_delta_rating: b.kp_delta_rating,
                }
            }
        }        
        return exercise_log;
    }

    

    // async getTestExercise(test_id, student_id, isFinish) {
    //     var sql = "";
    //     var params = [];
    //     if(isFinish){
    //         params = [student_id, test_id];
    //         sql = `select e.* , et.exercise_index, b.*, t.kpname, sk.kp_rating from exercise_test et, 
    //             exercise e, kptable t, 
    //             breakdown b left join (select * from student_kp where student_id = ?) as sk on b.kpid = sk.kpid
    //             where et.test_id = ? and e.exercise_id = et.exercise_id and b.exercise_id = e.exercise_id and b.kpid = t.kpid`;
    //     }else{
    //         params = [test_id, student_id, test_id];
    //         sql = "select e.* , es.sample, es.`sample_index` , et.exercise_index, b.*, t.kpname, sk.kp_rating "
    //             +"from exercise_test et, kptable t, exercise e left join "
    //             +"(select es.exercise_id, round(max(es.sample_index)*rand()) as sam_index "
    //             +"from exercise_sample es, exercise_test et "
    //             +"where et.test_id = ? and es.exercise_id = et.exercise_id "
    //             +"GROUP BY es.exercise_id) as esi on esi.exercise_id = e.exercise_id LEFT JOIN exercise_sample es "
    //             +"on es.exercise_id = esi.exercise_id and es.sample_index = esi.sam_index, "
    //             +"breakdown b left join (select * from student_kp where student_id = ?) as sk on b.kpid = sk.kpid "
    //             +"where et.test_id = ? and e.exercise_id = et.exercise_id and b.exercise_id = e.exercise_id and b.kpid = t.kpid order by b.sn;";
                  
    //     }    
    //     const exercise_r = await this.app.mysql.query(sql, params);

    //     var exercise_list = [];
    //     for(var i = 0; i < exercise_r.length; i++){
    //         var e = exercise_r[i];
    //         var e_sample = e.sample;
    //         var index = e.exercise_index;
    //         if(exercise_list[index]){
    //             exercise_list[index].breakdown[e.sn - 1] = {
    //                 sn: e.sn, 
    //                 content: e_sample?  this.replaceParams(e.content,e_sample) : e.content, 
    //                 presn: e.presn, 
    //                 kpid: e.kpid,
    //                 kpname: e.kpname,
    //                 sn_rating: e.sn_rating,
    //                 kp_rating: e.kp_rating ? e.kp_rating : default_rating,
    //             }
    //         }else {
    //             var breakdown = [];
    //             breakdown[e.sn - 1] = {
    //                 sn: e.sn, 
    //                 content: e_sample?  this.replaceParams(e.content,e_sample) : e.content, 
    //                 presn: e.presn, 
    //                 kpid: e.kpid,
    //                 kpname: e.kpname,
    //                 sn_rating: e.sn_rating,
    //                 kp_rating: e.kp_rating ? e.kp_rating : default_rating,
    //             };
    //             exercise_list[index] = {
    //                 exercise_id: e.exercise_id, 
    //                 exercise_type: e.exercise_type, 
    //                 title: e_sample?  this.replaceParams(e.title,e_sample) : e.title, 
    //                 title_img_url: e.title_img_url,
    //                 title_audio_url: e.title_audio_url, 
    //                 // answer: JSON.parse(e.answer),
    //                 answer: e_sample?  this.replaceAnswers(e.answer,e_sample) : JSON.parse(e.answer), 
    //                 // sample: e.sample ? JSON.parse(e.sample) : {},
    //                 sample_index: e.sample_index,
    //                 breakdown: breakdown,
    //                 exercise_rating: e.exercise_rating,
    //             };
    //         }
    //     }
    //     return exercise_list;
    // }

    // async getTestLog(student_id, test_id){
    //     const res = await this.app.mysql.query('select t.*, tt.test_type, tt.test_config, tt.test_name '
    //     +'from test_log t, teacher_test tt where t.student_id = ? and tt.test_id = t.test_id and t.test_id = ?;'
    //     , [student_id, test_id]);

    //     return res;
    // }

    async getMyTestData(test_id, student_id){
        let test_log = await this.service.testLog.getTestLog(student_id, test_id);

        if(!test_log){
            const test = await this.app.mysql.get('teacher_test',{ test_id : test_id });
            if(test.test_type == 3){
                //公开测试
                test_log = {test_id: test_id, student_id: student_id, start_time: new Date(), total_exercise: test.total_exercise};
                const res = await this.app.mysql.insert('test_log', test_log);
            }else{
                return;
            }
        }
        if(!test_log.start_time){
            test_log.start_time = new Date();
            const result = await this.app.mysql.update('test_log', {
                start_time: test_log.start_time,
            }, {
                where: {
                    test_id: test_id,
                    student_id: student_id,
                }
            });
        }

        const exercise_list = await this.service.exercise.getTestExercise(test_id, student_id, test_log.finish_time);
        // console.log("exercise_list: ",JSON.stringify(exercise_list));
        const exercise_log = await this.getTestExerciseLog(test_id, student_id);
        console.log("this.getTestExerciseLog: ",JSON.stringify(exercise_log));
        //统一初始化exercise_log
        var exercise = exercise_list;
        for(var i = 0; i < exercise.length; i++){
            if(!exercise_log[i]){
                const breakdown = exercise[i].breakdown;
                var breakdown_sn = [];
                for(var j = 0; j < breakdown.length; j++){
                    //如果没有前置步骤的都设为0并在渲染中显示，-1代表不确定在渲染中不显示
                    const sn_state = breakdown[j].presn ? -1 : 0;
                    breakdown_sn[j] = {
                        student_id: student_id,
                        test_id: test_id,
                        exercise_id: exercise[i].exercise_id,
                        sn: breakdown[j].sn, 
                        kpid: breakdown[j].kpid,
                        kpname: breakdown[j].kpname, 
                        sn_state: sn_state, 
                        sn_old_rating: breakdown[j].sn_rating,
                        kp_old_rating: breakdown[j].kp_rating, 
                    };
                }
                exercise_log[i] = {
                    student_id: student_id,
                    test_id: test_id,
                    exercise_id: exercise[i].exercise_id,
                    exercise_state: -1,//-1:未做, 0:错误, 1:正确
                    answer: exercise[i].answer,
                    start_time: test_log.start_time,
                    exercise_status: 0,//0: 全新未做，1: 做完待反馈，2：反馈完毕
                    sample_index : exercise[i].sample_index,
                    breakdown_sn: breakdown_sn,
                    old_exercise_rating: exercise[i].exercise_rating,
                }
            }
            else{//将已做过的exercise根据 exercise_log中的sample_index替换为确定性的参数题。
                // console.log("thicexercise_log[i].sample_index:",exercise_log[i].sample_index);
                if(exercise_log[i].sample_index != null){
                    var e_s = exercise_log[i].exercise_sample;
                    // console.log("e_s:  ",e_s);
                    exercise[i].title = this.service.exercise.replaceParams(exercise[i].title,e_s.sample);
                    exercise[i].answer = e_s.answer;
                    for(var m = 0; m < exercise[i].breakdown.length; m++){
                        exercise[i].breakdown[m].content = this.service.exercise.replaceParams(exercise[i].breakdown[m].content,e_s.sample);
                    }
                    exercise[i].title_img_url = e_s.title_img_url;
                    exercise[i].title_audio_url = e_s.title_audio_url;
                }
                if(exercise_log[i].exercise_status == 1){
                    //已提交但未反馈
                    const breakdown = exercise[i].breakdown;
                    var breakdown_sn = [];
                    for(var j = 0; j < breakdown.length; j++){
                        //如果没有前置步骤的都设为0并在渲染中显示，-1代表不确定在渲染中不显示
                        const sn_state = breakdown[j].presn ? -1 : 0;
                        breakdown_sn[j] = {
                            logid: exercise_log[i].logid,
                            student_id: student_id,
                            test_id: test_id,
                            exercise_id: exercise[i].exercise_id,
                            sn: breakdown[j].sn, 
                            kpid: breakdown[j].kpid,
                            kpname: breakdown[j].kpname, 
                            sn_state: sn_state, 
                            sn_old_rating: breakdown[j].sn_rating, 
                            kp_old_rating: breakdown[j].kp_rating, 
                        };
                    }
                    exercise_log[i].breakdown_sn = breakdown_sn;
                }
            }
        }
        // console.log("after exercise_log :"+ JSON.stringify(exercise_log));

        return({
            exercise: exercise,
            exercise_log: exercise_log,
            test_id: test_id,
            test_log: test_log,
        });
    }

}
module.exports = ExerciseLogService;