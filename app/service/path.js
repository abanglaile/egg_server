const Service = require('egg').Service;

class PathService extends Service {
    async getStudentPath(student_id){
        return await this.app.mysql.query(`select pc.path_chapter_name, cn.node_name,
         sp.path_chapter_index, sp.node_index, p.path_name, sp.path_id
        from student_path sp inner join path p on sp.path_id = p.path_id and sp.student_id = ?
        inner join path_chapter pc on sp.path_id = pc.path_id and sp.path_chapter_index = pc.chapter_index
        inner join chapter_node cn on pc.path_chapter_id = cn.path_chapter_id and cn.node_index = sp.node_index`, [student_id]);
    }

    async getStudentPathChapter2(student_id, path_id){
        const student_path = await await this.app.mysql.queryOne(`select pc.path_chapter_id, pc.path_chapter_name,
        cn.node_name, sp.path_chapter_index, sp.node_index, p.path_name 
        from student_path sp inner join path p on sp.path_id = p.path_id and sp.path_id = ? and sp.student_id = ? 
        inner join path_chapter pc on sp.path_id = pc.path_id and sp.path_chapter_index = pc.chapter_index
        inner join chapter_node cn on pc.path_chapter_id = cn.path_chapter_id and cn.node_index = sp.node_index`,
        [path_id, student_id]);

        const path_chapter = await this.app.mysql.query(`select pc.path_chapter_name, 
        pc.chapter_index, pc.task_count, pc.kp_count
        from path_chapter pc order by pc.chapter_index asc;`, [path_id])

        let task_count = 0, kp_count = 0
        for(let i = 0; i < path_chapter.length; i++){
            task_count += path_chapter[i].task_count
            kp_count += path_chapter[i].kp_count
        }
        //temp
        student_path.user_count = 5
        student_path.task_count = task_count
        student_path.kp_count = kp_count
        return {
            student_path: student_path,
            path_chapter: path_chapter
        }
    }

    async getStudentPathChapter(student_id, group_id, path_id){
        const path_chapter_list = await this.app.mysql.query(`select * from path_chapter p 
            where p.path_id = ? order by p.chapter_index asc;`,[path_id]);
        const stu_path = await this.app.mysql.query(`select p.path_chapter_id,s.*,u.realname,
        pa.path_name ,sg.group_name from student_path s,path_chapter p,users u,path pa,school_group sg 
        where s.path_id = p.path_id and s.path_chapter_index = p.chapter_index and 
        u.userid=s.student_id and pa.path_id = s.path_id and sg.stu_group_id = s.stu_group_id 
        and s.student_id = ? and s.stu_group_id = ? and s.path_id = ?;`,[student_id,group_id,path_id]);
       
        return {
                    path_chapter_list:path_chapter_list,
                    current_chapter_index:stu_path[0].path_chapter_index,
                    current_chapter_id:stu_path[0].path_chapter_id,
                    current_node_index:stu_path[0].node_index,
                    realname:stu_path[0].realname,
                    path_name:stu_path[0].path_name,
                    group_name:stu_path[0].group_name,
                };
    }

