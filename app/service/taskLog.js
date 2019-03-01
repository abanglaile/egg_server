const Service = require('egg').Service;

class TaskLogService extends Service {

    async getTaskResultInfo(task_id){
        const results = await this.app.mysql.query(`select l.*,u.realname from task_log l ,
        users u where l.student_id = u.userid and l.task_id = ?;`, task_id);
        console.log("results");
        return results;
    }

}
module.exports = TaskLogService;