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

    async distributeTaskLog(users,tasklog){
        for(let i = 0; i < users.length; i++){
            let task_log = {
                task_id: tasklog.task_id,
                student_id: users[i].student_id,
                verify_user: tasklog.verify_user,
                start_time: new Date(),
            }
            await this.addTaskLog(task_log);
        }
        return tasklog;
    }

    async addTaskLog(task_log){
        return await this.app.mysql.query('insert ignore into task_log(task_id, student_id, verify_user, start_time) values(?, ?, ?, ?)', 
            [task_log.task_id, task_log.student_id, task_log.verify_user, task_log.start_time]);
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
        return await this.app.mysql.query(`select t.* from task_source t 
            where t.source_name like ? and t.source_type <> 3`, '%'+input+'%');
    }

    async searchTeacherTask(teacher_id, input){
        // return await this.app.mysql.query(`select t.*, ts.source_name 
        // from task t, task_source ts where t.source_id = ts.source_id and t.create_user = ? and (ts.source_name like ? or t.remark like ?)`, [teacher_id, '%'+input+'%', '%'+input+'%']);
        return await this.app.mysql.query(`select t.*, ts.source_name 
        from task t, task_source ts where t.source_id = ts.source_id and t.create_user = ? and (ts.source_name like ? )`, [teacher_id, '%'+input+'%']);
    }

    async getTaskTable(teacher_id){
        return await this.app.mysql.query(`select t.*,s.source_name,s.sub_name from task t ,task_source s 
           where t.create_user = ? and t.source_id = s.source_id order by t.create_time desc;`, [teacher_id]);
    }

    async getTaskLogTable(teacher_id) {
        // const results = await this.app.mysql.query(`select t.*,s.source_name from task t ,task_source s 
        // where t.create_user = ? and t.source_id = s.source_id order by t.create_time desc;`, [teacher_id]);
        // const results = await this.app.mysql.query(`select t.*,s.source_name,s.sub_name,s.version,
        //     l.student_id,u.realname from task t
        //     INNER JOIN task_log l on t.task_id = l.task_id
        //     INNER JOIN task_source s on t.source_id = s.source_id
        //     INNER JOIN users u on l.student_id = u.userid 
        //     where  t.create_user = ? order by t.create_time desc;
        //     `, [teacher_id]);

        const results = await this.app.mysql.query(`select t.task_id,l.verify_state,l.start_time,
            count(*) as num,t.create_time,t.task_type,t.assign_type,t.content,s.source_name,s.sub_name,
            s.version from task t INNER JOIN task_log l on t.task_id = l.task_id
            INNER JOIN task_source s on t.source_id = s.source_id
            where  l.verify_user = ? GROUP BY l.task_id,l.verify_state 
            order by l.start_time desc ;
            `, [teacher_id]);

        var task_data = [];
        var task_index = [];
        var list_index = 0;
        for(var i = 0; i < results.length; i++){
            var e = results[i];
            const index = task_index[e.task_id];
            if(index >= 0){
                task_data[index].verify_sta[e.verify_state] = e.num;
            }else{
                var verify_sta = {};
                verify_sta[e.verify_state] = e.num;
              
                var group = {
                    task_id: e.task_id, 
                    create_time: e.create_time,
                    start_time : e.start_time,
                    task_type : e.task_type,
                    content : e.content,
                    assign_type : e.assign_type,
                    source_name : e.source_name,
                    sub_name : e.sub_name,
                    version : e.version,
                    verify_sta : verify_sta,
                };
                task_data[list_index] = group;
                task_index[e.task_id] = list_index;
                list_index++;
            }
        }
        //verify_state小状态（0:未提交 1:已提交(待审核) 2:审核通过 3:已领取(通过后积分) 4：审核未通过）
        /***task 大状态 （
        uncheck  待审核 存在小状态为1
        focus  待督办 存在小状态为0 或存在小状态为4
        checked  已审核 其他
        *****/
        var task_state = null; 
        for(var j=0;j<task_data.length;j++){
            task_state = null; 
            var ele = task_data[j].verify_sta;
            if(ele[1] > 0){//待审核 存在小状态为1
                task_state = 'uncheck';
            }else if(ele[0] > 0 || ele[4] > 0){//待督办 存在小状态为0
                task_state = 'focus';
            }else{
                task_state = 'checked';
            }
            task_data[j].taskState = task_state;
        }

        return task_data;
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
        const results = await this.app.mysql.query(`select t.*,s.source_name,s.sub_name from task t,
        task_source s where t.source_id = s.source_id and t.task_id = ?; `, [task_id]);

        return results[0];
    }

    async getTaskResultInfo(task_id){
        const results = await this.app.mysql.query(`select l.*,t.assign_type,u.realname from 
        task_log l ,task t, users u where l.student_id = u.userid and 
        t.task_id = l.task_id and l.task_id = ?;`, task_id);
        // console.log("results");
        return results;
    }

    async setVerifyRes(verify_state, comment, task_id, verify_user, student_id, assign_type){
        const res = await this.app.mysql.update('task_log', {
            verify_time: new Date(), 
            verify_state: verify_state,
            // verify_user: verify_user,
            comment: comment,
            }, {
            where: {
                task_id: task_id,
                student_id: student_id,
            }
        })
        if(assign_type == 1){
            await this.service.path.finishNodeTask(student_id, task_id, verify_user)
        }
        return res
    }

    async getStuTaskLog(student_id, online, submit_time){
        let sql = `select t.*, ts.source_name, ts.sub_name, cl.course_label_name, tl.verify_state from task_log tl inner join task t on tl.task_id = t.task_id
            inner join task_source ts on t.source_id = ts.source_id 
            inner join course_label cl on cl.course_label = ts.course_label
            where tl.student_id = ? `;
        sql += online ? 'and (tl.verify_state < 2 or tl.verify_state is null)' : 'and tl.verify_state = 3';
        let params = [student_id];
        if(submit_time){
            sql += ' and tl.submit_time >= ?';
            params.push(submit_time);
        }
        const res = await this.app.mysql.query(sql, params);
        return res;
    }

    async getTaskLog(student_id, task_id){
        return await this.app.mysql.queryOne(`select t.*, tl.*, ts.* from task_log tl 
            inner join task t on tl.task_id = t.task_id and tl.student_id = ? and tl.task_id = ?
            inner join task_source ts on t.source_id = ts.source_id`, [student_id, task_id]);
    }

    async submitTaskLog(task_log){
        // const submit_url = ""
        const res = await this.app.mysql.update('task_log', {
                submit_time: new Date(), 
                submit_url: task_log.submit_url,
                correct_rate: task_log.correct_rate,
                total_ex: task_log.total_ex,
                wrong_ex: task_log.wrong_ex,
                verify_state: 1
            }, {
            where: {
                task_id: task_log.task_id,
                student_id: task_log.student_id,
            }
        })
        return res;
    }
    
    async gainExp(student_id, task_id){
        const res = await this.app.mysql.update('task_log', {
            verify_state: 3
        }, {
            where: {
                task_id: task_id,
                student_id: student_id,
            }
        })

        const task_log = await this.app.mysql.get('task_log', {
            task_id: task_id,
            student_id: student_id
        })
        await this.service.exp.addStuExp(student_id, task_log.final_exp)
        return {
            delta_exp: task_log.final_exp
        }
    }
}

module.exports = TaskService;
 