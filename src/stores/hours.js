import { defineStore } from 'pinia'
import { apiAuth } from 'src/boot/axios'

export const useHoursStore = defineStore('hours', {
  state: () => ({
    work: [],
    editdate: '',
    shouldEdit: false,
    shouldPunchin: false
  }),
  getters: {
  },
  actions: {
    async gethours (number, date) {
      this.work.splice(0, this.work.length)
      console.log(number, date)
      const { data } = await apiAuth.post(`/work/month/${number}`, date)
      console.log(data.message)
      data.message.forEach((item) => {
        this.work.push(item)
      })
    },
    async getDayHours (date) {
      this.work.splice(0, this.work.length)
      const { data } = await apiAuth.post('/work/allday', date)
      console.log(data.result)
      data.result.forEach((item) => {
        this.work.push(item)
      })
    },
    async calculate (rows) {
      const timeToMinutes = (time) => {
        if (!time || !time.includes(':')) {
          return 0
        }
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
      }

      // 總小時（轉換為分鐘）
      const totalHoursInMinutes = rows.reduce((acc, row) => acc + timeToMinutes(row.hours), 0)

      // 轉回時格式
      const totalHoursDecimal = totalHoursInMinutes / 60
      // 總遲到
      const totalLate = rows.reduce((acc, row) => acc + row.late, 0)

      // 總加班（第一階段、第二階段、第三階段）
      const totalOverhourFirst = rows.reduce((acc, row) => acc + Number(row.overhourfirst), 0)
      const totalOverhourSecond = rows.reduce((acc, row) => acc + Number(row.overhoursecond), 0)
      const totalOverhourThird = rows.reduce((acc, row) => acc + Number(row.overhourthird), 0)
      // console.log(totalOverhourFirst, totalOverhourSecond, totalOverhourThird)
      return {
        totalHoursDecimal,
        totalLate,
        totalOverhourFirst,
        totalOverhourSecond,
        totalOverhourThird
      }
    }
  }
})
