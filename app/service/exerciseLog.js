const Service = require('egg').Service;
const { promisify } = require('util');

const { cumulativeStdNormalProbability } = require('simple-statistics')

class ExerciseLogService extends Service {
    //利用elo_rating方法更新rating
    elo_rating(Ra, Rb, K, iswin){
        const m = (Rb - Ra)/400;
        const r = Math.ceil(K*(iswin - 1/(1 + Math.pow(10, m))))
        return Math.ceil(K*(iswin - 1/(1 + Math.pow(10, m))));
    }

    elo_st_rating(ra, rb, mean, variance, K, iswin){
        const Ra = (ra - mean)*100/variance
        const Rb = (rb - mean)*100/variance
        return this.elo_rating(Ra, Rb, K, iswin)/100 * variance
    }

    async updateKpRating(breakdown_sn){
        const K = 64;
        for(var j = 0; j < breakdown_sn.length; j++){
            var log = breakdown_sn[j];
            //只记录已评估的知识点
            if(log.sn_state >= 0){
                //学生知识点与知识点在题目中体现的难度变化
                const kp_SA = log.sn_state ? 1 : 0;
                const sn_SA = log.sn_state ? 0 : 1;
                
                // let student_chapter = await this.app.mysql.queryOne(`select k.chapterid, sc.chapter_rating from kptable k left join student_chapter sc
                //     on sc.student_id = ? and k.chapterid = sc.chapterid where k.kpid = ?`, [log.student_id, log.kpid]);
                // const chapter_old_rating = student_chapter ? student_chapter.chapter_rating : 500;
                
                // const chapter_delta = this.elo_rating(chapter_old_rating, log.sn_old_rating);
                // const chapter_delta_rating = K*(kp_SA - chapter_delta);
                // const chapter_result = await this.app.mysql.query(`replace into student_chapter 
                //     (student_id, chapter_rating, chapterid) VALUES(?,?,?);`
                //     ,[log.student_id, (chapter_old_rating + chapter_delta_rating), student_chapter.chapterid]);

                const student_kp = await this.app.mysql.queryOne(`select sk.kp_rating, ks.* from student_kp sk
                    left join kp_standard ks on sk.kpid = ks.kpid 
                    where sk.kpid = ? and sk.student_id = ?`, [log.kpid, log.student_id])
                
                let mean = 500, variance = 32
                if(student_kp){
                    mean = student_kp.mean ? student_kp.mean : 500
                }

                log.kp_old_rating = student_kp ? student_kp.kp_rating : mean;
                const kp_delta = this.elo_st_rating(log.kp_old_rating, log.sn_old_rating, mean, variance, 50, kp_SA);
                const sn_delta = this.elo_rating(log.sn_old_rating, log.kp_old_rating, K, sn_SA);
                log.kp_delta_rating = kp_delta;
                log.sn_delta_rating = sn_delta;
            }else{
                log.kp_delta_rating = 0;
                log.sn_delta_rating = 0;
            }
        }
        return breakdown_sn;
    }

