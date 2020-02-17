const Service = require('egg').Service;

class GroupService extends Service {
    async getStudentGroup(student_id){
        return await this.app.mysql.query(`select s.course_label, g.stu_group_id, s.group_name, 
        (g.class_min - g.consume_class_min) as remain_class, (g.guide_min - g.consume_guide_min) as remain_guide  
        from group_student g inner join school_group s 
        on g.stu_group_id = s.stu_group_id and g.student_id = ?`, [student_id]);
    }

    async getClassGroup(teacher_id){

        // const group = await this.app.mysql.query(`select sg.* from teacher_group tg, school_group sg 
        //     where tg.teacher_id = ? and tg.stu_group_id = sg.stu_group_id`,[teacher_id]);
        // return group;
        const res = await this.app.mysql.query(`select t.stu_group_id, s.group_name, s.course_label from 
        teacher_group t,school_group s where t.teacher_id = ? and s.stu_group_id = t.stu_group_id;`, teacher_id);
        return res;
    }

    async getTeacherGroup(teacher_id){

        const results = await this.app.mysql.query(`select t.stu_group_id, s.group_name, 
        g.student_id,u.realname from teacher_group t, group_student g, school_group s,
        users u where t.teacher_id = ? and t.stu_group_id = g.stu_group_id and 
        u.userid = g.student_id and s.stu_group_id = g.stu_group_id;`, [teacher_id]);

        var student_data = [];
        var student_index = [];
        var list_index = 0;
        for(var i = 0; i < results.length; i++){
            var e = results[i];
            const index = student_index[e.stu_group_id];
            // console.log(i + " " + index);
            if(index >= 0){
                console.log('index:',index);
                student_data[index].children.push({
                    title: e.realname, 
                    value: e.student_id + '-' + e.stu_group_id,
                    key: e.student_id + '-' + e.stu_group_id,
                });
            }else{
                var children = [];
                children.push({
                    title: e.realname, 
                    value: e.student_id + '-' + e.stu_group_id,
                    key: e.student_id + '-' + e.stu_group_id,
                });
                var group = {
                    title: e.group_name, 
                    value: e.stu_group_id, 
                    key: e.stu_group_id, 
                    children: children,
                };
                student_data[list_index] = group;
                student_index[e.stu_group_id] = list_index;
                list_index++;
            }
        }
        return student_data;
    }   

    async getGroupData(stu_group_id){
        const res = await this.app.mysql.query(`select g.student_id, u.realname from group_student g,
        users u where u.userid = g.student_id and g.stu_group_id = ?;`, stu_group_id);
        return res;
    }

    async addNewGroup(teacher_id,group_name){
        //school_id 先写死
        const addres = await this.app.mysql.insert('school_group',{ school_id: 1, group_name:group_name});
        const addres2 = await this.app.mysql.insert('teacher_group',{ teacher_id: teacher_id, stu_group_id:addres.insertId});

        return addres.insertId;
    }

    async addNewSchoolGroup(new_group, groupTeacher){
        const addres = await this.app.mysql.insert('school_group',new_group);

        for(var i = 0;i < groupTeacher.length;i++){
            const res2 = await this.app.mysql.insert('teacher_group', { 
                teacher_id : groupTeacher[i],
                stu_group_id : addres.insertId,
            });
        }

        return addres.insertId;
    }

    async deleteOneGroup(stu_group_id){
        const del1 = await this.app.mysql.delete('school_group', {
            stu_group_id: stu_group_id,
        });
        const del2 = await this.app.mysql.delete('teacher_group', {
            stu_group_id: stu_group_id,
        });
        const del3 = await this.app.mysql.delete('group_student', {
            stu_group_id: stu_group_id,
        });
        return del3;
    }

    async deleteOneStudent(student_id){
        const del = await this.app.mysql.delete('group_student', {
            student_id: student_id,
        });
        return del;
    }

    async addOneStudent(body){
        const addres = await this.app.mysql.insert('group_student',{ 
            student_name: body.student_name,
            student_id:body.student_id,
            phone_num: body.phone_num,
            stu_group_id:body.stu_group_id,
        });
        return addres.insertId;
    }

    async getStuInfoById(student_id){
        const res = await this.app.mysql.query(`select u.realname,s.group_name from users u,
        school_group s,group_student g where g.stu_group_id=s.stu_group_id and u.userid = g.student_id and u.userid = ?;`, student_id);

        return res;
    } 
    
    async getSclGroup(school_id){
        const res = await this.app.mysql.query(`SELECT g.stu_group_id ,g.group_name FROM school_group g,
        school s where g.school_id = s.school_id and s.school_id = ?;`, school_id);

        var sclgroup = [];

        for(var i = 0; i < res.length; i++){
            sclgroup.push({
                label : res[i].group_name,
                value : res[i].stu_group_id,
            });
        }

        return sclgroup;
    }

    async isGroupIdIn (group_id){
        const res = await this.app.mysql.get('school_group',{ stu_group_id : group_id });
        return res;
    }

    async addStuGroupId(userid, group_id){
        var flag = 'failed';
        const res1 = await this.isGroupIdIn(group_id);
        if(res1){
            flag = 'sucess';
            const res2 = await this.app.mysql.query(`replace into group_student(stu_group_id,student_id) 
            values (?,?);`, [group_id,userid]);
        }
        
        return flag;
    }

