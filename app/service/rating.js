const Service = require('egg').Service;

class RatingService extends Service {

    async getMyBookChapter(student_id, course_id){
        const results = await this.app.mysql.query(`select b.bookid, b.bookname, c.chapterid, c.chaptername, sc.chapter_rating, cs.chapter_standard 
            from book b, 
            chapter c left join student_chapter sc on sc.chapterid = c.chapterid and sc.student_id = ? 
                    left join chapter_standard cs on c.chapterid = cs.chapterid
            where b.course_id = ? and c.bookid = b.bookid ORDER BY chindex`, [student_id, course_id]);
        console.log(results.length);
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
        const res = await this.app.mysql.query('select t.student_rating from student_rating t where t.student_id = ? and t.course_id = ? ORDER BY update_time DESC LIMIT 1', [student_id, course_id]);
        return res;     
    }

    async getChapterKpStatus(student_id,chapter_id) {

        let chapter_status = this.app.mysql.query('select c.chaptername, sum(sk.practice) as practice, '
        +'sum(sk.correct) as correct from chapter c, '
        +'kptable k LEFT JOIN student_kp sk on k.kpid = sk.kpid and sk.student_id = ? '
        +'where c.chapterid = ? and k.chapterid = c.chapterid;'
        , [student_id,chapter_id]);

        let kp_status = this.app.mysql.query('select k.kpid, k.kpname, ks.kp_standard ,sk.kp_rating, '
        +'sk.practice, sk.correct from chapter c, '
        +'kptable k LEFT JOIN kp_standard ks on ks.kpid = k.kpid LEFT JOIN student_kp sk on k.kpid = sk.kpid and sk.student_id = ? '
        +'where c.chapterid = ? and k.chapterid = c.chapterid;'
        , [student_id,chapter_id]);

        chapter_status = await chapter_status;

        return {
            chapterid: chapter_id,
            chapter_status: chapter_status[0],
            kp_status: await kp_status,
        }
        //return res;
    }

    

}

module.exports = RatingService;