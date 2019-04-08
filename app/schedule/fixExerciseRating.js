const Subscription = require('egg').Subscription;

class FixExerciseRating extends Subscription {
  /**
   * @property {Object} schedule
   *  - {String} type - schedule type, `worker` or `all` or your custom types.
   *  - {String} [cron] - cron expression, see [below](#cron-style-scheduling)
   *  - {Object} [cronOptions] - cron options, see [cron-parser#options](https://github.com/harrisiirak/cron-parser#options)
   *  - {String | Number} [interval] - interval expression in millisecond or express explicitly like '1h'. see [below](#interval-style-scheduling)
   *  - {Boolean} [immediate] - To run a scheduler at startup
   *  - {Boolean} [disable] - whether to disable a scheduler, usually use in dynamic schedule
   *  - {Array} [env] - only enable scheduler when match env list
   */
  static get schedule() {
    return {
      type: 'worker',
      //cron: '5 * * * * *',
      interval: '1h',
      immediate: true,   
    };
  }

  async subscribe() {
    const res = await this.app.mysql.queryOne("select max(logid) as logid from exercise_log_trigger t");
    const exercise_logs = await this.ctx.service.rating.getNewExerciseRating(res.logid);
    const breakdown_logs = await this.ctx.service.rating.getNewSnRating(res.logid);
    for(let i = 0; i < exercise_logs.length; i++){
      await this.app.mysql.query(`insert into exercise_rating_history(exercise_id, exercise_rating) values(?, ?)`, 
      [exercise_logs[i].exercise_id, exercise_logs[i].new_exercise_rating]);
    }
    for(let i = 0; i < breakdown_logs.length; i++){
      await this.app.mysql.query(`insert into sn_rating_history(exercise_id, sn, sn_rating) values(?, ?, ?)`, 
        [breakdown_logs[i].exercise_id, breakdown_logs[i].sn,  breakdown_logs[i].new_sn_rating]);
    }
    await this.app.mysql.query(`delete t.* from exercise_log_trigger t where t.logid <= ?`, [res.logid]);
  }
}

module.exports = FixExerciseRating;