    async getStudentChapterNode(student_id, path_chapter_id){
        // console.log("student_id:",student_id);
        // console.log("group_id:",group_id);
        // console.log("path_chapter_id:",path_chapter_id);
        const task_logs = await this.app.mysql.query(`select cn.node_id, cn.node_name, cn.node_index, 
            nt.task_index, nt.task_desc, t.task_count,t.content,snt.visible, kt.kp_tag_name, sn.invisible,
            tl.total_ex, tl.wrong_ex, tl.correct_rate,tl.submit_url,tl.verify_state, tl.start_time, nt.task_id
            from node_task nt inner join kp_tag kt on nt.kp_tag_id = kt.kp_tag_id
            inner join task t on nt.task_id = t.task_id
            left join student_node_task snt on nt.task_id = snt.task_id and snt.student_id = ?
            left join task_log tl on nt.task_id = tl.task_id and tl.student_id = ?
            , chapter_node cn left join student_node sn on cn.node_id = sn.node_id and sn.student_id = ?
            where nt.node_id = cn.node_id and cn.path_chapter_id = ?
            order by cn.node_index, nt.task_index`,
             [student_id, student_id, student_id, path_chapter_id]);

        const test_logs = await this.app.mysql.query(`select nt.test_id, nt.test_desc, nt.test_index,
        cn.node_index, cn.node_name, cn.node_id, tt.total_exercise, tl.finish_time, tl.result, tl.start_time 
        from node_test nt inner join teacher_test tt on nt.test_id = tt.test_id
        left join test_log tl on nt.test_id = tl.test_id and tl.student_id = ?,
        chapter_node cn left join student_node sn on cn.node_id = sn.node_id and sn.student_id = ?
        where nt.node_id = cn.node_id and cn.path_chapter_id = ?
        order by cn.node_index`,
        [student_id, student_id, path_chapter_id]);        

        // const path_chapter = await await this.app.mysql.queryOne(`select path_chapter_name from path_chapter
        // where path_chapter_id = ?`,
        // [path_chapter_id]);

        const student_path = await await this.app.mysql.queryOne(`select pc.path_chapter_id, pc.path_chapter_name,
        sp.path_chapter_index, sp.node_index 
        from student_path sp inner join path_chapter pc on sp.student_id = ? and pc.chapter_index = sp.path_chapter_index 
        and pc.path_id = sp.path_id 
        inner join chapter_node cn on pc.path_chapter_id = cn.path_chapter_id and cn.node_index = sp.node_index`,
        [student_id]);

        let chapter_node_list = []
        for(let i = 0; i < test_logs.length; i++){
            if(!test_logs[i].invisble){
                if(test_logs[i].test_index == 0){
                    //pre_test
                    // test_logs[i].result = test_logs[i].result ? JSON.parse(test_logs[i].result) : null
                    if(test_logs[i].finish_time){
                        test_logs[i].result = await this.getPreTestResult(student_id, test_logs[i].test_id)
                    }
                    let node = {
                        node_id: test_logs[i].node_id,
                        node_name: test_logs[i].node_name,
                        node_index: test_logs[i].node_index,
                        pre_test: test_logs[i],
                        node_tasks: []
                    }
                    chapter_node_list.push(node)
                }
            }
        }

        let pre_node_id = "", index = -1, current_task_count = 0, before = true
        //merge node_tasks into node_list
        for(let i = 0; i < task_logs.length; i++){
            let log = task_logs[i]
            //debug
            //log.visible = 1;
            if(!log.invisble && log.visible){
                if(log.node_id != pre_node_id){
                    index++
                    pre_node_id = log.node_id
                    if(!chapter_node_list[index]){
                        //if no pretest
                        chapter_node_list[index] = {
                            node_id: log.node_id,
                            node_name: log.node_name,
                            node_index: log.node_index,
                            pre_test: {},
                            node_tasks: []
                        }
                    }
                }
                chapter_node_list[index].node_tasks.push({
                    task_desc: log.task_desc,
                    task_count: log.task_count,
                    content:log.content,
                    verify_state: log.verify_state,
                    submit_url: log.submit_url,
                    task_id: log.task_id,
                    start_time: log.start_time,
                    total_ex: log.total_ex,
                    wrong_ex: log.wrong_ex,
                    correct_rate: log.correct_rate
                })
            }

            let before = true
            if((chapter_node_list[index] && !chapter_node_list[index].pre_test.result) || log.verify_state == 0){
                before = false
            }
            if(log.node_index < student_path.node_index || 
                (log.node_index == student_path.node_index && before)){
                    current_task_count++
            }
        }
        return {
            chapter_node_list: chapter_node_list,
            chapter_progress: {
                path_chapter_name: student_path.path_chapter_name,
                task_count: task_logs.length,
                current_task_count: current_task_count
            }
        }
    }

    //临时使用，之后数据存入test_log后弃用
    async getPreTestResult(student_id, test_id){
        const breakdown_log = await this.app.mysql.query(`select c.chaptername, c.chapterid, 
            bl.sn_state, bl.kpid, bl.kpname, kg.kp_tag_name, ks.mean, ks.variance,
            bl.kp_old_rating, bl.kp_delta_rating  
            from breakdown_log bl inner join kptable k on k.kpid = bl.kpid 
            inner join chapter c on k.chapterid = c.chapterid
            inner join kp_tag kg on kg.kp_tag_id = bl.kp_tag_id
            left join kp_standard ks on ks.kpid = bl.kpid
            where bl.student_id = ? and bl.test_id = ? order by update_time asc`, [student_id, test_id])
        
        let log0 = breakdown_log[0]
        let pre_test = {
            chapter_name: log0.chaptername,
            kpname: log0.kpname,
            mean: log0.mean ? log0.mean : 500,
            variance: log0.variance ? log0.variance : 130,
            kp_new_rating: log0.kp_old_rating,
            weak_kp_tags: []
        }

        for(let i = 0; i < breakdown_log.length; i++){
            let log = breakdown_log[i]
            const plus = log.sn_state == 1 ? 1 : log.sn_state == 0 ? -1 : 0
            pre_test.kp_new_rating = pre_test.kp_new_rating + plus * log.kp_delta_rating,
            pre_test.weak_kp_tags = this.service.exerciseLog.addWeakTag(log.sn_state, pre_test.weak_kp_tags, log.kp_tag_name)
        }

        pre_test.kp_mastery = Math.round(100 * this.service.exerciseLog.getMastery(pre_test.kp_new_rating, pre_test.mean, pre_test.variance))
        return pre_test
    }

