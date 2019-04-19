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

}

module.exports = CommentService;
 