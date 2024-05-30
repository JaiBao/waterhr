import { defineStore } from 'pinia'
import { apiAuth } from 'src/boot/axios'
import { useUserStore } from 'src/stores/users.js'
const user = useUserStore()
export const useMemberStore = defineStore('member', {
  state: () => ({
    member: [],
    geted: false,
    dateoption: [
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
      '31'
    ],
    monthoption: [
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12'
    ],
    leaveoption: [
      '事假',
      '病假',
      '公假',
      '喪假',
      '婚假',
      '產檢假',
      '產假',
      '陪產假',
      '生理假',
      '特休假',
      '補休假',
      '家庭照顧假',
      '天然災害假',
      '公傷假',
      '其他'
    ],
    punched: false,
    leaved: false
  }),
  getters: {},
  actions: {
    async getMember () {
      if (this.geted === true) {
        console.log('already get member ')
      } else {
        this.member.splice(0, this.member.length)
        const result = await apiAuth.get('/users/all')
        for (let i = 0; i < result.data.message.length; i++) {
          if (user.team === '人事' || useUserStore().team === '管理') {
            this.member.push(result.data.message[i])
          } else if (result.data.message[i].team !== user.team) {
            continue
          } else {
            this.member.push(result.data.message[i])
          }
        }
        this.geted = true
        console.log('geted member')
      }
    },
    getUserDetail (val) {
      if (!this.geted) {
        this.getMember()
      } else {
        const find = this.member.find((item) => val === item.name)
        return find.depart === undefined ? '未設定' : find.depart
      }
    }
  }
})