    async getGroupPath(path_id, group_id){
        const res_pathname = await this.app.mysql.get('path', { path_id: path_id });
        const res_group = await this.app.mysql.get('school_group', { stu_group_id: group_id });
        const res_path = await this.app.mysql.query(`
            select * from path_chapter c where c.path_id = ? 
            order by chapter_index asc;`,[path_id]);
        const res_stupath = await this.app.mysql.query(`
        select u.realname,s.*,c.path_chapter_name,n.node_name from student_path s 
        LEFT JOIN path_chapter c on s.path_id = c.path_id and 
        c.chapter_index = s.path_chapter_index
        LEFT JOIN chapter_node n on n.path_chapter_id = c.path_chapter_id and n.node_index = s.node_index 
        left join users u on s.student_id = u.userid where s.stu_group_id = ?
        and s.path_id = ? order by s.path_chapter_index asc;`,[group_id,path_id]);

        var stu_path_list = [];
        var stu_path_index = [];
        var list_index = 0;
        for(var i = 0; i < res_stupath.length; i++){
            var e = res_stupath[i];
            const index = stu_path_index[e.path_chapter_index];
            if(index >= 0){
                stu_path_list[index].stu_info.push({
                    student_id: e.student_id,
                    realname: e.realname,
                });
            }else{
                var stu_info = [];
                stu_info.push({
                    student_id: e.student_id,
                    realname: e.realname,
                });
                var group = {
                    chapter_index : e.path_chapter_index,
                    stu_info : stu_info,
                };
                stu_path_list[list_index] = group;
                stu_path_index[e.path_chapter_index] = list_index;
                list_index++;
            }
        }
        // for(var m= 0; m< res_path.length; m++){
        //     for(var n= 0; n< stu_path_list.length; n++){
        //         if(res_path[m].chapter_index == stu_path_list[n].chapter_index){
        //             res_path[m].push({
        //                 stu_num : stu_path_list[n].stu_info.length,
        //                 stu_info : stu_path_list[n].stu_info,
        //             });
        //         }
        //     }
        // }
        for(var n= 0; n< stu_path_list.length; n++){
            res_path[stu_path_list[n].chapter_index].chapter_stu = {
                stu_num : stu_path_list[n].stu_info.length,
                stu_info : stu_path_list[n].stu_info,
            };
        }

        var group_path = {
            path_name : res_pathname.path_name,
            group_name : res_group.group_name,
            path_info : res_path,
            stu_path : res_stupath,
        };

        return group_path;
    }

    //未考虑group_id重复参加情况
    async finishPreTest(student_id, test_id){
        const node_tasks = await this.app.mysql.query(`select nt.task_id from breakdown_log bl, 
            node_task nt inner join node_test ntt on ntt.test_id = ? and ntt.node_id = nt.node_id
            where bl.student_id = ? and bl.test_id = ? and bl.kp_tag_id = nt.kp_tag_id
            and bl.sn_state = 0 group by nt.task_id order by nt.task_index`, [test_id, student_id, test_id])
        
        for(let i = 0; i < node_tasks.length; i++){
            node_tasks[i].student_id = student_id
            node_tasks[i].visible = 1
        }
        if(node_tasks.length > 0){
            await this.app.mysql.insert('student_node_task', node_tasks);
        }

        if(node_tasks[0]){
            let node_test = await this.app.mysql.queryOne(`select tg.teacher_id
                from node_test nt inner join chapter_node cn on nt.node_id = cn.node_id and nt.test_id = ?
                inner join path_chapter pc on cn.path_chapter_id = pc.path_chapter_id
                inner join student_path sp on sp.student_id = ? and sp.path_id = pc.path_id
                inner join teacher_group tg on tg.stu_group_id = sp.stu_group_id and tg.role = 1`, [test_id, student_id])
            
            //解锁第一个任务
            return await this.service.task.addTaskLog({
                student_id: student_id,
                task_id: node_tasks[0].task_id,
                verify_user: node_test.teacher_id,
                start_time: new Date(),
            })
        }
        //解锁下一个测试
        let path_chapter = await this.getCurrentPathChapterByTest(student_id, test_id);
        let next_node = await this.findNextNode(student_id, path_chapter.path_id)
        await this.enableNodePreTest(student_id, path_chapter.path_id, next_node)
        return
    }
    
