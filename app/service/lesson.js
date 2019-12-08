const Service = require('egg').Service;
const uuid = require('uuid');

class LessonService extends Service {

    async getTeacherLesson(teacher_id, filter_option){
        console.log("filter_option:",JSON.stringify(filter_option));
        let {select_teacher, start_time, end_time, group_id, course_label, label_id} = filter_option;
        let query = `select l.*, u.realname as teacher_name, ass.realname as assistant_name, 
            r.room_name, g.group_name, g.course_label,
            ll.label_name, lc.course_label_name from lesson l LEFT JOIN users ass on l.assistant_id = ass.userid,
            users u, course_label lc,school_room r, school_group g, 
            lesson_label ll where l.teacher_id = u.userid and 
            lc.course_label = g.course_label and r.room_id = l.room_id and 
            l.stu_group_id in (select stu_group_id from teacher_group where teacher_id = ?) and 
            l.stu_group_id = g.stu_group_id and l.label_id = ll.label_id`;
        let params = [teacher_id];

        if(select_teacher){
            query += ' and l.teacher_id = ?';
            params.push(select_teacher);
        }
        if(start_time){
            query += ' and l.start_time >= ?';
            params.push(start_time);
        }
        if(end_time){
            query += ' and l.end_time <= ?';
            params.push(end_time);
        }
        if(group_id){
            query += ' and l.stu_group_id = ?';
            params.push(group_id);
        }
        if(course_label){
            query += ' and l.course_label = ?';
            params.push(course_label);
        }
        if(label_id){
            query += ' and l.label_id = ?';
            params.push(label_id);
        }

        query += ' order by l.start_time desc;';
        console.log("query:",query);
        const lesson_list = await this.app.mysql.query(query, params);
        console.log("lesson_list:",JSON.stringify(lesson_list));
        console.log("params:",JSON.stringify(params));
        return lesson_list;
    }

    async signLesson(lesson_id){
        const lesson = await this.app.mysql.queryOne(`select l.stu_group_id,l.label_id, l.is_sign,
            timestampdiff(minute, l.start_time ,l.end_time) as minu from lesson l 
            where l.lesson_id = ?;`, [lesson_id]);
        // let consume_hour = (lesson.minu/60).toFixed(1);
        if(!lesson.is_sign){
            var consume_min = parseInt(lesson.minu);
            var sql = '';
            let params = [consume_min, lesson.stu_group_id];
            var old_consume_time = 0;
            if(lesson.label_id == 'guide'){
                // sql += 'update group_student set consume_guide_min = ? where stu_group_id = ?;';
                sql += 'update group_student set consume_guide_min = consume_guide_min + ? where stu_group_id = ?;';
                const guide_res =  await this.app.mysql.query(`select * from group_student where stu_group_id = ?;`,[lesson.stu_group_id]);
                old_consume_time = guide_res[0].consume_guide_min;
            }
            if(lesson.label_id == 'class'){
                // sql += 'update group_student set consume_class_min = ? where stu_group_id = ?;';
                sql += 'update group_student set consume_class_min = consume_class_min + ? where stu_group_id = ?;';
                const class_res =  await this.app.mysql.query(`select * from group_student where stu_group_id = ?;`,[lesson.stu_group_id]);
                old_consume_time = class_res[0].consume_class_min;
            }
            // let  params = [consume_min + old_consume_time, lesson.stu_group_id];
            if(sql != ''){
                const res2 = await this.app.mysql.query(sql, params);
                const res1 = await this.app.mysql.update('lesson', {is_sign: true}, {where: {lesson_id: lesson_id}});
                const res3 = await this.app.mysql.insert('sign_lesson',{
                    lesson_id : lesson_id,
                    consume_min : consume_min,
                    label_id :  lesson.label_id,
                    old_consume_min : old_consume_time,

                });
                return res1;
            }
            
        }
       
    }

    async getLessonBasic(lesson_id){
        let lesson = await this.app.mysql.query(`select l.*, cl.course_label, 
            cl.course_label_name, r.room_name, g.group_name, u1.realname as teacher_name, 
            u2.realname as assistant_name, ll.label_name
            from lesson l left join users u1 on l.teacher_id = u1.userid 
            left join users u2 on l.assistant_id = u2.userid
            inner join school_room r on l.room_id = r.room_id, 
            school_group g, lesson_label ll, course_label cl  
            where l.lesson_id = ? and cl.course_label = g.course_label and 
            l.stu_group_id = g.stu_group_id and l.label_id = ll.label_id`, 
            [lesson_id]);
        return await lesson[0];
    }

