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

}

module.exports = TweetService;
 