    async submitFeedback(exercise_log, exindex){
        exercise_log = await this.submitBreakdownLog(exercise_log)
        exercise_log.next = await this.service.testLog.isTestLogFinish(exercise_log.test_id, exercise_log.student_id, exindex)
        return exercise_log        
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

    keepTwoDecimal(num) {  
        var result = parseFloat(num);  
        if (isNaN(result)) {   
            return false;  
        }  
        result = Math.round(num * 100) / 100;  
        return result;
    }

    getMastery(rating, mean, variance) {
        return cumulativeStdNormalProbability((rating - mean)/variance)
    }

    async getTestKpResult(student_id, test_id){
        const breakdown_log = await this.app.mysql.query(`select c.chaptername, c.chapterid, 
            bl.sn_state, bl.kpid, bl.kpname, ks.mean, ks.variance,
            bl.kp_old_rating, bl.kp_delta_rating  
            from breakdown_log bl inner join kptable k on k.kpid = bl.kpid 
            inner join chapter c on k.chapterid = c.chapterid
            left join kp_standard ks on ks.kpid = bl.kpid
            where bl.student_id = ? and bl.test_id = ? order by update_time asc`, [student_id, test_id])
        
        let kp_result = []
        for(let i = 0; i < breakdown_log.length; i++){
            let log = breakdown_log[i]
            const kpid = 'k' + log.kpid
            const chapter_name = log.chaptername

            const plus = log.sn_state == 1 ? 1 : log.sn_state == 0 ? -1 : 0
            if(kp_result[chapter_name] && kp_result[chapter_name][kpid]){
                kp_result[chapter_name][kpid].kp_new_rating += log.kp_delta_rating
            }else{
                if(!kp_result[chapter_name]){
                    kp_result[chapter_name] = {}
                }
                kp_result[chapter_name][kpid] = {
                    kpid: log.kpid,
                    kpname: log.kpname,
                    mean: log.mean ? log.mean : 500,
                    variance: log.variance ? log.variance : 130,
                    kp_old_rating: log.kp_old_rating,
                    kp_new_rating: log.kp_old_rating + plus * log.kp_delta_rating,
                }
            }
        }
        let chapter_change = []
        for(let chapter_name in kp_result){
            let ch_r = {kp_change: [], chapter_name: chapter_name}
            let kp_r = kp_result[chapter_name] 
            for(let kpid in kp_r){
                console.log(kp_r[kpid])
                kp_r[kpid].kp_old_rating = Math.round(100 * this.getMastery(kp_r[kpid].kp_old_rating, kp_r[kpid].mean, kp_r[kpid].variance))
                kp_r[kpid].kp_new_rating = Math.round(100 * this.getMastery(kp_r[kpid].kp_new_rating, kp_r[kpid].mean, kp_r[kpid].variance))
                ch_r.kp_change.push(kp_r[kpid])
            }
            chapter_change.push(ch_r)
        }
        console.log(chapter_change)
        return chapter_change
    }

    async getTestExerciseResult(student_id, test_id){
        let exercise_log = await this.app.mysql.query(`select el.submit_time, el.exercise_state, el.old_student_rating, el.delta_student_rating, et.exercise_index
            from exercise_log el inner join exercise_test et on el.test_id = et.test_id and el.exercise_id = et.exercise_id
            where el.student_id = ? and el.test_id = ? order by el.submit_time asc`, [student_id, test_id])
        const old_student_rating = exercise_log[0].old_student_rating
        let new_student_rating = old_student_rating
        let res = []
        for(let i = 0; i < exercise_log.length; i++){
            new_student_rating += exercise_log[i].delta_student_rating
            const index = exercise_log[i].exercise_index
            res[index] = {
                exercise_state: exercise_log[i].exercise_state
            }
        }
        return {
            exercise_log: res,
            student_rating: new_student_rating,
            delta_rating: new_student_rating - old_student_rating
        }
    }

    formatTime(seconds) {
        var min = Math.floor(seconds / 60),
            second = seconds % 60,
            hour, newMin, time;
    
        if (min > 60) {
            hour = Math.floor(min / 60);
            newMin = min % 60;
        }
        if (hour < 10 && hour) { hour = '0' + hour;}
        if (newMin < 10) { newMin = '0' + newMin;}
        if (second < 10) { second = '0' + second;}
        if (min < 10) { min = '0' + min;}
    
        
        return time = hour? (hour + ':' + newMin + ':' + second) : (min + ':' + second);
    }

    async getTestResult(student_id, test_id){
        let test = await this.service.testLog.getTestLog(student_id, test_id)
        let result = await this.getTestExerciseResult(student_id, test_id)
        let status = await this.service.rating.getCourseStatus(student_id, test.course_id)
        result.rating_ranking = status.rating_ranking
        result.kp_log = await this.getTestKpResult(student_id, test_id)
        result.test_time = this.formatTime((test.finish_time.getTime() - test.start_time.getTime())/1000)
        result.delta_score = test.delta_score
        result.test_accuracy = parseInt(test.correct_exercise / test.total_exercise)
        return result
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
                            'kp_correct_rating': this.keepTwoDecimal((element.kp_rating/element.kp_standard)*100),
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
                        'kp_correct_rating': this.keepTwoDecimal((element.kp_rating/element.kp_standard)*100),
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
            result[i].chapter_correct_percent = this.keepTwoDecimal(chapter_correct_percent_tmp);
            result[i].kp_status.forEach(element => {
                var kp_correct_percent_tmp = (element.kp_correct_times/element.kp_exercise_times)*100;
                element.kp_correct_percent = this.keepTwoDecimal(kp_correct_percent_tmp);
            });
        }
        return result;
    }

