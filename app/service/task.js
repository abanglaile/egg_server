const Service = require('egg').Service;
const uuid = require('uuid');

class TaskService extends Service {
    async addTask(task) {
        task.task_id = uuid.v1();
        task.create_time = new Date();
        await this.app.mysql.insert('task', task);
        return task.task_id;
    }

    async assignTask(task, users){
        // var task_id = this.addTask(task);
        const task_id = uuid.v1();
        task.task_id = task_id;
        task.create_time = new Date();
        const res = await this.app.mysql.insert('task', task);
        for(let i = 0; i < users.length; i++){
            let task_log = {
                task_id: task_id,
                student_id: users[i].student_id,
                start_time: new Date(),
            }
            await this.addTaskLog(task_log);
        }
        return task;
    }

    async addTaskLog(task_log){
        return await this.app.mysql.query('insert ignore into task_log(task_id, student_id, start_time) values(?, ?, ?)', 
            [task_log.task_id, task_log.student_id, task_log.start_time]);
    }

    async deleteTaskLog(task_id, users){
        for(var i = 0; i < users.length; i++){
            await this.app.mysql.delete('task_log', {task_id: task_id, student_id: users[i].student_id});
        }
        let task_log = await this.app.mysql.get('task_log', {task_id: task_id});
        if(!task_log){
            //没有task_log则删除该task
            await this.app.mysql.delete('task', {task_id: task_id});
        }
        return;
    }

    async searchTaskSource(input){
        return await this.app.mysql.query(`select t.source_id, t.source_name, t.source_type 
            from task_source t where t.source_name like ? and t.source_type <> 3`, '%'+input+'%');
    }

    async searchTeacherTask(teacher_id, input){
        return await this.app.mysql.query(`select t.*, ts.source_name 
        from task t, task_source ts where t.source_id = ts.source_id and t.create_user = ? and (ts.source_name like ? or t.remark like ?)`, [teacher_id, '%'+input+'%', '%'+input+'%']);
    }


    async getTaskTable(teacher_id) {
        const results = await this.app.mysql.query(`select t.*,s.source_name from task t ,task_source s 
        where t.create_user = ? and t.source_id = s.source_id order by t.create_time desc;`, [teacher_id]);
    
        return results;
    }

    async deleteOneTask(task_id){

        const del1 = await this.app.mysql.delete('task', {
            task_id: task_id,
        });
        const del2 = await this.app.mysql.delete('task_log', {
            task_id: task_id,
        });
        return del2;
    }

    async getTaskInfoById(task_id){

        const results = await this.app.mysql.query(`select t.*,s.source_name from task t,
        task_source s where t.source_id = s.source_id and t.task_id = ?; `, [task_id]);

        return results[0];
    }

    async getTaskResultInfo(task_id){
        const results = await this.app.mysql.query(`select l.*,u.realname from task_log l ,
        users u where l.student_id = u.userid and l.task_id = ?;`, task_id);
        console.log("results");
        return results;
    }

    async setVerifyRes(verifyState, comment, taskid, teacher_id, student_id){
        const res = await this.app.mysql.update('task_log', {
            verify_time: new Date(), 
            verify_state: verifyState,
            verify_user: teacher_id,
            comment: comment,
            }, {
            where: {
                task_id: taskid,
                student_id: student_id,
            }
        }) 
    }

}

module.exports = TaskService;
 