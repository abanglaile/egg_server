
const Service = require('egg').Service;

class exerciseService extends Service {

  async getExerciseByKp(kpid) {
    const results = await this.app.mysql.query('select a.*,s.sample,s.answer as sample_answer,'
    +'s.`title_img_url` as sam_title_img,s.`title_audio_url` as sam_title_audio from '
    +'(select e.* , b.sn,b.content ,b.presn ,b.kpid , t.kpname from kp_exercise k, exercise e, '
    +'breakdown b, kptable t where k.kpid = ? and e.exercise_id = k.exercise_id and '
    +'b.exercise_id = e.exercise_id and b.kpid = t.kpid) as a LEFT JOIN  exercise_sample s '
    +'on a.exercise_id = s.exercise_id and s.sample_index = 0;', kpid);

    var exercise_list = [];
    var exercise_index = [];
    var list_index = 0;
    for(var i = 0; i < results.length; i++){
        var e = results[i];
        const index = exercise_index[e.exercise_id];
        console.log(i + " " + index);
        if(index >= 0){
            console.log(index);
            exercise_list[index].exercise.breakdown.push({
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
            };

            exercise_list[list_index] = one_exercise;
            exercise_index[e.exercise_id] = list_index;
            list_index++;
        }
    }

    return exercise_list;
  }

  async getTotalExercise(exercise_id) {
    const results = await this.getExerciseByExid(exercise_id);

    if(!results[0]){
        return exercise_id;
    }else{
        const kp_exercise = await this.getKpExercise(exercise_id);
        var kpids = [];
        for(var i = 0; i < kp_exercise.length; i++){
            kpids['#' + kp_exercise[i].kpid] = true;
        }
        console.log(kpids);
        var breakdown = [];
        for(var i = 0; i < results.length; i++){
            breakdown.push({
                sn: results[i].sn, 
                content: results[i].content, 
                presn: results[i].presn, 
                kpid: results[i].kpid,
                kpname: results[i].kpname,
                sn_rating : results[i].sn_rating,
                checked: kpids['#' + results[i].kpid]?true:false//记录主测点
            });
        }
        var exercise = {
            exercise_id: results[0].exercise_id, 
            exercise_type: results[0].exercise_type, 
            title: results[0].title, 
            title_img_url: results[0].title_img_url,
            title_audio_url: results[0].title_audio_url,
            answer: results[0].answer,
            exercise_rating: results[0].exercise_rating, 
            breakdown: breakdown
        };
        console.log("exercise :"+exercise);
        return exercise;
    }
  }

  async getExerciseByExid(exercise_id) {
    const res = await this.app.mysql.query('select e.* , b.*, t.kpname from exercise e, '
    +'breakdown b, kptable t where e.exercise_id = ? and b.exercise_id = e.exercise_id and b.kpid = t.kpid', exercise_id);

    return res;
  }

  async getKpExercise(exercise_id){
    const res = await this.app.mysql.query('select kpid from kp_exercise k where exercise_id = ?', exercise_id);
    return res;    
  }

  async addOneExercise(course_id,exercise){
    const reply = await this.produceExerciseId(course_id);
    const exercise_id = reply;
    console.log('exercise_id :'+exercise_id);
    if(exercise_id > 0){
        const addexer = await this.addExercise(exercise,exercise_id);
        const addbreak = await this.addBreakdown(exercise_id,exercise.breakdown);
        //无主测点时不更新
        var mask = 0;
        for(var i = 0; i < exercise.breakdown.length; i++){
            if(exercise.breakdown[i].checked){
                mask = 1;
            }
        }
        if(mask){
          const addkpexer = await this.addKpExercise( exercise_id, exercise.breakdown);
          return {"exercise_id":exercise_id};

        }else{
          return {"exercise_id":exercise_id};
        }
    }else{
        console.log("exercise_id生成失败");
    }
  }

  async updateOneExercise(exercise){
    const update_exer = await this.updateExercise(exercise);
    const update_break = await this.updateBreakdown(exercise.exercise_id,exercise.breakdown);
    //无主测点时不更新
    var mask = 0;
    for(var i = 0; i < exercise.breakdown.length; i++){
        if(exercise.breakdown[i].checked){
            mask = 1;
        }
    }
    if(mask){
      const addkpexer = await this.addKpExercise(exercise.exercise_id,exercise.breakdown);
      return {"exercise_id":exercise.exercise_id};
    }else{
      return {"exercise_id":exercise.exercise_id};
    }
  }

  async updateOneBreakdown(exercise_id, breakdown){
    const update_break = await this.updateBreakdown(exercise_id, breakdown);
    //无主测点时不更新
    var mask = 0;
    for(var i = 0; i < breakdown.length; i++){
        if(breakdown[i].checked){
            mask = 1;
        }
    }
    if(mask){
    //更新主测点信息
      const addkpexer = await this.addKpExercise(exercise_id, breakdown);
      return {"exercise_id" : exercise_id};
    }else{
      return {"exercise_id" : exercise_id};
    }
  }

  async produceExerciseId(course_id) {
    const res = await this.app.redis.hincrby('exercise_sequence',course_id,1);
    return res;
  }

  async addExercise(exercise, exercise_id) {
    var params = {
        exercise_id: exercise_id,
        title: exercise.title, 
        title_img_url: exercise.title_img_url,
        title_audio_url: exercise.title_audio_url, 
        answer: JSON.stringify(exercise.answer), 
        exercise_rating: exercise.exercise_rating, 
        exercise_type: exercise.exercise_type
    };
    const res = await this.app.mysql.insert('exercise',params);
    return res;
  }

  async addBreakdown(exercise_id, breakdown) {
    var sql = "";
    var params = [];
    for(var i = 0; i < breakdown.length; i++){
        sql = sql + "insert into breakdown set ?;"
        params.push({exercise_id: exercise_id, sn: breakdown[i].sn, content: breakdown[i].content, presn: breakdown[i].presn, sn_rating: breakdown[i].sn_rating, kpid: breakdown[i].kpid});
    }
    const res = await this.app.mysql.query(sql,params);
    return res;
  }


  async addKpExercise(exercise_id, breakdown) {
    var sql = "";
    var params = [];
    console.log("exercise_id :",exercise_id);
    const res1 = await this.app.mysql.delete('kp_exercise',{
        exercise_id : exercise_id,
    });
    for(var i = 0; i < breakdown.length; i++){
        if(breakdown[i].checked){
            var kpid = breakdown[i].kpid;
            console.log("kpid :",kpid);
            sql = sql + `insert into kp_exercise (exercise_id, kpid, chapterid, course_id) values 
			(?, ?, (select chapterid from kptable where kpid = ?), 
            (select b.course_id from kptable k, chapter c, book b where b.bookid = c.bookid and c.chapterid = k.chapterid and k.kpid = ?));`;
            params.push(exercise_id, kpid, kpid, kpid);   
        }
    }
    const res2 = await this.app.mysql.query(sql,params);
    return res2;
  }

  async updateExercise(exercise) {
    const params = {
            title: exercise.title, 
            title_img_url: exercise.title_img_url, 
            title_audio_url: exercise.title_audio_url,
            answer: JSON.stringify(exercise.answer), 
            exercise_rating: exercise.exercise_rating, 
            exercise_type: exercise.exercise_type,
            exercise_id: exercise.exercise_id
        };
    const options = {
      where: {
        exercise_id: exercise.exercise_id
      }
    };
    const res = await this.app.mysql.update('exercise',params,options);
    return res;
  }

  // async updateAllSample(sample){
  //   var sql = "delete from exercise_sample where exercise_id = ?;";
  //   var params = [exercise_id];
  //   for(var i = 0; i < sample.length; i++){
  //       sql = sql + "insert into exercise_sample set ?;"
  //       params.push({
  //         exercise_id: exercise_id, 
  //         sample:sample[i].sample,
  //         sample_index:sample[i].sample_index
  //       });
  //   }
  //   const res = await this.app.mysql.query(sql,params);
  //   return res;
  // }

  async updateBreakdown(exercise_id,breakdown) {
    var sql = "delete from breakdown where exercise_id = ?;";
    var params = [exercise_id];
    for(var i = 0; i < breakdown.length; i++){
        sql = sql + "insert into breakdown set ?;"
        params.push({exercise_id: exercise_id, sn: breakdown[i].sn, sn_rating: breakdown[i].sn_rating, content: breakdown[i].content, presn: breakdown[i].presn, kpid: breakdown[i].kpid, sn_rating: breakdown[i].sn_rating});
    }
    const res = await this.app.mysql.query(sql,params);
    return res;
  }

  async getExerciseBytestid(test_id, student_id) {
    const res = await this.app.mysql.query('select e.* , et.exercise_index, b.*, t.kpname, sk.kp_rating '
    +'from exercise_test et, exercise e, kptable t, breakdown b left join '
    +'(select * from student_kp where student_id = ?) as sk on b.kpid = sk.kpid '
    +'where et.test_id = ? and e.exercise_id = et.exercise_id and b.exercise_id = e.exercise_id ;'
    +'and b.kpid = t.kpid order by b.sn', [student_id,test_id]);
    return res;
  }

  async getExerciseBytestidSec(test_id, student_id, isFinish) {
    var sql = "";
    if(isFinish){
        sql = "select e.* , et.exercise_index, b.*, t.kpname, sk.kp_rating from exercise_test et, "
            + "exercise e, kptable t, "
            + "breakdown b left join (select * from student_kp where student_id = ?) as sk on b.kpid = sk.kpid "
            + "where et.test_id = ? and e.exercise_id = et.exercise_id and b.exercise_id = e.exercise_id and b.kpid = t.kpid order by b.sn;";
    }else{
        sql = "select e.* , es.sample, es.`sample_index` , et.exercise_index, b.*, t.kpname, sk.kp_rating "
            +"from exercise_test et, kptable t, exercise e left join "
            +"(select es.exercise_id, round(max(es.sample_index)*rand()) as sam_index "
            +"from exercise_sample es, exercise_test et "
            +"where et.test_id = ? and es.exercise_id = et.exercise_id "
            +"GROUP BY es.exercise_id) as esi on esi.exercise_id = e.exercise_id LEFT JOIN exercise_sample es "
            +"on es.exercise_id = esi.exercise_id and es.sample_index = esi.sam_index, "
            +"breakdown b left join (select * from student_kp where student_id = ?) as sk on b.kpid = sk.kpid "
            +"where et.test_id = ? and e.exercise_id = et.exercise_id and b.exercise_id = e.exercise_id and b.kpid = t.kpid order by b.sn;";
              
    }    
    const res = await this.app.mysql.query(sql, [test_id, student_id, test_id]);
    return res;
  }

  async getExerciseByTest(test_id,student_id){

    const default_rating = 500;
    const results = await this.getExerciseBytestid(test_id,student_id);
    const rating = await this.Service.getMyLadderScore(student_id);

    var exercise_list = [];
    for(var i = 0; i < results.length; i++){
        var e = results[i];
        var index = e.exercise_index;
        console.log("index:" + index);
        if(exercise_list[index]){
            exercise_list[index].breakdown[e.sn - 1] = {
                sn: e.sn, 
                content: e.content, 
                presn: e.presn, 
                kpid: e.kpid,
                kpname: e.kpname,
                sn_rating: e.sn_rating,
                kp_rating: e.kp_rating ? e.kp_rating : default_rating,
            }
        }else {
            var breakdown = [];
            breakdown[e.sn - 1] = {
                sn: e.sn, 
                content: e.content, 
                presn: e.presn, 
                kpid: e.kpid,
                kpname: e.kpname,
                sn_rating: e.sn_rating,
                kp_rating: e.kp_rating ? e.kp_rating : default_rating,
            };
            exercise_list[index] = {
                exercise_id: e.exercise_id, 
                exercise_type: e.exercise_type, 
                title: e.title,
                title_img_url: e.title_img_url,
                title_audio_url: e.title_audio_url, 
                answer: JSON.parse(e.answer),
                breakdown: breakdown,
                exercise_rating: e.exercise_rating,
            };
        }
    }

    return({
        exercise: exercise_list,
        test_id: test_id,
        student_rating: rating[0].student_rating,
    });

  }

  async getTestLog(student_id, test_id){
    const res = await this.app.mysql.query('select t.*, tt.test_type, tt.test_config, tt.test_name '
    +'from test_log t, teacher_test tt where t.student_id = ? and tt.test_id = t.test_id and t.test_id = ?;'
    , [student_id,test_id]);
    return res;
  }

  async getTestLogs(student_id){
    const res = await this.app.mysql.query(`select t.*, s.start_time, s.finish_time, s.test_state, `
    +`s.correct_exercise, s.total_exercise ,date_format(s.finish_time,'%m/%d') as `
    +`formatdate from teacher_test t, test_log s where s.student_id = ? and `
    +`t.test_id = s.test_id and s.finish_time is not null ORDER BY s.finish_time DESC;`
    , [student_id]);
    return res;
  }

  async getExerciseLogResult(student_id, test_id){
    const res = await this.app.mysql.query(`select bl.*, el.* ,k.kpname, es.sample, `
    +`et.exercise_index from exercise_log el left join exercise_sample es on `
    +`es.exercise_id = el.exercise_id and es.sample_index = el.sample_index, `
    +`breakdown_log bl ,kptable k, exercise_test et where et.test_id = el.test_id `
    +`and et.exercise_id = el.exercise_id and el.student_id = ? and el.test_id = ? `
    +`and bl.logid = el.logid and k.kpid = bl.kpid;`
    , [student_id, test_id]);
    return res;
  }

  async getUncompletedTestLogs(student_id){
    const res = await this.app.mysql.query(`select t.*, u.nickname,s.start_time, s.finish_time, s.test_state, `
    +`s.correct_exercise, s.total_exercise ,date_format(t.enable_time, '%m/%d') as formatdate `
    +`from teacher_test t, test_log s,users u where s.student_id = ? and `
    +`u.userid = t.teacher_id and t.test_id = s.test_id and s.finish_time `
    +`is null and t.test_type = 1 and t.enable_time IS NOT NULL ORDER BY t.enable_time DESC;`
    , [student_id]);
    return res;
  }

  async getExerciseByTest2(test_id,student_id){

    const test_log_r = await this.getTestLog(student_id,test_id);
    var test_log = test_log_r[0];
    const exercise_r = await this.getExerciseBytestidSec(test_id,student_id,test_log.finish_time);
    const breakdown_log = await this.getExerciseLogResult(test_id,student_id);
    const rating = await this.Service.getMyLadderScore(student_id);

    var exercise_list = [];
    for(var i = 0; i < exercise_r.length; i++){
        var e = exercise_r[i];
        var e_sample = e.sample;
        var index = e.exercise_index;
        console.log("index:" + index);
        if(exercise_list[index]){
            exercise_list[index].breakdown[e.sn - 1] = {
                sn: e.sn, 
                content: e_sample?  replaceParams(e.content,e_sample) : e.content, 
                presn: e.presn, 
                kpid: e.kpid,
                kpname: e.kpname,
                sn_rating: e.sn_rating,
                kp_rating: e.kp_rating ? e.kp_rating : default_rating,
            }
        }else {
            var breakdown = [];
            breakdown[e.sn - 1] = {
                sn: e.sn, 
                content: e_sample?  replaceParams(e.content,e_sample) : e.content, 
                presn: e.presn, 
                kpid: e.kpid,
                kpname: e.kpname,
                sn_rating: e.sn_rating,
                kp_rating: e.kp_rating ? e.kp_rating : default_rating,
            };
            exercise_list[index] = {
                exercise_id: e.exercise_id, 
                exercise_type: e.exercise_type, 
                title: e_sample?  replaceParams(e.title,e_sample) : e.title, 
                title_img_url: e.title_img_url,
                title_audio_url: e.title_audio_url, 
                // answer: JSON.parse(e.answer),
                answer: e_sample?  replaceAnswers(e.answer,e_sample) : JSON.parse(e.answer), 
                // sample: e.sample ? JSON.parse(e.sample) : {},
                breakdown: breakdown,
                exercise_rating: e.exercise_rating,
            };
        }
    }

    var exercise_log = [];
    for(var i = 0; i < breakdown_log.length; i++){
        const b = breakdown_log[i];
        var index = b.exercise_index;
        if(exercise_log[index]){
            // console.log("b.sn:"+b.sn);
            exercise_log[index].breakdown_sn[b.sn-1] = {
                sn: b.sn,
                sn_state: b.sn_state,
                kpid: b.kpid,
                kpname:b.kpname
            }
        }else{
            exercise_log[index] = {
                exercise_id: b.exercise_id,
                exercise_state: b.exercise_state,
                exercise_status: b.exercise_status,
                start_time: b.start_time,
                submit_time: b.submit_time,
                answer: JSON.parse(b.answer),
                sample_inedx: b.sample_index ? b.sample_index: null,
                sample : b.sample ? b.sample : {},
                breakdown_sn:[],
            };
            exercise_log[index].breakdown_sn[b.sn-1] = {
                sn: b.sn,
                sn_state: b.sn_state, 
                kpid: b.kpid,
                kpname:b.kpname
            }
        }
    }
    console.log("exercise_log :"+exercise_log);

    //统一初始化exercise_log
    var exercise = exercise_list;
    console.log("exercise :"+ JSON.stringify(exercise));
    for(var i = 0; i < exercise.length; i++){
        if(!exercise_log[i]){
            const breakdown = exercise[i].breakdown;
            var breakdown_sn = [];
            for(var j = 0; j < breakdown.length; j++){
              //如果没有前置步骤的都设为0并在渲染中显示，-1代表不确定在渲染中不显示
              const sn_state = breakdown[j].presn ? -1 : 0;
              breakdown_sn[j] = {
                sn: breakdown[j].sn, 
                kpid: breakdown[j].kpid,
                kpname: breakdown[j].kpname, 
                sn_state: sn_state, 
                presn: breakdown[j].presn, 
                kp_old_rating: breakdown[j].kp_rating, 
                sn_old_rating: breakdown[j].sn_rating
              };
            }
            exercise_log[i] = {
                exercise_id: exercise[i].exercise_id,
                exercise_state: -1,//-1:未做, 0:错误, 1:正确
                answer: exercise[i].answer,
                start_time: new Date(),
                exercise_status: 0,//0: 全新未做，1: 做完待反馈，2：反馈完毕
                sample: exercise[i].sample,
                sample_index : exercise[i].sample_index,
                breakdown_sn: breakdown_sn,
                ac_time: 0,
            }
        }
    }
    console.log("after exercise_log :"+ JSON.stringify(exercise_log));

    return({
        exercise: exercise,
        exercise_log: exercise_log,
        test_id: test_id,
        student_rating: rating[0].student_rating,
    });

  }
//根据知识点添加测试test
  async addNewTestByKp(kpid, kpname){

    const test_name = "攻克" + kpname;
    const res = await this.app.mysql.query('insert into teacher_test set test_name=?, teacher_id= -1, '
    +'group_time=(SELECT now()), enable_time=(SELECT now()), total_exercise = 3, test_type=2, test_config=?;'
    , [test_name, JSON.stringify({kp: [{kpid: kpid, kpname: kpname}]})]);
    return res; 
  }
//获得主测知识点下的exercise-ids  目前是限制6题   
  async generateExerByKp(kpid) {

    const res = await this.app.mysql.select('kp_exercise', {
        where : { kpid : kpid},
        columns : ['exercise_id'],
        limit: 3,
    });
    return res;
  }
//添加 testid与exercise对应关系,test包含哪些测试
  async generateExerciseTest(test_id, student_id, exercises) {
    var sql = "insert into test_log set ?;";
    var params = [{student_id: student_id, test_id: test_id, start_time: new Date(), total_exercise: exercises.length}];
    for(var i = 0; i < exercises.length; i++){
      sql = sql + "insert into exercise_test set ?;"
      params.push({test_id: test_id, exercise_id: exercises[i].exercise_id, exercise_index: i});  
    }
    const res = await this.app.mysql.query(sql,params);
    return res;
  }


  async getExerciseByKpid(kpid,kpname,student_id){

    const default_rating = 500;
    const test_r = await this.addNewTestByKp(kpid,kpname);
    const testid = test_r.insertId;
    const exercises = await this.generateExerByKp(kpid);
    const gene_test = await this.generateExerciseTest(testid,student_id,exercises);
    const results = await this.getExerciseBytestid(testid,student_id);
    const rating = await this.Service.getMyLadderScore(student_id);

    var exercise_list = [];
    for(var i = 0; i < results.length; i++){
        var e = results[i];
        var index = e.exercise_index;
        if(exercise_list[index]){
            exercise_list[index].breakdown[e.sn - 1] = {
                sn: e.sn, 
                content: e.content, 
                presn: e.presn, 
                kpid: e.kpid,
                kpname: e.kpname,
                sn_rating: e.sn_rating,
                kp_rating: e.kp_rating ? e.kp_rating : default_rating,
            }
        }else {
            var breakdown = [];
            breakdown[e.sn - 1] = {
                sn: e.sn, 
                content: e.content, 
                presn: e.presn, 
                kpid: e.kpid,
                kpname: e.kpname,
                sn_rating: e.sn_rating,
                kp_rating: e.kp_rating ? e.kp_rating : default_rating,
            };
            exercise_list[index] = {
                exercise_id: e.exercise_id, 
                exercise_type: e.exercise_type, 
                title: e.title,
                title_img_url: e.title_img_url,
                title_audio_url: e.title_audio_url, 
                answer: JSON.parse(e.answer),
                breakdown: breakdown,
                exercise_rating: e.exercise_rating,
            };
        }
    }

    return({
        exercise: exercise_list,
        test_id: testid,
        student_rating: rating[0].student_rating,
    });

  }

  

}

module.exports = exerciseService;
 