    checkAnswer(exercise_type, log_answer){
        switch(exercise_type){
            case 0:
                for(var i = 0; i < log_answer.length; i++){
                    if(log_answer[i].fill != (log_answer[i].value)){
                        return 0
                    }
                }
                return 1
            case 1:
            case 2:
                for(var i = 0; i < log_answer.length; i++){
                    if(log_answer[i].correct != (log_answer[i].select ? true :false)){
                        return 0;
                    }
                }
                return 1
            default:
                //主观题
                return -1
        }
    }

    async updateExerciseLogRating(exercise_log, K){
        const { old_student_rating, old_exercise_rating, exercise_state } = exercise_log

        const ex_SA = exercise_state ? 0 : 1;
        const st_SA = exercise_state ? 1 : 0;

        //计算学生、章节、题目得分
        const st_delta = this.elo_rating(old_student_rating, old_exercise_rating, K, st_SA);
        const ex_delta = this.elo_rating(old_exercise_rating, old_student_rating, K, ex_SA);
        console.log("st_delta ",st_delta);

        exercise_log.delta_exercise_rating = ex_delta
        exercise_log.delta_student_rating = st_delta
    }

    async submitCheckAnswer(exercise_log, breakdown_sn) {
        const student_id = exercise_log.student_id;
        
        const test = await this.app.mysql.get('teacher_test',{ test_id : exercise_log.test_id });
        let student_rating = await this.service.rating.getStudentRating(student_id, test.course_id);
        exercise_log.old_student_rating = student_rating ? student_rating : 500;

        //主观题批改完后更新check_msg
        await this.app.mysql.update('check_msg', {
            check_time: new Date(),
            read: 1,
        }, {where: {logid: exercise_log.logid}})

        const K = 32
        this.updateExerciseLogRating(exercise_log, K);
        //主观题批改答案提交，更新相关天梯分
        await this.app.mysql.update('exercise_log', {
            exercise_state: exercise_log.exercise_state,
            old_student_rating: exercise_log.old_student_rating,
            delta_exercise_rating: exercise_log.delta_exercise_rating,
            delta_student_rating: exercise_log.delta_student_rating
        }, {where: {logid: exercise_log.logid}})

        //更新学生总体天梯分
        const rating_history_result = await this.app.mysql.insert('student_rating_history', {
            student_id: student_id,
            student_rating: exercise_log.old_student_rating + exercise_log.delta_student_rating,
            course_id: test.course_id,
        })
        const rating_result = await this.app.mysql.query(`replace into student_rating
            (student_id, student_rating ,course_id) VALUES(?,?,?)`
         ,[student_id,(exercise_log.old_student_rating + exercise_log.delta_student_rating), test.course_id]);

        //async
        this.app.mysql.insert('exercise_log_trigger', {logid: exercise_log.logid});

        exercise_log.breakdown_sn = breakdown_sn;
        exercise_log = await this.submitBreakdownLog(exercise_log);

        await this.service.testLog.checkTestLogFinish(exercise_log.test_id, student_id)        
        return exercise_log;
    }