    async getOneLesson(lesson_id){
        let lesson = await this.getLessonBasic(lesson_id);
        let stu_group_id = await lesson.stu_group_id;
        let lesson_student = await this.service.group.getGroupData(stu_group_id);
        let lesson_content = this.getLessonContent(lesson_id);
        let homework = this.getHomework(lesson_id);
        let kp_comment = this.getLessonKpComment(lesson_id);
        let pf_comment = this.getLessonPfComment(lesson_id);
        let lesson_award = this.getLessonAward(lesson_id);
        lesson.lesson_award = await lesson_award;
        lesson.homework = await homework;
        lesson.lesson_content = await lesson_content;
        lesson.lesson_student = lesson_student;
        lesson.kp_comment = await kp_comment;
        lesson.pf_comment = await pf_comment;
        return lesson;
    }

    async getLessonAward(lesson_id){
        return await this.app.mysql.query(`select a.*, u.realname from lesson_award a 
            inner join users u on a.lesson_id = ? and a.student_id = u.userid`, [lesson_id]);
    }

    async accLessonAward(lesson_id){
        let kp_award = await this.app.mysql.query(`select skc.student_id, u.realname, count(skc.comment_id) as award_count 
        from kp_comment kc inner join student_kp_comment skc
        on kc.side = 1 and kc.comment_id = skc.comment_id and kc.comment_source = ?
        INNER JOIN users u on skc.student_id = u.userid group by student_id`, [lesson_id]);
        return kp_award;
    }

    async getLessonStudent(lesson_id){
        return await this.app.mysql.query(`select g.student_id, u.realname from lesson l, group_student g,
        users u where l.lesson_id = ? and l.stu_group_id = g.stu_group_id and u.userid = g.student_id`, [lesson_id]);
    }

    async getStudentOneLesson(lesson_id, student_id){
        let lesson = await this.getLessonBasic(lesson_id);
        let lesson_content = this.getLessonContent(lesson_id);
        let homework = this.getHomework(lesson_id);
        let kp_comment = this.getLessonStudentKpComment(lesson_id, student_id);
        let pf_comment = this.getLessonStudentPfComment(lesson_id, student_id);
        lesson.award_count = await this.app.mysql.get("lesson_award", {lesson_id, student_id});
        lesson.homework = await homework;
        lesson.lesson_content = await lesson_content;
        lesson.kp_comment = await kp_comment;
        lesson.pf_comment = await pf_comment;
        return lesson;
    }

    async deleteOneLesson(lesson_id){
        await this.app.mysql.delete('lesson', {lesson_id: lesson_id});
        return await this.app.mysql.delete('lesson_content', {lesson_id: lesson_id});
    }

    async getHomework(lesson_id){
        return await this.app.mysql.query(`select t.*, ts.source_name from homework h, task t, task_source ts
            where h.lesson_id = ? and h.task_id = t.task_id and t.source_id = ts.source_id`, [lesson_id]);
    }

    async relateHomework(lesson_id, task_id, users){
       await this.app.mysql.insert('homework', {lesson_id: lesson_id, task_id});
       for(let i = 0; i < users.length; i++){
           await this.service.task.addTaskLog({task_id: task_id, student_id: users[i].student_id, start_time: new Date()});
       }
       return await this.getHomework(lesson_id);
    }

    async addHomework(lesson_id, task, users){
        const new_task = await this.service.task.assignTask(task, users);
        await this.app.mysql.insert('homework', {lesson_id: lesson_id, task_id: new_task.task_id});
        return await this.getHomework(lesson_id);
    }

    async deleteHomework(lesson_id, task_id, users){
        await this.app.mysql.delete('homework', {lesson_id: lesson_id, task_id: task_id});
        await this.service.task.deleteTaskLog(task_id, users);
        return await this.getHomework(lesson_id);
    }

    async getLessonKpComment(lesson_id){
        // return await this.app.mysql.query(`select kc.*, lkc.student_list from lesson_kp_comment lkc, kp_comment kc 
        // where lkc.lesson_id = ? and lkc.comment_id = kc.comment_id`, [lesson_id]);
        return await this.app.mysql.query(`select kc.*, group_concat(u.realname) as student_list
        from kp_comment kc inner join student_kp_comment skc
        on kc.comment_id = skc.comment_id and kc.comment_source = ?
        INNER JOIN users u on skc.student_id = u.userid group by comment_id`, [lesson_id]);
    }

