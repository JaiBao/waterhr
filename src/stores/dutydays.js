import { defineStore } from 'pinia'
import { apiAuth } from 'src/boot/axios'
// import { Datetime } from 'luxon'
export const useDutyStore = defineStore('duty', {
  state: () => ({
    dutydays: 0,
    year: '',
    month: '',
    shouldChangeMonth: false
  }),
  getters: {
  },
  actions: {
    async getdutyDays (year, month) {
      const { data } = await apiAuth.get(`/dutydays/find/${year}/${month}`)

      if (!data.data || !data.data[0] || data.data[0].day === undefined) {
        this.dutydays = 0
      } else {
        this.dutydays = data.data[0].day
      }
    }
  }
})
