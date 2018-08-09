const Service = require('egg').Service;

class statusService extends Service {

  async getMyLadderScore(student_id){
    const res = await this.app.mysql.query('select t.student_rating from student_rating t where t.student_id = ? ORDER BY update_time DESC LIMIT 1', student_id);
    return res;    
  }

  

  async getChapterStatus(student_id,chapter_id) {

    const res = await this.app.mysql.query('select k.kpid, k.kpname, ks.kp_standard ,sk.kp_rating, '
    +'sk.practice, sk.correct from chapter c, '
    +'kptable k LEFT JOIN kp_standard ks on ks.kpid = k.kpid LEFT JOIN student_kp sk on k.kpid = sk.kpid and sk.student_id = ? '
    +'where c.chapterid = ? and k.chapterid = c.chapterid;'
    , [student_id,chapter_id]);

    return res;
  }

  async getTestKpReward(student_id, test_id){

    const res = await this.app.mysql.query('SELECT sum(bl.kp_delta_rating) '
    +'as kp_delta_rating, bl.kp_old_rating, bl.kpid, kt.kpname FROM '
    +'exercise_log el, breakdown_log bl, kptable kt where el.student_id = ? and'
    +' el.test_id = ? and bl.logid = el.logid and kt.kpid = bl.kpid GROUP BY bl.kpid;'
    , [student_id,test_id]);

    return res;

  }

  async getTestRatingReward(student_id, test_id){

    const stu_r = await this.app.mysql.query('SELECT sum(el.delta_student_rating) as '
    +'delta_student_rating, el.old_student_rating FROM exercise_log el where el.student_id = ? and el.test_id = ?'
    , [student_id,test_id]);

    const kp_r = await this.getTestKpReward(student_id, test_id);

    console.log(stu_r[0]);
    console.log(kp_r);

    return ({
        kp_rating: kp_r,
        rating: stu_r[0],
        credit: {
            delta_credit: 5,
            old_credit: 30,
            new_credit: 35,
        }
    });
  }


  async getTestSize(test_id){
    const res = await this.app.mysql.query('select count(*) as size from exercise_test et where et.test_id = ?;'
    , test_id);

    return res;
  }

  async getTestStatus(test_id){
    const res = await this.app.mysql.query('select tl.*,timestampdiff(SECOND,tl.start_time,tl.finish_time) '
    +'as time_consuming from test_log tl where tl.test_id = ?;'
    , test_id);

    return res;
  }

  async getTestStatusBytestid(test_id){

    const test = await this.getTestSize(test_id);
    const test_log = await this.getTestStatus(test_id);

    console.log("getTestStatus test_log:"+JSON.stringify(test_log));
    var accurracy = 0;//总答对数量
    var bingo = 0;
    var test_submit = 0;
    var testsize = test[0].size;
    var time_sum = 0;
    for(var i = 0; i < test_log.length; i++){
        accurracy += test_log[i].correct_exercise;//一共对了多少题
        if(test_log[i].finish_time){
            test_submit++;
            time_sum = time_sum+test_log[i].time_consuming;
        }
        if(test_log[i].test_state == 100){
            bingo++;
        }
    }
    const avg_accurracy = (accurracy/(test_submit*testsize))? (accurracy/(test_submit*testsize)).toFixed(1) : 0;
    const avg_timeconsuming = Math.round(time_sum/test_submit);

    return({
        test_status: {
            // test_name: test[0][0].test_name,
            avg_accurracy: avg_accurracy,//平均答对的题目数
            test_students: test_log.length,
            test_submit: test_submit,
            bingo: bingo,
            avg_timeconsuming: avg_timeconsuming,
            test_size: testsize//test中的题目个数
        }
    });

  }

  async getTestRankingList(test_id){
    const res = await this.app.mysql.query('SELECT s.`finish_time` ,s.`start_time`,'
    +'timestampdiff(SECOND,s.start_time,s.finish_time) as time_consuming,'
    +'s.`correct_exercise`,s.`total_exercise` ,g.`student_name` from `test_log` s ,'
    +'group_student g where s.`test_id` = ? and g.`student_id` = s.`student_id` and '
    +'s.`correct_exercise` is not null and s.`finish_time` is not null ORDER BY correct_exercise DESC LIMIT 7;'
    , test_id);

    return res;
  }
  //根据student_id 获取综合概况能力数据(全部题目情况)
  async getAlltestProfile(student_id){
    var sql1 = "select count(*) as c from exercise_log l where l.student_id = ?";
    var sql2 = "select count(*) as c from exercise_log l where l.student_id = ? and l.exercise_state = 1";
    var sql3 = "select t.student_rating from student_rating t where t.student_id = ? ORDER BY update_time DESC LIMIT 1";
    var sql = sql1+';'+sql2+';'+sql3+';';

    const res = await this.app.mysql.query(sql, [student_id,student_id,student_id]);
    return res;
  }
  //根据student_id 获取综合概况能力数据(近20题情况)
  async get20testProfile(student_id){
    var sql1 = "SELECT count(*) as c FROM (SELECT l.exercise_state from exercise_log l where l.student_id = ? ORDER BY submit_time DESC  LIMIT 20) s WHERE s.exercise_state = 1";
    var sql2 = "SELECT count(*) as c FROM (SELECT l.exercise_state from exercise_log l where l.student_id = ? ORDER BY submit_time DESC  LIMIT 20) s ";
    var sql3 = "SELECT SUM(s.delta_student_rating) as sum from (SELECT l.delta_student_rating from exercise_log l WHERE l.student_id = ? ORDER BY submit_time DESC LIMIT 20) s";
    var sql = sql1+';'+sql2+';'+sql3+';';

    const res = await this.app.mysql.query(sql, [student_id,student_id,student_id]);
    return res;
  }
  //根据student_id 获取综合概况能力数据(近50题情况)
  async get50testProfile(student_id){
    var sql1 = "SELECT count(*) as c FROM (SELECT l.exercise_state from exercise_log l where l.student_id = ? ORDER BY submit_time DESC  LIMIT 50) s WHERE s.exercise_state = 1";
    var sql2 = "SELECT count(*) as c FROM (SELECT l.exercise_state from exercise_log l where l.student_id = ? ORDER BY submit_time DESC  LIMIT 50) s ";
    var sql3 = "SELECT SUM(s.delta_student_rating) as sum from (SELECT l.delta_student_rating from exercise_log l WHERE l.student_id = ? ORDER BY submit_time DESC LIMIT 50) s";
    var sql = sql1+';'+sql2+';'+sql3+';';

    const res = await this.app.mysql.query(sql, [student_id,student_id,student_id]);
    return res;
  }

