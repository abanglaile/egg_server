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

    async getPfLabelOptions() {
        const label_list = await this.app.mysql.query(`select p.pf_label_id, p.group_id, p.label_name, eg.group_name, eg.eff_type
            from pf_label p inner join efficiency_group eg on p.group_id = eg.group_id
            order by eg.eff_type, eg.group_id`, [])
        const options = [
            {
                label: '学习习惯',
                value: 1,
                children: [],
            },
            {
                label: '学习动机',
                value: 2,
                children: [],   
            },
            {
                label: '学习适应性',
                value: 3,
                children: [],   
            },
        ];
        let now_group_id = 0
        for(let i = 0; i < label_list.length; i++){
            const l = label_list[i]
            if(l.group_id != now_group_id){
                let child = {
                    label: l.group_name,
                    value: l.group_id,
                    children: [{
                        label: l.label_name,
                        value: l.pf_label_id,
                    }]
                }
                options[l.eff_type - 1].children.push(child);
                now_group_id = l.group_id;
            }else{
                let index = options[l.eff_type - 1].children.length - 1
                options[l.eff_type - 1].children[index].children.push({
                    label: l.label_name,
                    value: l.pf_label_id,
                })
            }
        }
        console.log(options)
        return options
    }

    async getStuPfCommentList(student_id, filter_option){
        let { pf_label, side } = filter_option;
        let query = `select pc.*,u.realname,u.avatar,
            cl.course_label,cl.course_label_name from pf_comment pc
            inner join student_pf_comment sp on sp.comment_id = pc.comment_id
            left join users u on u.userid =  pc.teacher_id 
            left join lesson l on l.lesson_id = pc.comment_source
            left join school_group sg on sg.stu_group_id = l.stu_group_id
            left join course_label cl on cl.course_label = sg.course_label
            where sp.student_id = ?`;
        let params = [student_id];
        if(pf_label){
            query += ` and pc.label_id in (select pl.pf_label_id from efficiency_group eg 
                INNER JOIN pf_label pl on eg.group_id=pl.group_id where eg.eff_type = ?)`;
            params.push(pf_label);
        }
        if(side != null){
            query += ' and pc.side = ?';
            params.push(side);
        }

        query += ' order by pc.comment_time desc limit 200;';
        return await this.app.mysql.query(query, params);
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
        if(side != null){
            query += ' and kc.side = ?';
            params.push(side);
        }
        query += ' order by kc.comment_time desc limit 300;';
        return await this.app.mysql.query(query, params);
    }   

}

module.exports = CommentService;
 