const Service = require('egg').Service;
const uuid = require('uuid');

class wxMiniProgram extends Service {
    async getAllComment(avatarUrl) {
        // const comment_query = await this.app.mysql.query(
        //     `select com.pf_comment_content,com.label_name,com.comment_time,u1.nickname,u1.avatar from pf_comment com
        //     inner join student_pf_comment pf on pf.comment_id = com.comment_id 
        //     inner join users u on pf.student_id = u.userid and u.avatar = `+ avatarUrl + `
        //     inner join users u1 on com.teacher_id = u1.userid;`);
        const tmp1=""
        const tmp2="H9/2F4MG/f/trrOlbHSjxIfm67pBnkkBe7+0Tzr8QOw2aFzumU3IqfmkaK+pXct3mqvsGBniVEfmiDuA01vC5zNdIb/f/2k5upswg4vdB22pQlNRJImFMaJpi1gSRx16zOhcm7Opv9LoolCSXf33RLYnEFW2QCXbSkfVVHV8x4YQkq6cW1S202klgZjcQqDPws0dn4WjsRvVRJP4oHOVAFOeE7oalvWApMMkdeabc26ll45QecqZcovFZ7QxLi9Lnx7JV0HmBQ1q0kYcwfwqI7JX4WtSqOxMKSmuFVQRNlJfRYQcS+yZf/e6WZ/q4qZi6cZZOaoE19zJMKivgUU8lr9i7+GVo/u4DetQVdJrYcnFVZlvYd2+ZijUUjAFA30p9sr2cOAkSrARNyJzntcVf15QE5K9j7Q+B3VmHDC5JNSWYZ9M0QiKJYKnGAyDFdoRbr45fe5p7tNc5TVkjGl+Gqiw2YrKQhi5lEO4AwZgt0k"
        var sessionKey = new Buffer(this.sessionKey, 'base64')
        encryptedData = new Buffer(tmp2, 'base64')
        iv = new Buffer(iv, 'base64')

        try {
            // 解密
            var decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv)
            // 设置自动 padding 为 true，删除填充补位
            decipher.setAutoPadding(true)
            var decoded = decipher.update(encryptedData, 'binary', 'utf8')
            decoded += decipher.final('utf8')

            decoded = JSON.parse(decoded)

        } catch (err) {
            throw new Error('Illegal Buffer')
        }

        return comment_query
    }

    async postComment(e) {
        console.log(e);
        const pf_uuid = uuid.v1();
        const result = await this.app.mysql.insert('pf_comment', {
            comment_id: pf_uuid,
            pf_comment_content: e.textareaTxt,
            comment_source: '112233',
            label_name: e.tagValue,
            teacher_id: '223344'
        })
        // if (result.affectedRows) {
        const finnal = await this.app.mysql.insert('student_pf_comment', {
            comment_id: pf_uuid,
            student_id: '111111'
        })
        // }
        return result
    }
}
module.exports = wxMiniProgram;