    async getGroupTable(school_id){
        const results = await this.app.mysql.query(`select sg.*,cl.course_label_name,
                        tg.teacher_id, u.realname from school_group sg
                        left join teacher_group tg on sg.stu_group_id = tg.stu_group_id
                        left join users u on u.userid = tg.teacher_id
                        inner join course_label cl on cl.course_label= sg.course_label
                        where sg.school_id = ?;`, [school_id]);

        var group_list = [];
        var group_index = [];
        var list_index = 0;
        for(var i = 0; i < results.length; i++){
            var e = results[i];
            const index = group_index[e.stu_group_id];
            if(index >= 0){
                group_list[index].teacher_group.push({
                    teacher_id: e.teacher_id,
                    realname: e.realname,
                });
            }else{
                var teacher_group = [];
                teacher_group.push({
                    teacher_id: e.teacher_id,
                    realname: e.realname,
                });
                var group = {
                    group_id : e.stu_group_id,
                    group_name : e.group_name,
                    group_type : e.group_type,
                    course_label : e.course_label,
                    course_label_name : e.course_label_name,
                    teacher_group : teacher_group,
                };
                group_list[list_index] = group;
                group_index[e.stu_group_id] = list_index;
                list_index++;
            }
        }
        return group_list;
    }
    
    async updateGroupTeacher(selected_teacher, group_id){
        const res1 = await this.app.mysql.delete('teacher_group', {
            stu_group_id : group_id,
        });

        for(var i = 0;i < selected_teacher.length;i++){
            const res2 = await this.app.mysql.insert('teacher_group', { 
                teacher_id : selected_teacher[i],
                stu_group_id : group_id,
            });
        }

        // const res3 = await this.service.teacher.getSchoolTeacher(group_id);
        return res1;
    }

    async updateGroupHour(stu_group_id, student_id, num, label){
        let row = (label == 'guide')? {guide_min:num} : {class_min:num};
        
        const res = await this.app.mysql.update('group_student', row,{
            where:{
                stu_group_id : stu_group_id,
                student_id : student_id,
            }
        });

        return res;
    }

    async getContractTable(school_id){
        const results = await this.app.mysql.query(`select sg.*,gs.*,
            u.realname from school_group sg left join group_student gs
             on sg.stu_group_id = gs.stu_group_id inner join users u
             on gs.student_id = u.userid where sg.school_id = ?;`, [school_id]);
        
        return results;
    }

    async getClassHourTable(teacher_id){
        const results = await this.app.mysql.query(`select s.group_name,g.*,u.realname
            from teacher_group tg
            LEFT JOIN group_student g on g.stu_group_id = tg.stu_group_id
            LEFT JOIN users u on u.userid = g.student_id
            LEFT JOIN school_group s on s.stu_group_id = tg.stu_group_id
            where tg.teacher_id = ?;`, [teacher_id]);

        var remain_guide_min = 0;
        var remain_class_min = 0;
        for(var i = 0; i < results.length; i++){
            var e = results[i];
            if(e.guide_min >= e.consume_guide_min){
                remain_guide_min = e.guide_min - e.consume_guide_min;
            }else{
                remain_guide_min = -1;
            }
            results[i]['remain_guide_min'] = remain_guide_min;
            if(e.class_min >= e.consume_class_min){
                remain_class_min = e.class_min - e.consume_class_min;
            }else{
                remain_class_min = -1;
            }
            results[i]['remain_class_min'] = remain_class_min;
        }
        // console.log("results:",JSON.stringify(results));
        return results;
    }

    async getStudentList(teacher_id){
        const results = await this.app.mysql.query(`select g.student_id,u.realname,
        u.avatar,s.group_name,cl.course_label_name from teacher_group tg
        LEFT JOIN group_student g on g.stu_group_id = tg.stu_group_id
        LEFT JOIN users u on u.userid = g.student_id
        LEFT JOIN school_group s on s.stu_group_id = tg.stu_group_id
        INNER JOIN course_label cl on cl.course_label = s.course_label
        where tg.teacher_id = ?;`, [teacher_id]);

        var group_list = [];
        var group_index = [];
        var list_index = 0;
        for(var i = 0; i < results.length; i++){
            var e = results[i];
            const index = group_index[e.student_id];
            if(index >= 0){
                group_list[index].group_info.push({
                    course_label_name: e.course_label_name,
                    group_name: e.group_name,
                });
            }else{
                var group_info = [];
                group_info.push({
                    course_label_name: e.course_label_name,
                    group_name: e.group_name,
                });
                var group = {
                    student_id : e.student_id,
                    realname : e.realname,
                    avatar : e.avatar,
                    group_info : group_info,
                };
                group_list[list_index] = group;
                group_index[e.student_id] = list_index;
                list_index++;
            }
        }
        
        return group_list;
    }

    async getGroupStudent(student_id){
        return await this.app.mysql.query(`select (gs.guide_min - gs.consume_guide_min) as remain_guide_min 
            (gs.class_min - gs.consume_class_min) as remain_class_min, sg.group_name, sg.course_label 
            from group_student gs inner join school_group sg
            on sg.stu_group_id = gs.stu_group_id
            on gs.student_id = ?;`, [student_id]);
    }


}

module.exports = GroupService;
 