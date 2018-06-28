const Service = require('egg').Service;

class userService extends Service {

  async getStudentInfo(student_id){
    const res = await this.app.mysql.query(`select t.group_name,u.nickname,`
    +`u.avatar from group_student g,teacher_group t,users u where `
    +`t.stu_group_id = g.stu_group_id and u.userid =g.student_id and g.student_id = ?;`
    , student_id);

    return res;
  }

  async getUser(username,password){
    const res = await this.app.mysql.select('user', {
        where : { username : username , password : password},
        columns : ['username','password','user_id'],
    });
    return res;
  }

  async identityUser(username,password){
    const results = await this.getUser(username,password);

    var str = JSON.stringify(results); 
    var result_json = JSON.parse(str);

    if(results.length){
        return ({
            id_token: createIdToken(results[0]),
            token: createAccessToken(username,results[0].user_id)
        });
    }
    else{
        return ("The username or password don't match");
    }


  }



}

module.exports = userService;
 