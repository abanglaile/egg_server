const Service = require('egg').Service;

class PathService extends Service {

    async getStudentPathChapter(student_id, group_id, path_id){
        const path_chapter_list = await this.app.mysql.query(`select cn.path_chapter_name, sp.chapter_index, sp.node_index
            from student_path sp inner join , chapter_node cn
            where sp.student_id = ? and sp.group_id = ? and sp.path_id = ? and sp.path_chapter_id = cn.path_chapter_id`,
            [student_id, group_id, path_id]);
        
        return path_chapter_list;
    }

    async getStudentChapterNode(student_id, group_id, path_chapter_id){
        const task_logs = await this.app.mysql.query(`select cn.node_id, cn.node_name, cn.node_index, 
            nt.task_index, nt.task_desc, t.task_count, snt.visible, kt.kp_tag_name, sn.invisible,
            tl.total_ex, tl.wrong_ex, tl.correct_rate, tl.verify_state
            from node_task nt inner join kp_tag kt on nt.kp_tag_id = kt.kp_tag_id
            inner join task t on nt.task_id = t.task_id
            left join student_node_task snt on nt.task_id = snt.task_id and snt.student_id = ?
            left join task_log tl on nt.task_id = tl.task_id and tl.student_id = ?
            , chapter_node cn left join student_node sn on cn.node_id = sn.node_id and sn.student_id = ?
            where nt.node_id = cn.node_id and cn.path_chapter_id = ?
            order by cn.node_index, nt.task_index`,
             [student_id, student_id, student_id, path_chapter_id]);

        const test_logs = await this.app.mysql.query(`select nt.test_id, nt.test_desc, nt.test_index,
        cn.node_index, cn.node_name, cn.node_id, tt.total_exercise, tl.correct_exercise 
        from node_test nt inner join teacher_test tt on nt.test_id = tt.test_id
        left join test_log tl on nt.test_id = tl.test_id and tl.student_id = ?,
        chapter_node cn left join student_node sn on cn.node_id = sn.node_id and sn.student_id = ?
        where nt.node_id = cn.node_id and cn.path_chapter_id = ?
        order by cn.node_index`,
         [student_id, student_id, path_chapter_id]);
        
        let chapter_node_list = []
        for(let i = 0; i < test_logs.length; i++){
            if(!test_logs[i].invisble){
                if(test_logs[i].test_index == 0){
                    //pre_test
                    if(test_logs[i].correct_exercise){
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

        let pre_node_id = "", index = -1
        //merge node_tasks into node_list
        for(let i = 0; i < task_logs.length; i++){
            let log = task_logs[i]
            //debug
            log.visible = 1;
            
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
                            node_tasks: []
                        }
                    }
                }
                chapter_node_list[index].node_tasks.push({
                    task_desc: log.task_desc,
                    task_count: log.task_count,
                    total_ex: log.total_ex,
                    wrong_ex: log.total_ex,
                    correct_rate: log.correct_rate
                })
            }
        }
        return chapter_node_list
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
            and bl.sn_state = 0 group by nt.task_id`, [test_id, student_id, test_id])
        
        for(let i = 0; i < node_tasks.length; i++){
            node_tasks[i].student_id = student_id
            node_tasks[i].visible = 1
        }
        return await this.app.mysql.insert('student_node_task', node_tasks);
    }
    
    async finishNodeTask(student_id, task_id){
        const node_tasks = await this.app.mysql.query(`select cn.node_id, cn.node_name, cn.node_index, 
        nt.task_index, nt.task_desc, t.task_count, snt.visible, sn.invisible,
        from node_task nt inner join task t on nt.task_id = t.task_id
        left join student_node_task snt on nt.task_id = snt.task_id and snt.student_id = ?
        , chapter_node cn left join student_node sn on cn.node_id = sn.node_id and sn.student_id = ?
        where nt.node_id = cn.node_id and cn.path_chapter_id = ?
        order by cn.node_index, nt.task_index`, [test_id, student_id, test_id])
    }

    async getPathTable(teacher_id){
        return await this.app.mysql.query(`select sg.stu_group_id,sg.group_name,gp.bond_time,p.* 
        from teacher_group t INNER JOIN group_path gp on t.stu_group_id  = gp.stu_group_id
        INNER join school_group sg on sg.stu_group_id = t.stu_group_id
        INNER join path p on p.path_id = gp.path_id where t.teacher_id = ?;`, [teacher_id]);
    }
}

module.exports = PathService;