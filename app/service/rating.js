const Service = require('egg').Service;

class RatingService extends Service {

    async getMyBookChapter(student_id, course_id){
        const results = await this.app.mysql.query(`select b.bookid, b.bookname, c.chapterid, c.chaptername, sc.chapter_rating, cs.chapter_standard 
            from book b, 
            chapter c left join student_chapter sc on sc.chapterid = c.chapterid and sc.student_id = ? 
                    left join chapter_standard cs on c.chapterid = cs.chapterid
            where b.course_id = ? and c.bookid = b.bookid ORDER BY chindex`, [student_id, course_id]);
        const books = [];
        let m = {};
        for(var i = 0; i < results.length; i++){
            var chapter = results[i];
            if(m[chapter.bookid] >= 0){
                let index = m[chapter.bookid];
                //bookid exists
                books[index].chapters.push(chapter);
            }else{
                let index = books.length;
                m[chapter.bookid] = index;
    
                books[index] = {
                    bookid: chapter.bookid,
                    bookname: chapter.bookname,
                    chapters: [chapter],
                }
            }
        } 
        console.log(books.length);   
        return books;
    }

    async getStudentRating(student_id, course_id){
        const res = await this.app.mysql.get('student_rating', {student_id: student_id, course_id: course_id});
        return (res ? res.student_rating : null);     
    }

    //根据student_id, course_id获取所有时间节点天梯分变化情况
    async getStuRatingHistory(student_id, course_id){
        const res = await this.app.mysql.query(`SELECT a.update_time ,a.student_rating from
        (SELECT s.* from student_rating_history s where s.student_id = ? and s.course_id = ?) a 
        where not EXISTS (select 1 from (SELECT s.* from student_rating_history s where s.student_id = ? and s.course_id = ?) b 
        where datediff(a.update_time, b.update_time)=0 and b.id > a.id)`
        , [student_id, course_id, student_id, course_id]);

        return res;
    }

    async getChapterKpStatus(student_id, chapter_id) {
        let chapter_status = this.app.mysql.query(`select sc.chapter_rating, cs.chapter_standard, c.chaptername from chapter c
        left join student_chapter sc on sc.student_id = ? and sc.chapterid = c.chapterid 
        LEFT JOIN chapter_standard cs on c.chapterid = cs.chapterid where c.chapterid = ?`
        , [student_id, chapter_id]);

        let chapter_pratice = this.app.mysql.query(`select sum(sk.practice) as practice, 
        sum(sk.correct) as correct from chapter c, kptable kt 
        left join student_kp sk on sk.student_id = ? and kt.kpid = sk.kpid
        where c.chapterid = kt.chapterid and c.chapterid = ?`, [student_id, chapter_id]);

        let kp_status = this.app.mysql.query('select k.kpid, k.kpname, ks.kp_standard ,sk.kp_rating, '
        +'sk.practice, sk.correct from chapter c, '
        +'kptable k LEFT JOIN kp_standard ks on ks.kpid = k.kpid LEFT JOIN student_kp sk on k.kpid = sk.kpid and sk.student_id = ? '
        +'where c.chapterid = ? and k.chapterid = c.chapterid;'
        , [student_id,chapter_id]);

        chapter_status = await chapter_status;
        chapter_pratice = await chapter_pratice;

        return {
            chapterid: chapter_id,
            chaptername: chapter_status[0].chaptername,
            chapter_rating: chapter_status[0].chapter_rating,
            chapter_standard: chapter_status[0].chapter_standard,
            practice: chapter_pratice[0].practice,
            correct: chapter_pratice[0].correct,
            kp_status: await kp_status,
        }
        //return res;
    }

    async getKpRatingHistory(student_id, kpid){
        const res = await this.app.mysql.query(`select a.update_time ,a.kp_rating from 
        (SELECT s.* from student_kp_history s where s.student_id = ? and s.kpid = ?) a
        where not EXISTS (select 1 from (SELECT s.*  from student_kp_history s
        where s.student_id = ? and s.kpid=?) b where datediff(a.update_time,b.update_time)=0 and b.logid>a.logid);`
        , [student_id, kpid, student_id, kpid]);
        return res;
    }

    //根据学生id,kpid 获取学生知识点能力综合概况（天梯分，正确率，练习次数）
    async getKpAbility(student_id, kpid){
        const res = await this.app.mysql.query('select k.kpname,c.chaptername,s.`student_id`,'
        +'s.`kp_rating` , s.`practice` ,s.`correct` from chapter c,kptable k left JOIN  student_kp s '
        +'on k.kpid=s.kpid and s.`student_id` =?  where k.`kpid` = ? and k.chapterid = c.chapterid;'
        , [student_id,kpid]);

        return res[0];
    }

    async getKpWithScore(student_id, chapter_id){
        const res = await this.app.mysql.query(`SELECT t.kpid,t.kpname,ss.kp_rating,ss.update_time 
        from (SELECT k.kpid,k.kpname FROM kptable k WHERE k.chapterid = ?) as t LEFT JOIN 
        (SELECT s.kpid,s.kp_rating ,s.update_time from student_kp s WHERE s.student_id = ?) as ss on t.kpid = ss.kpid;`
        , [chapter_id,student_id]);

        return res;
    }

    async getNewExerciseRating(logid){
        return await this.app.mysql.query(`select (sum(el.delta_exercise_rating) + e.exercise_rating) as new_exercise_rating, el.exercise_id
            from exercise_log el inner join exercise_log_trigger t on t.logid <= ? and el.logid = t.logid 
            inner join exercise e on el.exercise_id = e.exercise_id 
            group by el.exercise_id`, [logid]);
    }

    async getNewSnRating(logid){
        return await this.app.mysql.query(`select (sum(bl.sn_delta_rating) + b.sn_rating) as new_sn_rating, bl.exercise_id, bl.sn 
            from breakdown_log bl inner join exercise_log_trigger t on t.logid <= ? and bl.logid = t.logid
            inner join breakdown b on bl.exercise_id = b.exercise_id and bl.sn = b.sn 
            group by bl.exercise_id, bl.sn`, [logid]);
    }
}

module.exports = RatingService;