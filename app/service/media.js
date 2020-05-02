const Service = require('egg').Service;

class mediaService extends Service {

    async queryMediaByPage(offset, limit, tag) {
        const ret = await this.app.mysql.select('media_res', { // 搜索 media_res 表
            where: {tag: tag},
            orders: [['update_time','desc']] , // 排序方式
            limit: limit, // 返回数据量
            offset: offset, // 数据偏移量
          });
        return ret;
    }

    async saveTestMedia(url, wav_url){
        let filename = url.substring(url.lastIndexOf("/") + 1, url.length);
        var wavName = '';
        if(wav_url){
            wavName = wav_url.substring(wav_url.lastIndexOf("/") + 1, wav_url.length);
            const res = await this.service.qiniu.uploadTestFile(wavName);
        }
        const ret = await this.service.qiniu.uploadTestFile(filename);
        console.log("saveTestMedia ret:   ",ret);
        const code = await this.service.lily.getTestly();
        const insert_ret = await this.app.mysql.query(`INSERT INTO media_res
            (code, url, wav_url, tag) VALUES(?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            code = ?, wav_url = ?`, [code, url, wav_url, 2, code, wav_url]);
        console.log(code);
        return {
            code: code,
            url: url,
            wav_url: wav_url,
            ret: ret,
        }
    }

    async searchMeidaByUrl(url){
        const media_res = await this.app.mysql.get('media_res', {url: url});
        return media_res;
    }

    async saveUploadUrl(url,type){
        const res = await this.app.mysql.insert('media_res', {
            url : url,
            tag : type,
        }); 
        const result = await this.searchMeidaByUrl(url);
        return result;
    }

}

module.exports = mediaService;

