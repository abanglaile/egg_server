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
      cron: '0 0 3 * * *',
      // interval: '1h',
      // immediate: true,
    };
  }

  async subscribe() {
    // const logid = await this.app.mysql.queryOne("select max(logid) as logid from exercise_log_trigger t");
    // const logs = await this.ctx.service.rating.getExerciseLogTrigger(logid);
    // for(let i = 0; i < logs.length; i++){
    //   await this.app.mysql.query(`insert into exercise_rating_history(exercise_id, exercise_rating) 
    //     select exercise_id, ? + exercise_rating from exercise where exercise_id = ?`, [logs[i].delta_exercise_rating, logs[i].exercise_id]);
    // }
    // await this.app.mysql.query(`delete t.* from exercise_log_trigger t where el.logid <= ?`);
  }
}

module.exports = FixExerciseRating;