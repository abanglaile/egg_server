const Service = require('egg').Service;

class buffService extends Service {
    async getBuffByID (id) {
        const results = await this.app.mysql.get('buff', { id: id })
        return results
    }
    
    async getBuffByName (name) {
        const results = await this.app.mysql.select('buff', { name: name })
        return results
    }

    async addBuff (buff) {
        // { name: '', type: 2, value: '' }
        const result = await this.app.mysql.insert('buff', buff)
        return result.affectedRows
    }

    async updateBuff (buff) {
        const result = await this.app.mysql.update('buff', buff)
        return result.affectedRows
    }

    async deleteBuff (id) {
        const result = await this.app.mysql.delete('buff', { id: id })
        return result.affectedRows
    }
}

module.exports = buffService
 