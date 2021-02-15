const Service = require('egg').Service;
const uuid = require('uuid');

class LessonService extends Service {

    async getStudentPathChapter(student_id, , group_id, path_id){
        const path_chapter_list = await this.app.mysql.query(`select cn.path_chapter_name, sp.chapter_index, sp.node_index
            from student_path sp, chapter_node cn
            where sp.student_id = ? and sp.group_id = ? and sp.path_id = ? and sp.path_chapter_id = cn.path_chapter_id`,
            [student_id, group_id, path_id]);
        
        return path_chapter_list;
    }

    async getStudentChapterNode(student_id, group_id, path_chapter_id, group_id){
        const task_logs = await this.app.mysql.query(`select cn.node_name, cn.node_index, 
            nt.task_index, snt.visible, kt.kp_tag_name, sn.invisible,
            tl.total_ex, tl.wrong_ex, tl.correct_rate
            from node_task nt inner join kp_tag kt on nt.kp_tag_id = kt.kp_tag_id
            left join student_node_task snt on nt.student_id = snt.student_id and nt.task_id = snt.task_id
            left join task_log tl on nt.task_id = tl.task_id and tl.student_id = ?
            , chapter_node cn left join student_node sn on cn.node_id = sn.node_id and sn.student_id = ?
            where nt.node_id = cn.node_id and cn.path_chapter_id = ?
            order by cn.node_index, nt.task_index`,
             [student_id, student_id, path_chapter_id]);

        const test_logs = await this.app.mysql.query(`select nt.test_id, nt.test_desc, nt.test_index,
        cn.node_index, cn.node_name, tt.total_exercise, tl.correct_exercise 
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
                        test_logs[i].result = this.getPreTestResult(student_id, test_logs[i].test_id)
                    }
                    let node = {
                        node_id: test_logs[i].node_id,
                        node_name: test_logs[i].node_name,
                        pre_test: test_logs[i],
                        node_tasks: []
                    }
                    chapter_node_list.push(node)
                }
            }
        }

        let pre_node_id = "", index = 0
        //merge node_tasks into node_list
        for(let i = 0; i < task_logs.length; i++){
            let log = task_logs[i]
            if(!test_logs[i].invisble && log.visible){
                if(log.node_id != pre_node_id){
                    index++
                    pre_node_id = log.node_id
                }
                chapter_node_list[index].node_tasks.push({
                    task_desc: log.task_desc,
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
            kp_new_rating: log0.kp_old_rating
        }

        for(let i = 0; i < breakdown_log.length; i++){
            let log = breakdown_log[i]
            const plus = log.sn_state == 1 ? 1 : log.sn_state == 0 ? -1 : 0
            pre_test.kp_new_rating = log.kp_new_rating + plus * log.kp_delta_rating,
            pre_test.weak_kp_tags = this.service.exerciseLog.addWeakTag(log.sn_state, pre_test.weak_kp_tags, log.kp_tag_name)
        }

        pre_test.kp_mastery = Math.round(100 * this.service.exerciseLog.getMastery(pre_test.kp_new_rating, pre_test.mean, pre_test.variance))
        return pre_test
    }
}