    async submitExerciseLog(exercise_log, exercise_type, exindex) {
        const exercise_rating = exercise_log.old_exercise_rating;
        const {student_id, test_id} = exercise_log;
        const K = 32
        exercise_log.exercise_state = this.checkAnswer(exercise_type, exercise_log.answer) 
        //1：已提交答案未提交反馈 2：已提交反馈 
        exercise_log.exercise_status = 1;
        
        const test = await this.app.mysql.get('teacher_test',{ test_id : exercise_log.test_id });
        let student_rating = await this.service.rating.getStudentRating(student_id, test.course_id);
        exercise_log.old_student_rating = student_rating ? student_rating : 500;

        //题目对错确定
        //TO-DO：输入测试elo 参数K
        if(exercise_log.exercise_state >= 0){
            await this.updateExerciseLogRating(exercise_log, K);
        }
        
        var breakdown_sn = exercise_log.breakdown_sn;
        var answer = exercise_log.answer
        //学生提交答案，插入答题记录
        exercise_log.submit_time = new Date(); 
        exercise_log.answer = JSON.stringify(answer);
        
        delete exercise_log.breakdown_sn;
        const insert_result = await this.app.mysql.insert('exercise_log', exercise_log);
        exercise_log.logid = insert_result.insertId;
    
        //插入后还原数据
        for(var i = 0; i < breakdown_sn.length; i++){
            breakdown_sn[i].logid = exercise_log.logid; 
            //答案已批改且只与一个知识点相关或答案正确直接提交分解
            breakdown_sn[i].sn_state = exercise_log.exercise_state > 0 ? 1 : 
                exercise_log.exercise_state == 0 && (breakdown_sn.length == 1 || i == 0) ? 0 : -1; 
        }
        exercise_log.breakdown_sn = breakdown_sn
        exercise_log.answer = answer
        
        //主观题未批改，直接返回
        if(exercise_log.exercise_state < 0){
            exercise_log.next = await this.service.testLog.isTestLogFinish(test_id, student_id, exindex)
            await this.app.mysql.insert('check_msg', {
                logid: exercise_log.logid,
                check_user: test.teacher_id,
                submit_user: exercise_log.student_id,
                submit_time: new Date(),
                title: test.test_name + "第" + exindex + "题提交批改",
                log_type: 1,//测试任务
                read: 0
            })
            return exercise_log
        }
        
        //更新学生总体天梯分
        const rating_history_result = await this.app.mysql.insert('student_rating_history', {
            student_id: student_id,
            student_rating: exercise_log.old_student_rating + exercise_log.delta_student_rating,
            course_id: test.course_id,
        })
        const rating_result = await this.app.mysql.query(`replace into student_rating
            (student_id, student_rating ,course_id) VALUES(?,?,?)`
         ,[student_id,(exercise_log.old_student_rating + exercise_log.delta_student_rating), test.course_id]);

        //async
        this.app.mysql.insert('exercise_log_trigger', {logid: exercise_log.logid});

        //不需要反馈直接提交
        if(exercise_log.exercise_state > 0 || (exercise_log.exercise_state == 0 && breakdown_sn.length == 1)){
            exercise_log = await this.submitBreakdownLog(exercise_log);
            //检查测试是否全部完成
            //update test_log's correct and total size
            exercise_log.next = await this.service.testLog.isTestLogFinish(test_id, student_id, exindex)
        }
        return exercise_log
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
                    old_exercise_rating: b.old_exercise_rating,
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
                test_log = await this.service.testLog.getTestLog(student_id, test_id);
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

    //TO-DO
    async getUncheckedExers(test_id){
        const results = await this.app.mysql.query(
            `select e.logid, e.student_id ,u.realname,e.test_id,e.exercise_id,e.old_exercise_rating,e.submit_time,e.answer as submit_answer,ex.*,b.*,k.kpname
            from exercise_log e inner join breakdown b on e.exercise_id = b.exercise_id
			inner join check_msg c on c.logid = e.logid
            inner join exercise ex on e.exercise_id = ex.exercise_id
            inner join kptable k on b.kpid = k.kpid
            inner join users u on e.student_id = u.userid
            where e.test_id = ? and c.read = 0 order by e.submit_time asc;`,[test_id]
        ); 
        var exercise_list = [];
        var exercise_index = [];
        var list_index = 0;
        for(var i = 0; i < results.length; i++){
            var e = results[i];
            const index = exercise_index[e.exercise_id + "-" + e.student_id];
            console.log(i + " " + index);
            if(index >= 0){
                console.log(index);
                exercise_list[index].breakdown.push({
                    sn: e.sn, 
                    content: e.content, 
                    presn: e.presn, 
                    kpid: e.kpid,
                    kpname: e.kpname,
                    sn_old_rating: e.sn_rating,
                });
            }else{
                var breakdown = [];
                breakdown.push({
                    sn: e.sn, 
                    content: e.content, 
                    presn: e.presn, 
                    kpid: e.kpid,
                    kpname: e.kpname,
                    sn_old_rating: e.sn_rating,
                });
                var exercise = {
                    logid: e.logid,
                    student_id: e.student_id,
                    realname: e.realname,
                    testid: e.test_id,
                    exercise_id: e.exercise_id,
                    exercise_type: e.exercise_type,
                    old_exercise_rating: e.old_exercise_rating,
                    submit_time: e.submit_time,
                    submit_answer: JSON.parse(e.submit_answer),
                    title: e.title, 
                    answer: JSON.parse(e.answer),
                    title_img_url : e.title_img_url,
                    title_audio_url : e.title_audio_url,
                    answer_assist_url : e.answer_assist_url,
                    breakdown: breakdown,
                };

                exercise_list[list_index] = exercise;
                exercise_index[e.exercise_id + "-" + e.student_id] = list_index;
                list_index++;
            }
        }
        return exercise_list;
    }

    async getCheckedExers(test_id){
        const results = await this.app.mysql.query(
            `select e.logid,e.student_id ,u.realname,e.test_id,e.exercise_id,e.exercise_state,e.submit_time,e.answer as submit_answer,ex.*,
            b.*,bl.sn_state,bl.kpname from exercise_log e 
            inner join breakdown_log bl on e.logid = bl.logid 
			inner join check_msg c on c.logid = e.logid
            inner join breakdown b on b.exercise_id = bl.exercise_id and b.sn = bl.sn
            inner join exercise ex on e.exercise_id = ex.exercise_id
            inner join users u on e.student_id = u.userid
            where e.test_id = ? and c.read = 1 order by bl.update_time asc;`,[test_id]
        ); 
        var exercise_list = [];
        var exercise_index = [];
        var list_index = 0;
        for(var i = 0; i < results.length; i++){
            var e = results[i];
            const index = exercise_index[e.exercise_id + "-" + e.student_id];
            console.log(i + " " + index);
            if(index >= 0){
                console.log(index);
                exercise_list[index].breakdown.push({
                    sn: e.sn, 
                    sn_state: e.sn_state,
                    content: e.content, 
                    presn: e.presn, 
                    kpid: e.kpid,
                    kpname: e.kpname,
                });
            }else{
                var breakdown = [];
                breakdown.push({
                    sn: e.sn, 
                    sn_state: e.sn_state,
                    content: e.content, 
                    presn: e.presn, 
                    kpid: e.kpid,
                    kpname: e.kpname,
                });
                var exercise = {
                    logid: e.logid,
                    student_id: e.student_id,
                    realname: e.realname,
                    testid: e.test_id,
                    exercise_id: e.exercise_id, 
                    exercise_type: e.exercise_type,
                    exercise_state: e.exercise_state,
                    submit_time: e.submit_time,
                    submit_answer: JSON.parse(e.submit_answer),
                    title: e.title, 
                    answer: JSON.parse(e.answer),
                    title_img_url : e.title_img_url,
                    title_audio_url : e.title_audio_url,
                    answer_assist_url : e.answer_assist_url,
                    breakdown: breakdown,
                };

                exercise_list[list_index] = exercise;
                exercise_index[e.exercise_id + "-" + e.student_id] = list_index;
                list_index++;
            }
        }
        return exercise_list;
    }


}
module.exports = ExerciseLogService;