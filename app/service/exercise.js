const Service = require('egg').Service;

class ExerciseService extends Service {

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


    //获得主测知识点下的exercise-ids  目前是限制3题   
    async getExerciseByKpRating(kpid, kp_rating) {
        const sql = `select ke.exercise_id from kp_exercise ke, exercise e, breakdown b
            where ke.kpid = ? and e.exercise_id = ke.exercise_id and b.exercise_id = e.exercise_id
            and b.kpid = ke.kpid and b.sn_rating < ? order by b.sn_rating desc limit 3`;
        const exercise_list = await this.app.mysql.query(sql, [kpid, kp_rating]);
        return exercise_list;
    }

    replaceParams(text, sample){
        var json_sample = JSON.parse(sample);
        console.log("text :",text);
        var newtext = text.replace(/(\@.*?\@)/g, function(word){
            //去掉首尾两个@
            word = word.substring(1, word.length - 1); 
            return json_sample[word];
        });  
        console.log("newtext :",newtext);
        return newtext;
    }

    replaceAnswers(answer, sample){
        var answer = JSON.parse(answer);
        var new_answer = [];
        console.log("answer: ",answer); 
        for(var i=0;i<answer.length;i++){
            var e =  answer[i];
            new_answer[i] = {
                correct : e.correct,
                value : this.replaceParams(e.value,sample),
            };
        }
        console.log("new_answer: ",new_answer); 
        return new_answer;
    }

  async getTestExercise(test_id, student_id, isFinish) {
    var sql = "";
    var params = [];
    var default_rating = 500;
    console.log("isFinish :",isFinish);
    if(isFinish){
        params = [student_id, test_id];
        sql = `select e.* , et.exercise_index, b.*, t.kpname, sk.kp_rating from exercise_test et, 
            exercise e, kptable t, 
            breakdown b left join (select * from student_kp where student_id = ?) as sk on b.kpid = sk.kpid
            where et.test_id = ? and e.exercise_id = et.exercise_id and b.exercise_id = e.exercise_id and b.kpid = t.kpid`;
    }else{
        params = [test_id, student_id, test_id];
        sql = "select e.* , es.sample, es.`sample_index` , es.answer as s_answer, "
            +"es.title_img_url as s_title_img_url, es.title_audio_url as s_title_audio_url, et.exercise_index, b.*, t.kpname, sk.kp_rating "
            +"from exercise_test et, kptable t, exercise e left join "
            +"(select es.exercise_id, round(max(es.sample_index)*rand()) as sam_index "
            +"from exercise_sample es, exercise_test et "
            +"where et.test_id = ? and es.exercise_id = et.exercise_id "
            +"GROUP BY es.exercise_id) as esi on esi.exercise_id = e.exercise_id LEFT JOIN exercise_sample es "
            +"on es.exercise_id = esi.exercise_id and es.sample_index = esi.sam_index, "
            +"breakdown b left join (select * from student_kp where student_id = ?) as sk on b.kpid = sk.kpid "
            +"where et.test_id = ? and e.exercise_id = et.exercise_id and b.exercise_id = e.exercise_id and b.kpid = t.kpid order by b.sn;";
              
    }    
    const exercise_r = await this.app.mysql.query(sql, params);

    var exercise_list = [];
    for(var i = 0; i < exercise_r.length; i++){
        var e = exercise_r[i];
        var e_sample = e.sample;
        console.log("e_sample :",e_sample);
        var index = e.exercise_index;
        if(exercise_list[index]){
            exercise_list[index].breakdown[e.sn - 1] = {
                sn: e.sn, 
                content: e_sample?  this.replaceParams(e.content,e_sample) : e.content, 
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
                content: e_sample?  this.replaceParams(e.content,e_sample) : e.content, 
                presn: e.presn, 
                kpid: e.kpid,
                kpname: e.kpname,
                sn_rating: e.sn_rating,
                kp_rating: e.kp_rating ? e.kp_rating : default_rating,
            };
            exercise_list[index] = {
                exercise_id: e.exercise_id, 
                exercise_type: e.exercise_type, 
                title: e_sample?  this.replaceParams(e.title,e_sample) : e.title, 
                title_img_url: e_sample?  e.s_title_img_url : e.title_img_url, 
                title_audio_url: e_sample?  e.s_title_audio_url : e.title_audio_url,
                // answer: JSON.parse(e.answer),
                answer: e_sample?  JSON.parse(e.s_answer): JSON.parse(e.answer), 
                // sample: e.sample ? JSON.parse(e.sample) : {},
                sample_index: e.sample_index,
                breakdown: breakdown,
                exercise_rating: e.exercise_rating,
            };
        }
    }
    return exercise_list;
}

  async generateTestByKp(kpid, kpname, student_id){
    const kp_rating = await this.app.mysql.get('student_kp', {
            student_id: student_id,
            kpid: kpid,
        });
    const exercise_list = await this.getExerciseByKpRating(kpid, kp_rating.kp_rating);

    const start_time = new Date();
    const test_result = await this.app.mysql.insert('teacher_test', {
        test_name: "攻克" + kpname,
        teacher_id: -1,
        group_time: start_time,
        enable_time: start_time,
        total_exercise: exercise_list.length,
        test_type: 2,
        test_config: JSON.stringify({kp: [{kpid: kpid, kpname: kpname}]}),
    });

    const test_id = test_result.insertId;
    let log_result = await this.app.mysql.insert('test_log', {
        student_id: student_id, 
        test_id: test_id, 
        start_time: start_time, 
        total_exercise: exercise_list.length
    })

    var exercise_test = [];
    for(var i = 0; i < exercise_list.length; i++){
        exercise_test[i] = {test_id: test_id, exercise_id: exercise_list[i].exercise_id, exercise_index: i};
    }
    const exercise_result = await this.app.mysql.insert('exercise_test', exercise_test);
    return {test_id: test_id};

  }

  

}

module.exports = ExerciseService;
 