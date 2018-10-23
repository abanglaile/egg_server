const Service = require('egg').Service;
const promise = require('bluebird');
const qiniu = require("qiniu");

const accessKey = "oJ6oH5Zzo6e_dW21Q4UKCnmwCRwfJ9OaqlC9yK5k";
const secretKey = "Fkau1rsZ1I7CuoMJ6Ns1UfwPljrXeAWr-ecqGwSS";
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
console.log(mac);
const bucket = 'exercise-pic';
var options = {
    scope: bucket,
  };
var putPolicy = new qiniu.rs.PutPolicy(options);
const uploadToken = putPolicy.uploadToken(mac);
var config = new qiniu.conf.Config();
// 空间对应的机房
config.zone = qiniu.zone.Zone_z2;

let formUploader = new qiniu.form_up.FormUploader(config);
var putFile = promise.promisify(formUploader.putFile, { multiArgs: true, context: formUploader});

//const putFile = promise.promisify(qiniu.io.putFile);
class qiniuService extends Service {

    async uploadTestFile(filename) {
        let putExtra = new qiniu.form_up.PutExtra();
        //要上传文件的本地路径
         let filePath = '/usr/local/www/kpmanager/img/test.png';
        //let filePath = 'D:\\www\\kpmanager\\img\\test.png';
        var ret = await putFile(uploadToken, filename, filePath, putExtra);
        console.log(ret);
        return ret;
    }

    async deleteFile(filename) {
        var bucketManager = new qiniu.rs.BucketManager(mac, config);
        
    }

}

module.exports = qiniuService;