    async finishNodeTask(student_id, task_id, verify_user){
        const node_task = await this.app.mysql.queryOne(`select cn.node_index, cn.path_chapter_id, 
        nt.task_index, pc.chapter_index, nt.node_id, pc.path_id 
        from node_task nt inner join chapter_node cn on nt.node_id = cn.node_id and nt.task_id = ?
        , path_chapter pc where pc.path_chapter_id = cn.path_chapter_id`, [task_id])

        let next_task = await this.app.mysql.queryOne(`select cn.node_id, cn.node_index, nt.task_index, nt.task_id 
        from node_task nt inner join task t on nt.task_id = t.task_id 
        left join student_node_task snt on nt.task_id = snt.task_id and snt.student_id = ?
        , chapter_node cn left join student_node sn on cn.node_id = sn.node_id and sn.student_id = ?
        where nt.node_id = cn.node_id and cn.path_chapter_id = ? and sn.invisible is null and snt.visible = 1
        and ((nt.task_index > ? and cn.node_index = ?) or cn.node_index > ?)
        order by cn.node_index, nt.task_index LIMIT 1`,
        [student_id, student_id, node_task.path_chapter_id, node_task.task_index, node_task.node_index, node_task.node_index])
        
        if(next_task){
            if(next_task.node_id != node_task.node_id){
                //解锁同章节next node测评
                next_task.chapter_index = node_task
                await this.enableNodePreTest(student_id, node_task.path_id, next_task)
            }else {
                await this.service.task.addTaskLog({
                    student_id: student_id,
                    task_id: next_task.task_id,
                    verify_user: verify_user,
                    start_time: new Date(),
                })
            }
            return next_task
        }
        //next_chapter
        let next_node = await this.findNextNode(student_id, node_task.path_id)
        return await this.enableNodePreTest(student_id, node_task.path_id, next_node)
    }

    async getCurrentPathChapterByTest(student_id, test_id) {
        return await this.app.mysql.queryOne(`select path_chapter_id, path_id from path_chapter 
        where chapter_index = (select sp.path_chapter_index
        from node_test nt inner join chapter_node cn on nt.test_id = ? and cn.node_id = nt.node_id
        inner join path_chapter pc on pc.path_chapter_id = cn.path_chapter_id
        inner join student_path sp on pc.path_id = sp.path_id and student_id = ?)`, [test_id, student_id])
    }

    async initStudentPath(student_id, path_id, stu_group_id){
        // if(path_type){
        //     //预留订制化路径
        // }
        //同步路径
        await this.app.mysql.insert('student_path', {
            student_id: student_id,
            path_id: path_id,
            stu_group_id: stu_group_id,
            node_index: 0,
            path_chapter_index: 0,
            update_time: new Date()
        })
        let test_log = await this.app.mysql.queryOne(`select test_id 
        from node_test nt inner join chapter_node cn on nt.node_id = cn.node_id and cn.node_index = 0
        inner join path_chapter pc on cn.path_chapter_id = pc.path_chapter_id 
        where pc.chapter_index = 0 and pc.path_id = ?;`, [path_id])
        let teacher_test = await this.app.mysql.get('teacher_test',{ test_id : test_log.test_id });
        test_log.student_id = student_id;
        test_log.total_exercise = teacher_test.total_exercise;
        await this.app.mysql.insert('test_log', test_log);
    }

    async enableNodePreTest(student_id, path_id, node) {
        let test_log = await this.app.mysql.queryOne(`select test_id from node_test where node_id = ?`, [node.node_id])
        test_log.student_id = student_id
        await this.app.mysql.insert('test_log', test_log);
        await this.app.mysql.query(`update student_path set node_index = ?, path_chapter_index = ? where student_id = ? and path_id = ?`
        , [node.node_index, node.chapter_index, student_id, path_id])
    }

    async findNextNode(student_id, path_id) {
        let student_path = await this.app.mysql.queryOne(`select sp.path_chapter_index, sp.node_index
        from student_path sp where sp.student_id = ? and sp.path_id = ?`, [student_id, path_id])
        return await this.app.mysql.queryOne(`select cn.node_id, cn.node_index, pc.chapter_index 
        from chapter_node cn inner join path_chapter pc on cn.path_chapter_id = pc.path_chapter_id
        left join student_node sn on sn.student_id = ? and cn.node_id = sn.node_id
        where ((cn.node_index > ? and pc.chapter_index = ?) or pc.chapter_index > ?) and sn.invisible is null
        order by pc.chapter_index, cn.node_index limit 1`, 
        [student_id, student_path.node_index, student_path.path_chapter_index, student_path.path_chapter_index])
    }

    async updateStudentPathProgress(chapter_index, task_id){
        

        next_task.pre_node_id = nt.node_id
    }

    async getPathTable(teacher_id){
        return await this.app.mysql.query(`select sg.stu_group_id,sg.group_name,gp.bond_time,p.* 
        from teacher_group t INNER JOIN group_path gp on t.stu_group_id  = gp.stu_group_id
        INNER join school_group sg on sg.stu_group_id = t.stu_group_id
        INNER join path p on p.path_id = gp.path_id where t.teacher_id = ?;`, [teacher_id]);
    }
}

module.exports = PathService;