    async addLessonAward(lesson_id){
        let lesson_award = this.accLessonAward(lesson_id);
        let lesson_student = this.getLessonStudent(lesson_id);
        // let base_award = 5;
        // let award = lesson_student.map(item => {
        //     let student_award = lesson_award.find(t => (t.student_id == item.student_id));
        //     return {
        //         award_count: student_award ? (base_award + student_award.award_count) : base_award,
        //         student_id: item.student_id,
        //         lesson_id: lesson_id,
        //     }
        // })
        const ret = await this.app.mysql.insert("lesson_award", lesson_award);
        return ret;
    }

    async getLessonStudentKpComment(lesson_id, student_id){
        // return await this.app.mysql.query(`select kc.*, lkc.student_list from lesson_kp_comment lkc, kp_comment kc 
        // where lkc.lesson_id = ? and lkc.comment_id = kc.comment_id`, [lesson_id]);
        return await this.app.mysql.query(`select kc.*
        from kp_comment kc inner join student_kp_comment skc
        on kc.comment_id = skc.comment_id and kc.comment_source = ? and skc.student_id = ?`,
         [lesson_id, student_id]);
    }

    async getLessonStudentPfComment(lesson_id, student_id){
        // return await this.app.mysql.query(`select kc.*, lkc.student_list from lesson_kp_comment lkc, kp_comment kc 
        // where lkc.lesson_id = ? and lkc.comment_id = kc.comment_id`, [lesson_id]);
        return await this.app.mysql.query(`select pc.*
        from pf_comment pc inner join student_pf_comment spc
        on pc.comment_id = spc.comment_id and pc.comment_source = ? and spc.student_id = ?`, 
        [lesson_id, student_id]);
    }

    async getLessonPfComment(lesson_id){
        // return await this.app.mysql.query(`select pc.*, lpc.student_list from lesson_pf_comment lpc, pf_comment pc 
        // where lpc.lesson_id = ? and lpc.comment_id = pc.comment_id`, [lesson_id]);
        return await this.app.mysql.query(`select pc.*, group_concat(u.realname) as student_list
        from pf_comment pc inner join student_pf_comment spc
        on pc.comment_id = spc.comment_id and pc.comment_source = ?
        INNER JOIN users u on spc.student_id = u.userid group by comment_id`, [lesson_id]);
    }

    async addLessonKpComment(lesson_id, select_student, kp_comment){
        kp_comment.comment_source = lesson_id;
        let {select_id, select_name} = select_student;
        kp_comment = await this.service.comment.addKpComment(select_id, kp_comment);
        // await this.app.mysql.insert('lesson_kp_comment', {
        //     lesson_id: lesson_id, 
        //     comment_id: kp_comment.comment_id,
        //     student_list: select_name.join(",")
        // });
        return await this.getLessonKpComment(lesson_id);   
    }

    async addLessonPfComment(lesson_id, select_student, pf_comment){
        pf_comment.comment_source = lesson_id;
        let {select_id, select_name} = select_student;
        pf_comment = await this.service.comment.addPfComment(select_id, pf_comment);
        // await this.app.mysql.insert('lesson_pf_comment', {
        //     lesson_id: lesson_id, 
        //     comment_id: pf_comment.comment_id,
        //     student_list: select_name.join(",")
        // });
        return await this.getLessonPfComment(lesson_id);   
    }

    async deleteLessonKpComment(lesson_id, comment_id){
        // await this.app.mysql.delete('lesson_kp_comment', {comment_id: comment_id});
        await this.app.mysql.delete('kp_comment', {comment_id: comment_id});
        return await this.app.mysql.delete('student_kp_comment', {comment_id: comment_id});
        //return await this.getLessonKpComment(lesson_id);
    }

    async deleteLessonPfComment(lesson_id, comment_id){
        // await this.app.mysql.delete('lesson_pf_comment', {comment_id: comment_id});
        await this.app.mysql.delete('pf_comment', {comment_id: comment_id});
        return await this.app.mysql.delete('student_pf_comment', {comment_id: comment_id});
        // return await this.getLessonPfComment(lesson_id);
    }    

