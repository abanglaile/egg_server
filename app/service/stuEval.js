// const Service = require('egg').Service;
// const 

// class stuEvalService extends Service {
//     async getStuEvalBytest(student_id,test_id){
//         const student_name = this.app.mysql.query(`SELECT nikename FROM users where userid = ?;`,[student_id]);
//         const test_name = this.app.mysql.qyery(`SELECT test_name FROM teacher_test where test_id = ?;`,[test_id]);
//         const completion_per = this.app.mysql.query(`SELECT test_state FROM test_log where student_id = ? and test_id = ?;`,[student_id,test_id]);
//         const correct_rate = this.app.mysql.query(
//             `SELECT ROUND(d1.correct_exercise/d2.total_exercise*100) FROM 
//             (SELECT correct_exercise FROM test_log where student_id = ? and test_id = ?) d1,
//             (SELECT total_exercise FROM test_log where student_id = ? and test_id = ?) d2;`,
//             [student_id,test_id,student_id,test_id]);

//         const timeconsuming_second = this.app.mysql.query(
//             `SELECT TIMESTAMPDIFF(SECOND,
//                 (SELECT start_time FROM test_log where student_id = ? and test_id = ?),
//                 (SELECT end_time FROM test_log where student_id = ? and test_id = ?)
//             )`,
//             [student_id,test_id,student_id,test_id]);
        
//         return ({
//             student_name:student_name,
//             test_name:test_name,
//             completion_per,
//             correct_rate,
//             timeconsuming,
//         });
//     }
// }

// module.exports = stuEvalService
