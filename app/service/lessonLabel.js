const Service = require('egg').Service;

class LessonLabelService extends Service {
    async getSchoolLabel() {
        const res = await this.app.mysql.select('lesson_label');
        return res;
    }

}

module.exports = LessonLabelService;
 