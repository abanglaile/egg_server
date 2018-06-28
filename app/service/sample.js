const Service = require('egg').Service;

class sampleService extends Service {


  async getSampleList(exercise_id) {
    const sample_list = await this.getExerciseSample(exercise_id);
    var json_list = [];
    if(sample_list){
      for(let i = 0;i < sample_list.length; i++){
        let item = sample_list[i];
        json_list.push({
          sample : JSON.parse(item.sample),
          exercise_id : item.exercise_id,
          sample_index : item.sample_index,
          exercise_type : item.exercise_type,
          answer : JSON.parse(item.answer),
          title_img_url : item.title_img_url,
          title_audio_url : item.title_audio_url
        });
      }
      return json_list;
    }else{
      return json_list;
    }    
  }


  async getExerciseSample(exercise_id) {
    const res = await this.app.mysql.query('select e.* from exercise_sample e where e.exercise_id = ?', exercise_id);
    console.log("getExerciseSample: "+ res);
    return res;    
  }


  async addOneSample(exercise_sample){
    console.log("exercise_sample:  ",JSON.stringify(exercise_sample));
    const res = await this.app.mysql.insert('exercise_sample',exercise_sample);
    return res;
  }

  async updateOneSample(exercise_sample,id,index){
    const options = {
      where: {
        exercise_id : id,
        sample_index : index,
      }
    };
    const res = await this.app.mysql.update('exercise_sample',exercise_sample,options);
    return res;
  }

}

module.exports = sampleService;
 