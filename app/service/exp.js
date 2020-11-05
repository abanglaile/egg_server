const Service = require('egg').Service;
const uuid = require('uuid');

class ExpService extends Service {
    async getStuTotalExp(student_id){
        const stu_exp = await this.app.mysql.get('student_exp', {student_id: student_id})
        if(stu_exp){
            return stu_exp
        } else {
            return { student_id, exp: 0, level: 0 }
        }
    }

    async getStuWeekExp(student_id){
        
    }
    
    async addStuExp(student_id, exp){
        const stu_exp = await this.app.mysql.get('student_exp', {student_id: student_id})
        if(stu_exp){
            let new_exp = stu_exp.exp + exp
            await this.app.mysql.update('student_exp', {exp: new_exp}, {where: {student_id: student_id}})
        }else{
            await this.app.mysql.insert('student_exp', {student_id: student_id, exp: exp})
        }
    }

}

module.exports = ExpService;
 