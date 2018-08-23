const Service = require('egg').Service;

class ExerciseLogService extends Service {
    //利用elo_rating方法更新rating
    elo_rating(Ra, Rb){
        const m = (Rb - Ra)/400;
        return 1/(1 + Math.pow(10, m));
    }

    updateKpRating(breakdown_sn){
        const K = 32;
        for(var j = 0; j < breakdown_sn.length; j++){
            var log = breakdown_sn[j];
            //只记录已评估的知识点
            if(log.sn_state >= 0){
                //学生知识点与知识点在题目中体现的难度变化
                const kp_SA = log.sn_state ? 1 : 0;
                const sn_SA = log.sn_state ? 0 : 1;
                
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
        breakdown_sn = this.updateKpRating(breakdown_sn);
        const insert_result = await this.app.mysql.insert('breakdown_log', breakdown_sn);
        const update_result = await this.app.mysql.update('exercise_log', {exercise_status: 2},
            {where: {logid: exercise_log.logid}});
        
        exercise_log.exercise_status = 2;
        exercise_log.breakdown_sn = breakdown_sn;
        return exercise_log;
    }

    async getMyTestStatus(student_id, test_id) {
        const test_kp = this.app.mysql.query(`select b.kpid, kt.kpname, sk.kp_rating, sk.practice, sk.correct from exercise_test t, 
        exercise e, kptable kt, breakdown b LEFT JOIN student_kp sk on sk.kpid = b.kpid and student_id = ?
        where t.test_id = ? and t.exercise_id = e.exercise_id 
        and e.exercise_id = b.exercise_id and kt.kpid = b.kpid`, [student_id,test_id]);

        const test_log = this.service.testLog.getTestLog(student_id, test_id);
        const exercise_log = this.app.mysql.query(`select et.*, el.exercise_state from exercise_test et left join exercise_log el
            on et.exercise_id = el.exercise_id and el.student_id = ? where et.test_id = ? order by et.exercise_index`, 
            [student_id, test_id]); 
        return {
            test_kp: await test_kp,
            test_log: await test_log,
            exercise_log: await exercise_log,
        };
    }

    async submitExerciseLog(exercise_log) {
        const exercise_rating = exercise_log.old_exercise_rating;
        exercise_log.submit_time = new Date();
        let kp_exercise = await this.app.mysql.get('kp_exercise', {exercise_id: exercise_log.exercise_id});
        
        let student_rating = this.service.rating.getStudentRating(student_id, kp_exercise.course_id);
        let chapter_rating = this.app.mysql.get('student_chapter', {student_id: student_id, course_id: kp_exercise.chapter_id});

        student_rating = await student_rating;
        chapter_rating = await chapter_rating;

        student_rating = student_rating[0] ? student_rating[0].student_rating : 500;
        chapter_rating = chapter_rating[0] ? chapter_rating[0].chapter_rating : 500;
        
        const result = exercise_log.exercise_state;

        //计算学生、章节、题目得分
        const st_delta = this.elo_rating(student_rating, exercise_rating);
        const ex_delta = this.elo_rating(exercise_rating, student_rating);
        const ch_delta = this.elo_rating(chapter_rating, exercise_rating);
        
        const K = 32;
        const ex_SA = result ? 0 : 1;
        const st_SA = result ? 1 : 0;

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
        const rating_result = await this.app.mysql.insert('student_rating_history', {
            student_id: student_id,
            student_rating: student_rating + st_delta,
            course_id: kp_exercise.course_id,
        })
        const chapter_result = await this.app.mysql.update('student_chapter', {
            student_id: student_id,
            student_rating: chapter_rating + ch_delta,
            chapter_id: kp_exercise.chapterid,
        })

        exercise_log.logid = insert_result.insertId;
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
                    sample_inedx: b.sample_index,
                    delta_student_rating: b.delta_student_rating,
                    //sample : b.sample ? b.sample : {},
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
        const test_log = await this.service.testLog.getTestLog(student_id, test_id);
        console.log(test_log_r);

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
        const exercise_log = await this.getTestExerciseLog(test_id, student_id);

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
            else if(exercise_log[i].exercise_status == 1){
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
        console.log("after exercise_log :"+ JSON.stringify(exercise_log));

        return({
            exercise: exercise,
            exercise_log: exercise_log,
            test_id: test_id,
            test_log: test_log,
        });
    }

}
module.exports = ExerciseLogService;