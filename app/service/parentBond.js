const Service = require('egg').Service;
const uuid = require('uuid');
const Hashids = require('hashids/cjs');

let hashids = new Hashids('zhiqiu-egg-server')

class parentBondService extends Service {
    // async setUserInfo(wx_info, stu, groupValue) {
    //     var userid = uuid.v1().replace(/-/g, '');
    //     console.log("userid: ", userid);
    //     const res1 = await this.app.mysql.insert('user_auths', {
    //         userid: userid,
    //         identity_type: 'weixin',
    //         identifier: wx_info.openid,
    //         credential: wx_info.access_token,
    //     });

    //     const res2 = await this.app.mysql.insert('users', {
    //         userid: userid,
    //         nickname: wx_info.nickname,
    //         avatar: wx_info.imgurl,
    //         role: stu ? 2 : 1,
    //         // realname: realname,
    //     });

    //     if (stu && groupValue) {
    //         const res3 = await this.app.mysql.insert('group_student', {
    //             stu_group_id: groupValue,
    //             student_id: userid,
    //         });
    //     }

    //     return ({
    //         userid: userid,
    //         nickname: wx_info.nickname,
    //         imgurl: wx_info.imgurl,
    //         // realname: realname,
    //     });
    // }

    async getCodeByUserid(id) {
        // 根据学生id 生成邀请码
        let sn = Buffer.from(id, 'utf-8').toString('hex');
        sn = hashids.encodeHex(sn);
        return sn;
    }

    async getUserByCode(code) {
        // 根据邀请码获取学生信息
        let id = hashids.decodeHex(code);
        id = Buffer.from(id, 'hex').toString('utf-8');
        const user = await this.app.mysql.get('users', { userid: id });
        return user;
    }

    async parentBond(parent_id, student_id, wx_info) {
        let userid = parent_id;
        // 检查是否为新用户
        if (parent_id === null) {
            // 新用户
            userid = uuid.v1().replace(/-/g, '');
            const res1 = await this.app.mysql.insert('user_auths', {
                userid: userid,
                unionid: wx_info.unionid,
                identity_type: 'weixin_xcx',
                identifier: wx_info.openid,
            });

            const res2 = await this.app.mysql.insert('users', {
                userid: userid,
                nickname: wx_info.nickname,
                avatar: wx_info.imgurl,
                role: 4,//4、家长，3、管理员
                // realname: realname,
            });
        }
        
        // 绑定家长和学生
        const check = await this.app.mysql.get('parent_student', {
            parent_id: userid,
            student_id
        });
        let output = {
            userid,
            msg: ''
        };
        if (check) {
            output.msg = '已绑定该学生';
        } else {
            const result = await this.app.mysql.insert('parent_student', {
                parent_id: userid,
                student_id
            });
            output.msg = result.affectedRows === 1 ? '绑定成功' : '绑定失败';
        }
        return output;
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
        // 首次访问
        if (parent_id === 'null') {
            return []
        }
        // 获取家长已绑定的学生列表
        const students = await this.app.mysql.select('parent_student', {
            where: {
                parent_id
            },
            columns: ['student_id']
        });
        const ids = students.map(node => node.student_id);
        let result = [];
        if (ids.length > 0) {
            result = await this.app.mysql.select('users', {
                where: {
                    userid: ids
                }
            });
        }
        return result;
    }
}

module.exports = parentBondService;