  async getStuAbility(student_id){

    var capatity = [];

    const res_all = await this.getAlltestProfile(student_id);
    var group1 = {
        key : '1',
        exercount : res_all[0][0].c,   //做过的题目总数
        rate : ((res_all[1][0].c/res_all[0][0].c)*100).toFixed(1),  //总正确率
        ladderscore : res_all[2][0].student_rating,  //最新的天梯分
    };
    capatity.push(group1);

    const res_20 = await this.get20testProfile(student_id);
    var group2 = {
        key : '2',  
        exercount : res_20[1][0].c,   
        rate : ((res_20[0][0].c/res_20[1][0].c)*100).toFixed(1),  //最近20题正确率
        ladderscore : res_20[2][0].sum,  //最近20题变化的天梯分
    };
    capatity.push(group2);

    const res_50 = await this.get50testProfile(student_id);
    var group3 = {
        key : '3',
        exercount : res_50[1][0].c,   
        rate : ((res_50[0][0].c/res_50[1][0].c)*100).toFixed(1),  //最近50题正确率
        ladderscore : res_50[2][0].sum,  //最近50题变化的天梯分
    };
    capatity.push(group3);
    console.log('capatity:'+JSON.stringify(capatity));

    return capatity;
  }

  //根据student_id 获取所有时间节点天梯分变化情况
  async getLadderChangeWithTime(student_id){
    const res = await this.app.mysql.query('SELECT a.`update_time` ,a.student_rating from '
    +'(SELECT s.* from student_rating s where s.`student_id` = ? ) a where not EXISTS '
    +'(select 1 from (SELECT s.* from student_rating s where s.`student_id` = ?) b '
    +'where datediff(a.update_time,b.update_time)=0 and b.id>a.id);'
    , [student_id,student_id]);

    return res;
  }

  // //根据学生id,kpid  获取kpid各时间节点天梯分变化情况
  // async getKpLadderChange(student_id,kpid){
  //   const res = await this.app.mysql.query('select a.update_time ,a.kp_rating from '
  //   +'(SELECT s.* from student_kp_history s where s.student_id = ? and s.kpid=?) a '
  //   +'where not EXISTS (select 1 from (SELECT s.*  from student_kp_history s '
  //   +'where s.student_id = ? and s.kpid=?) b where datediff(a.update_time,b.update_time)=0 and b.logid>a.logid);'
  //   , [student_id,kpid,student_id,kpid]);

  //   return res;
  // }

  // //根据学生id,kpid 获取学生知识点能力综合概况（天梯分，正确率，练习次数）
  // async getKpAbility(student_id,kpid){
  //   const res = await this.app.mysql.query('select s.`kp_rating` , s.`practice` , s.`correct`,k.kpname,'
  //   +'c.chaptername  from `student_kp` s,kptable k,`chapter` c where s.`student_id` =?'
  //   +' and s.`kpid` = ? and  s.kpid=k.kpid and k.chapterid=c.chapterid;'
  //   , [student_id,kpid]);

  //   return res;
  // }

  //根据student_id 获取最常训练到的知识点（3个）
  async getStuComUsedKp(student_id){

    var usedkp = [];
    const results = await this.app.mysql.query('SELECT r.c,r.kpid,r.kpname,sum(r.exercise_state) '
    +'as cc from (SELECT temp.c,temp.kpid,temp.kpname,temp.student_id,l.exercise_state from '
    +'(SELECT t.c,t.kpid,k.kpname,t.student_id from (SELECT count(s.kpid) as c,s.kpid,s.`student_id` '
    +'from `student_kp_history` s where s.`student_id` =?  GROUP BY kpid) t,`kptable` k '
    +'where k.kpid=t.kpid ORDER BY t.c DESC  LIMIT 3) as temp,`kptable` k,`kp_exercise` e,'
    +'`exercise_log` l where k.kpid=temp.kpid and k.kpid = e.kpid and e.exercise_id = l.exercise_id'
    +'and temp.student_id = l.student_id) as r GROUP BY kpid;'
    , student_id);

    for(var i = 0; i < results.length; i++){
        usedkp.push({
            kpid : results[i].kpid,
            kpname : results[i].kpname,
            usedcount : results[i].c,
            rate : ((results[i].cc/results[i].c)*100).toFixed(1),
        });
    }
    console.log('usedkp:'+JSON.stringify(usedkp));
    return usedkp;

  }



}

module.exports = statusService;
 