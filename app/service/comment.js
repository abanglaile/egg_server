const Service = require('egg').Service;
const uuid = require('uuid');

class CommentService extends Service {

    async addKpComment(select_student, kp_comment){
        kp_comment.comment_id = uuid.v1();
        await this.app.mysql.insert('kp_comment', kp_comment);
        for(let i = 0; i < select_student.length; i++){
            await this.app.mysql.insert('student_kp_comment', {comment_id: kp_comment.comment_id, student_id: select_student[i]});
        }
        return kp_comment;        
    }

    async addPfComment(select_student, pf_comment){
        pf_comment.comment_id = uuid.v1();
        await this.app.mysql.insert('pf_comment', pf_comment);
        for(let i = 0; i < select_student.length; i++){
            await this.app.mysql.insert('student_pf_comment', {comment_id: pf_comment.comment_id, student_id: select_student[i]});
        }
        return pf_comment;        
    }

    async updatePfComment(pf_comment, comment_id){
        return await this.app.mysql.update("pf_comment", pf_comment, {where: {comment_id: comment_id}});
    }

    async updateKpComment(kp_comment, comment_id){
        return await this.app.mysql.update("kp_comment", kp_comment, {where: {comment_id: comment_id}});
    }

    async searchPfLabel(input){
        return await this.app.mysql.query(`select p.pf_label_id, p.label_name 
            from pf_label p where p.label_name like ?`, '%'+input+'%');
    }

    async getStuPfCommentList(student_id){
        const results = await this.app.mysql.query(`select pc.*,u.realname,u.avatar,
            cl.course_label,cl.course_label_name from pf_comment pc
            inner join student_pf_comment sp on sp.comment_id = pc.comment_id
            left join users u on u.userid =  pc.teacher_id 
            left join lesson l on l.lesson_id = pc.comment_source
            left join school_group sg on sg.stu_group_id = l.stu_group_id
            left join course_label cl on cl.course_label = sg.course_label
            where sp.student_id = ? order by pc.comment_time desc;`, [student_id]);

        return results;
    }

    async getStuKpCommentList(student_id, filter_option){
        let { course_label, side } = filter_option;
        let query = `select kc.*,u.realname,u.avatar,cl.course_label,cl.course_label_name 
            from kp_comment kc inner join student_kp_comment sk on sk.comment_id = kc.comment_id
            left join users u on u.userid =  kc.teacher_id 
            left join lesson l on l.lesson_id = kc.comment_source
            left join school_group sg on sg.stu_group_id = l.stu_group_id
            left join course_label cl on cl.course_label = sg.course_label
            where sk.student_id = ?`;
            let params = [student_id];
        if(course_label){
            query += ' and sg.course_label = ?';
            params.push(course_label);
        }
        if(side){
            query += ' and kc.side = ?';
            params.push(side);
        }

        query += ' order by kc.comment_time desc;';
        console.log("query:",query);
        const results = await this.app.mysql.query(query, params);
        console.log("results:",JSON.stringify(results));
        console.log("params:",JSON.stringify(params));
        return results;

    }   

}

module.exports = CommentService;
 