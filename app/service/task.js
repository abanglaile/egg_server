const Service = require('egg').Service;
const uuid = require('uuid');

class TaskService extends Service {
    async addTask(task) {
        task.task_id = uuid.v1();
        task.create_time = new Date();
        await this.app.mysql.insert('task', task);
        return task;
    }

    async assignTask(task, users){
        let insert_task = this.addTask(task);
        for(let i = 0; i < users; i++){
            let task_log = {
                task_id: insert_task.task_id,
                student_id: users[i].student_id,
                start_time: new Date(),
            }
            await this.addTaskLog(task.taskid, user);
        }
        return insert_task;
    }

    async addTaskLog(task_log){
        return await this.app.mysql.insert('task_log', task_log);
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
            from task_source t where t.source_name like ?`, '%'+input+'%');
    }

}

module.exports = TaskService;
 