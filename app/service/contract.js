const Service = require('egg').Service;

class ContractService extends Service {
    
    async addNewContract(contract){
        const addres = await this.app.mysql.insert('history_contract',contract);
        const update_result = await this.app.mysql.query(`update group_student 
            set guide_min = guide_min + ?,class_min = class_min + ? 
            where stu_group_id = ? and student_id = ?`, 
            [contract.guide_min,contract.class_min,contract.stu_group_id,contract.student_id]);

        return addres.insertId;
    }

    async getHistoryContract(stu_group_id){
        const res = await this.app.mysql.query(`select s.group_name,h.* from history_contract h ,
            school_group s where s.stu_group_id = h.stu_group_id and h.stu_group_id = ? 
            order by h.payment_time desc;`, [stu_group_id]); 

        var total_fee = 0;
        for(var i=0;i<res.length;i++){
            total_fee += res[i].fee;
        }
        var his_contract_list = {
            hisContractList : res,
            total_fee : total_fee,
        };
        return his_contract_list;
    }

}

module.exports = ContractService;
 