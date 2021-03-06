const Service = require('egg').Service;

class bookchapterService extends Service {
    
  async getBookChapter(course_id) {
    const results = await this.app.mysql.query('select b.bookname, ch.bookid, '
    +'ch.chapterid, ch.chaptername from chapter ch, book b where b.course_id = ? '
    +'and ch.bookid = b.bookid order by chapterid asc', course_id);

    var rep = [];
    for(var i = 0; i < results.length; i++){
        var chapter = results[i];
        var m = true;
        console.log(rep);
        for(var j = 0; j < rep.length; j++){
            var book = rep[j];
            if(book.bookid == chapter.bookid){
                book.chapters.push({chapterid: chapter.chapterid, chaptername: chapter.chaptername});
                m = false;
                break;
            }
        }   
        //插入新的bookid
        if(m){
            var book = {bookid: chapter.bookid, bookname: chapter.bookname, chapters: [{
                chapterid: chapter.chapterid, 
                chaptername: chapter.chaptername
            }]};
            rep.push(book);
        }
    }
    return rep;
  }

  async getMyBookChapter(student_id, course_id){

    const results = await this.app.mysql.query('select bookkp.*,rate.practice,rate.correct from (SELECT b.bookname,ch.bookid,ch.chapterid,'
    +'ch.chaptername from book b,chapter ch where b.bookid = ch.bookid  and b.course_id = ?) '
    +'as bookkp LEFT JOIN (select sum(sk.`practice`) as practice,sum(sk.`correct`) as correct,'
    +' k.chapterid,sk.student_id  from kptable k LEFT JOIN student_kp sk on k.kpid = sk.kpid '
    +'where sk.student_id = ? GROUP BY k.chapterid) as rate on bookkp.chapterid=rate.chapterid;'
    , [course_id,student_id]);


    var rep = [];
    for(var i = 0; i < results.length; i++){
        var chapter = results[i];
        var m = true;
        console.log(rep);
        for(var j = 0; j < rep.length; j++){
            var book = rep[j];
            if(book.bookid == chapter.bookid){
                let rate = chapter.practice ? Math.round((chapter.correct/chapter.practice)*100) : 0;
                book.chapters.push({chapterid: chapter.chapterid, chaptername: chapter.chaptername,chapterrate:rate});
                m = false;
                break;
            }
        }
        //插入新的bookid
        if(m){
            let rate = chapter.practice ? Math.round((chapter.correct/chapter.practice)*100) : 0;
            var book = {bookid: chapter.bookid, bookname: chapter.bookname, chapters: [{
                chapterid: chapter.chapterid, 
                chaptername: chapter.chaptername,
                chapterrate: rate
            }]};
            rep.push(book);
        }
    }
    return rep;
  }

  async getChapterKp(chapter_id) {
    const res = await this.app.mysql.select('kptable', {where : { chapterid : chapter_id}});
    return res;
  }

  async searchKp(input, course_label){
    const course_sql = `INNER JOIN chapter ch on ch.chapterid = k.chapterid 
    INNER JOIN book b on b.bookid = ch.bookid 
    INNER JOIN course c on b.course_id = c.course_id and c.course_label = ?`;
    const sql = "select k.kpid, k.kpname from kptable k" 
        + (course_label ? course_sql : "") +  " where k.kpname like ?";
    let params = [];
    if(course_label){
        params.push(course_label);
    }
    params.push('%'+input+'%');
    return await this.app.mysql.query(sql, params);
        
  }

  async getChapterName(chapter_id) {
    const res = await this.app.mysql.select('chapter', {
        where : { chapterid : chapter_id},
        columns : ['chaptername'],
    });
    return res;
  }


  async getCourse() {
    const res = await this.app.mysql.query(`select * from course`, []);
    return res;
  }

  async getCourseBook(course_id) {
    return await this.app.mysql.query(`select * from book where course_id = ?`, [course_id]);
  }

  async getStudentBook(student_id, course_id) {
    let book_list = await this.app.mysql.query('select bookid as book_id, bookname as book_name from book where course_id = ?', [course_id]);
    let current = await this.app.mysql.queryOne('select book_id from default_course where course_id = ? and student_id = ?', [course_id, student_id])
    if(!current || !current.book_id){
        current = book_list[0]
    }
    return {
        books: book_list,
        current_book: current.book_id
    }
  }

  async setDefaultBook(student_id, course_id, book_id){
    return await this.app.mysql.query(`replace into default_course(course_id, student_id, book_id, is_default) 
    values (?, ?, ?, 1)`, [course_id, student_id, book_id]);
    //return await getStudentCourse(student_id) 
  }

  

}

module.exports = bookchapterService;
 