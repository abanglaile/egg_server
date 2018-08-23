
const Service = require('egg').Service;

class statusService extends Service {

  async getTestRatingReward(student_id, test_id){
    let stu_r = this.app.mysql.query(`SELECT sum(el.delta_student_rating) as delta_student_rating,
     el.old_student_rating FROM exercise_log el where el.student_id = ? and el.test_id = ?`
    , [student_id,test_id]);

    let kp_r = this.app.mysql.query(`SELECT sum(bl.kp_delta_rating) as kp_delta_rating, 
    bl.kp_old_rating, bl.kpid, kt.kpname FROM 
    exercise_log el, breakdown_log bl, kptable kt where el.student_id = ? and
    el.test_id = ? and bl.logid = el.logid and kt.kpid = bl.kpid GROUP BY bl.kpid;`
    , [student_id,test_id]);

    stu_r = await stu_r;
    return ({
        kp_rating: await kp_r,
        rating: stu_r[0],
    });
  }

  //根据student_id 获取综合概况能力数据(全部题目情况)
  async getAlltestProfile(student_id){
    var sql1 = "select count(*) as c from exercise_log l where l.student_id = ?";
    var sql2 = "select count(*) as c from exercise_log l where l.student_id = ? and l.exercise_state = 1";
    var sql = sql1+';'+sql2+';';

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

  async getStuAbility(student_id, course_id){

    var capatity = [];

    const res_all = await this.getAlltestProfile(student_id);
    const rating = this.service.rating.getStudentRating(student_id, course_id);
    var group1 = {
        key : '1',
        exercount : res_all[0][0].c,   //做过的题目总数
        rate : ((res_all[1][0].c/res_all[0][0].c)*100).toFixed(1),  //总正确率
        ladderscore : await rating,  //最新的天梯分
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


  //根据student_id 获取最近薄弱知识点（3个）
  async getStuPoorKp(student_id){
    // const results = await this.app.mysql.query('SELECT r.c,r.kpid,r.kpname,sum(r.exercise_state) '
    // +'as cc from (SELECT temp.c,temp.kpid,temp.kpname,temp.student_id,l.exercise_state from '
    // +'(SELECT t.c,t.kpid,k.kpname,t.student_id from (SELECT count(s.kpid) as c,s.kpid,s.`student_id` '
    // +'from `student_kp_history` s where s.`student_id` =?  GROUP BY kpid) t,`kptable` k '
    // +'where k.kpid=t.kpid ORDER BY t.c DESC  LIMIT 3) as temp,`kptable` k,`kp_exercise` e,'
    // +'`exercise_log` l where k.kpid=temp.kpid and k.kpid = e.kpid and e.exercise_id = l.exercise_id'
    // +'and temp.student_id = l.student_id) as r GROUP BY kpid;'
    // , student_id);

    
    const poorkp = await this.app.mysql.query(`select bl.kpid, count(bl.logid) as count, kt.kpname, sk.kp_rating  
    from (select logid from exercise_log where student_id = ? order by logid desc limit 50) el
    ,breakdown_log bl left join kptable kt on kt.kpid = bl.kpid 
    left join student_kp sk on sk.student_id = ? and sk.kpid = bl.kpid
    where bl.logid = el.logid and sn_state = 0 
    group by bl.kpid order by count(bl.logid) desc limit 3`
    , [student_id, student_id]);

    // for(var i = 0; i < results.length; i++){
    //     usedkp.push({
    //         kpid : results[i].kpid,
    //         kpname : results[i].kpname,
    //         count : results[i].count,
    //         kp_rating : ((results[i].cc/results[i].c)*100).toFixed(1),
    //     });
    // }
    return poorkp;

  }



}

module.exports = statusService;
 