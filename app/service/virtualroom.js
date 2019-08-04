const Service = require('egg').Service;

class virtualroomService extends Service {
    // 外部调用
    async getUserByID(id) {
        const results = await this.app.mysql.get('users', {
            userid: id
        })
        return results
    }
    async getBuffByID(id) {
        const results = await this.app.mysql.get('buff', {
            id: id
        })
        return results
    }

    // 基础
    async getVirtualroom () {
        const results = await this.app.mysql.select('virtual_room')
        return results
    }
    async getVirtualroomByID (id) {
        const results = await this.app.mysql.get('virtual_room', { id: id })
        return results
    }
    
    async getVirtualroomByName (name) {
        const results = await this.app.mysql.select('virtual_room', { name: name })
        return results
    }

    async getVirtualroomByAdmin (id) {
        const results = await this.app.mysql.select('virtual_room', { admin_id: id })
        return results
    }

    async addVirtualroom (room) {
        // { id: '', name: '', admin_id: '', description: '' }
        const user = await this.getUserByID(room.admin_id)
        if (user) {
            const result = await this.app.mysql.insert('virtual_room', room)
            return result.affectedRows
        }
        return 0
    }

    async updateVirtualroom (room) {
        // 缺少对admin_id合法性的验证
        const user = await this.getUserByID(room.admin_id)
        if (user) {
            const result = await this.app.mysql.update('virtual_room', room)
            return result.affectedRows
        }
        return 0
    }

    async deleteVirtualroom (id) {
        const result = await this.app.mysql.delete('virtual_room', { id: id })
        return result.affectedRows
    }

    // 签约
    async addVirtualroomSign(virtual_room_id, user_id) {
        // 验证合法性
        const user = await this.getUserByID(user_id)
        const room = await this.getVirtualroomByID(virtual_room_id)
        const date = new Date().toLocaleDateString()
        if (user && room) {
            const query = { user_id: user_id, date: date }
            const today = await this.app.mysql.get('virtual_room_user', query)
            let result = null
            if (today) {
                const options = { where: query }
                result = await this.app.mysql.update('virtual_room_user', { virtual_room_id: virtual_room_id }, options)
            } else {
                const sign = { virtual_room_id: virtual_room_id, user_id: user_id, date: date }
                result = await this.app.mysql.insert('virtual_room_user', sign)
            }
            return result.affectedRows
        }
        return 0
    }

    async getVirtualroomSign (query) {
        const results = await this.app.mysql.select('virtual_room_user', query)
        return results
    }

    async addVirtualroomBuff (virtual_room_id, buff_id, day) {
        // virtual_id, buff_id, 2[day]
        // 验证合法性
        const buff = await this.getBuffByID(buff_id)
        const room = await this.getVirtualroomByID(virtual_room_id)
        let expired_time = null
        if (buff && room) {
            const query = { buff_id, virtual_room_id }
            const current = await this.app.mysql.get('virtual_room_buff', query)
            let result = null
            if (current) {
                // 已存在增益，累加时间
                expired_time = new Date(current.expired_time)
                expired_time.setDate(expired_time.getDate() + parseInt(day))
                const options = { where: query }
                result = await this.app.mysql.update('virtual_room_buff', { expired_time }, options)
            } else {
                expired_time = new Date()
                expired_time.setDate(expired_time.getDate() + parseInt(day))
                const add = { buff_id, virtual_room_id, expired_time }
                result = await this.app.mysql.insert('virtual_room_buff', add)
            }
            return result.affectedRows
        }
        return 0
    }

    async getVirtualroomBuff (query) {
        const results = await this.app.mysql.select('virtual_room_buff', query)
        return results
    }
}

module.exports = virtualroomService