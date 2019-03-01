const Service = require('egg').Service;

class TweetService extends Service {
    async addTweet(tweet) {
        return await this.app.mysql.insert('student_tweet', tweet);
    }
    
    async deleteTweet(tweet_id) {
        return await this.app.mysql.delete('student_tweet', tweet_id);
    }

    async getLessonTweet(tweet_id) {
        return await this.app.mysql.select('student_tweet', tweet_id);
    }

    async searchTweetLabel(input){
        let comment_label = this.app.mysql.query(`select t.tweet_label_id, t.label_content 
            from tweet_label t where t.label_content like ?`, '%'+input+'%');
        let kp_label = this.service.bookchapter.searchKp(input);
        return {
            comment_label: await comment_label,
            kp_label: await kp_label,
        }
    }

}

module.exports = TweetService;
 