    async getLessonContent(lesson_id){
        const lesson_content = await this.app.mysql.select('lesson_content',
            {where: {lesson_id: lesson_id}});
        return lesson_content;
    }

    async addNewLesson(lesson){
        let lesson_id = uuid.v1();
        lesson.lesson_id = lesson_id;
        console.log("lesson", JSON.stringify(lesson));
        // const lesson_teacher = lesson;
        // delete lesson.lesson_teacher;
        const ret = await this.app.mysql.insert('lesson', lesson);
        // const iret = await this.app.mysql.insert('lesson_teacher', lesson_teacher);
        return lesson_id;
    }

    async addLessonContent(lesson_content){
        lesson_content.lesson_content_id = uuid.v1();
        const iret = await this.app.mysql.insert('lesson_content', lesson_content);
        return await this.getLessonContent(lesson_content.lesson_id);
    }

    async deleteLessonContent(lesson_content){
        const iret = await this.app.mysql.delete('lesson_content', {lesson_content_id: lesson_content.lesson_content_id});
        return await this.getLessonContent(lesson_content.lesson_id);
    }

    async updateLessonTeacher(lesson_id, teacher_id){
        const ret = await this.app.mysql.update('lesson', {teacher_id: teacher_id}, {where: {lesson_id: lesson_id}});
        return await this.getLessonBasic(lesson_id);
    }

    async updateLessonAssistant(lesson_id, assistant_id){
        const ret = await this.app.mysql.update('lesson', {assistant_id: assistant_id}, {where: {lesson_id: lesson_id}});
        return await this.getLessonBasic(lesson_id);
    }

    // async updateLessonGroup(lesson_id, stu_group_id){
    //     const group = await this.app.mysql.get('school_group', {stu_group_id: stu_group_id});
    //     const uret = await this.app.mysql.update('lesson', {stu_group_id: stu_group_id, course_id: group.course_id}, {
    //             where: {lesson_id: lesson_id}
    //         });
    //     return await this.getLessonBasic(lesson_id);
    // }

    async updateLessonRange(lesson_id, start_time, end_time){
        const uret = await this.app.mysql.update('lesson', {
            start_time: start_time,
            end_time: end_time,
        },{where: {lesson_id: lesson_id}})
        return await this.getLessonBasic(lesson_id);
    }

    async getConsumeLesson(stu_group_id, label, filter_option){
        console.log("filter_option:",JSON.stringify(filter_option));
        let {start_time, end_time} = filter_option;
        console.log("start_time:",start_time);
        let query = `select l.*,TIMESTAMPDIFF(minute,l.start_time,l.end_time) as minu,
        u.realname as teacher_name, ass.realname as assistant_name,
        ll.label_name,sg.group_name,r.room_name from lesson l LEFT JOIN users ass on 
        l.assistant_id = ass.userid,users u,lesson_label ll,school_group sg, school_room r 
        where l.stu_group_id = ? and l.teacher_id = u.userid and l.stu_group_id = sg.stu_group_id 
        and r.room_id = l.room_id and l.label_id = ll.label_id and l.is_sign = 1`;
        let params = [stu_group_id];

        if(start_time){
            query += ' and l.start_time >=?';
            params.push(start_time);
        }
        if(end_time){
            query += ' and l.end_time <= ?';
            params.push(end_time);
        }
        if(label){
            query += ' and l.label_id = ?';
            params.push(label);
        }

        query += ' order by l.start_time desc;';
        console.log("query:",query);
        const res = await this.app.mysql.query(query, params);
        var total_time = 0;
        for(var i=0;i<res.length;i++){
            total_time += res[i].minu;
        }
        // total_time = (total_time/60).toFixed(1);
        console.log("res:",JSON.stringify(res));
        var lesson_list = {
            lessonList : res,
            total_time : total_time,
        };
        return lesson_list;
    }


    // async updateLessonCourse(lesson_id, course_label){
    //     const uret = await this.app.mysql.update('lesson', {course_label: course_label},
    //         {where: {lesson_id: lesson_id}})
    //     return await this.getLessonBasic(lesson_id);;
    // }

    // async updateLessonLabel(lesson_id, label_id){
    //     const uret = await this.app.mysql.update('lesson', {label_id: label_id},
    //         {where: {lesson_id: lesson_id}});
    //     return await this.getLessonBasic(lesson_id);; 
    // }
    
}

module.exports = LessonService;
 