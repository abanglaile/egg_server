const Service = require('egg').Service;
const Hashids = require('hashids/cjs');

let hashids = new Hashids('zhiqiu-egg-server')

class parentBondService extends Service {
    async getCodeByUserid(id) {
        // 根据学生id 生成邀请码
        const sn = hashids.encodeHex(id);
        return sn;
    }

    async getUserByCode(code) {
        // 根据邀请码获取学生信息
        const id = hashids.decodeHex(code);
        const user = await this.app.mysql.get('users', { userid: id });
        return user;
    }

    async parentBond(parent_id, student_id) {
        // 绑定家长和学生
        const check = await this.app.mysql.get('parent_student', {
            parent_id,
            student_id
        });
        if (check) {
            return '已绑定该学生';
        } else {
            const result = await this.app.mysql.insert('parent_student', {
                parent_id,
                student_id
            });
            return result.affectedRows === 1 ? '绑定成功' : '绑定失败';
        }
    }

    async parentUnBond(parent_id, student_id) {
        // 解绑家长和学生
        const result = await this.app.mysql.delete('parent_student', {
            parent_id,
            student_id
        });
        return result.affectedRows === 1 ? '解绑成功' : '解绑失败';
    }

    async getBondStudent(parent_id) {
        // 获取家长已绑定的学生列表
        const students = await this.app.mysql.select('parent_student', {
            where: {
                parent_id
            },
            columns: ['student_id']
        });
        const ids = students.map(node => node.student_id);
        const result = await this.app.mysql.select('users', {
            where: {
                userid: ids
            }
        });
        return result;
    }
}

module.exports = parentBondService;