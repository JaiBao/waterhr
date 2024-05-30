<template>
  <div class="q-pa-md w-100 row items-center justify-center">
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="_id"
      class="w-100 my-sticky-header-table"
      :rows-per-page-options="[0]"
    >
      <template v-slot:top>
        <q-select
          v-model="select.month"
          outlined
          :options="optionsmonth"
          label="月份"
        />
        <div class="text-h6 q-mx-lg">{{ title }}</div>
        <q-btn
          label="請假"
          color="primary"
          class="q-mx-xs"
          @click="leave = true"
        />
      </template>
      <template v-slot:body-cell-edit="props">
        <q-td class="text-center q-gutter-sm">
          <q-btn
            icon="mdi-pencil"
            color="teal"
            fab-mini
            unelevated
            size="sm"
            @click="openDialog(props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </div>
  <!-- -------------------------------------------------------- -->
  <q-dialog v-model="prompt" full-width>
    <q-card class="editform q-pa-md">
      <div class="row w-100">
        <div class="col-4 q-ma-md">
          <div class="text-h6">計算上班</div>
          <q-input
            outlined
            mask="##:##"
            v-model="editform.editClockIn"
            autofocus
            @keyup.enter="prompt = false"
          />
        </div>
        <div class="col-4 q-ma-md">
          <div class="text-h6">計算下班</div>
          <q-input
            outlined
            v-model="editform.editClockOut"
            mask="##:##"
            autofocus
          />
        </div>
        <div class="col-4 q-ma-md">
          <div class="text-h6">假別</div>
          <q-select
            :options="leaveoption"
            outlined
            v-model="editform.punchtype"
            autofocus
          />
        </div>
      </div>
      <div class="row w-100">
        <div class="col-1 q-ma-md">
          <div class="text-h6">年</div>
          <q-input outlined v-model="editform.year" autofocus />
        </div>
        <div class="col-1 q-ma-md">
          <div class="text-h6">月</div>
          <q-input outlined v-model="editform.month" autofocus />
        </div>
        <div class="col-1 q-ma-md">
          <div class="text-h6">日</div>
          <q-input outlined v-model="editform.day" autofocus />
        </div>
        <div class="col-2 q-ma-md">
          <div class="text-h6">時長(小時)</div>
          <q-input outlined v-model="editform.hours" autofocus />
          <q-btn color="secondary" label="計算" @click="calculate" />
        </div>
      </div>
      <div class="row w-100"></div>
      <div class="row w-100 justify-end">
        <q-input class="col-3" readonly v-model="editform._id" autofocus />
        <q-btn color="red" label="取消" v-close-popup class="q-mx-md" />
        <q-btn color="primary" label="修改" v-close-popup @click="Submittime" />
      </div>
    </q-card>
  </q-dialog>
  <q-dialog v-model="leave">
    <q-card class="bg-white"> <LeaveAdd /></q-card>
  </q-dialog>
</template>
<script setup>
import { ref, reactive, watchEffect, watch } from 'vue' // computed
import { DateTime } from 'luxon'
import { apiAuth } from 'src/boot/axios'
import { useQuasar } from 'quasar'
import { useMemberStore } from 'src/stores/member'
import { useDutyStore } from 'src/stores/dutydays'
// import { useUserStore } from 'src/stores/users'
// import { useHoursStore } from 'src/stores/hours'
import { useRoute } from 'vue-router'
import LeaveAdd from 'src/components/LeaveAdd.vue'
// ------------------------------------------------------------------
const member = useMemberStore()
const leave = ref(false)
// const fivePM = DateTime.fromObject({ hour: 17 })
const optionsmonth = member.monthoption
const leaveoption = member.leaveoption
// ------------------------------------------------------------------
// const user = useUserStore()
// const hours = useHoursStore()
const $q = useQuasar()
const route = useRoute()
const duty = useDutyStore()
const prompt = ref(false)
const today = ref(DateTime.now())
const title = ref('')
const data = ref(null) // 存储从API获取的数据
watchEffect(() => {
  title.value = '月請假記錄'
  // ${today.value.month.toString().padStart(2, '0')}
})

watchEffect(async () => {
  try {
    const response = await apiAuth.get(`users/admin/${route.params.number}`)
    data.value = response.data.data // 假设您的响应数据在 response.data 中
    console.log(data.value)
  } catch (error) {
    console.error('Error fetching data:', error)
  }
})
const select = ref({
  month: today.value.month.toString().padStart(2, '0'),
  year: today.value.year
})
if (duty.shouldChangeMonth) {
  console.log('month change!')
  select.value.month = duty.month
  duty.shouldChangeMonth = false
}
const rows = reactive([])
const getAllTime = async () => {
  rows.splice(0, rows.length)
  // await hours.gethours(route.params.number, select.value)
  const { data } = await apiAuth.get(
    `leave/find/${select.value.month}/${route.params.number}`
  )
  for (let i = 0; i < data.data.length; i++) {
    rows.push(data.data[i])
    console.log(rows)
  }
  // for (let i = 0; i < hours.work.length; i++) {
  //   const record = hours.work[i]
  //   if (
  //     (user.team === '人事' && record.state === '已審核') ||
  //     (record.team === user.team && record.state === '已審核')
  //   ) {
  //     record.editClockIn = roundTimeIn(record.editClockIn)
  //     if (record.editClockOut) {
  //       record.editClockOut = roundTimeOut(record.editClockOut)
  //     } else {
  //       record.editClockOut = record.editClockIn
  //     }
  //     record.editClockOut = roundTimeOut(record.editClockOut)
  //     rows.push(record)
  //   } else {
  //     continue
  //   }
  // }
}

getAllTime()
// ----------------------------------------------------------------
// const props = defineProps(['rows'])
const calculate = () => {
  const start = DateTime.fromFormat(editform.value.editClockIn, 'HH:mm')
  const end = DateTime.fromFormat(editform.value.editClockOut, 'HH:mm')
  const diff = end.diff(start, ['hours', 'minutes'])

  // 轉換為小數小時
  const decimalHours = diff.hours + diff.minutes / 60

  editform.value.hours = decimalHours.toFixed(1) // 將結果四捨五入到小數點後一位
}
// ------------------------------------------------------------------
watch(
  () => member.leaved,
  (newValue, oldValue) => {
    if (newValue === true) {
      console.log('leaved in!')
      getAllTime()
    }
  }
)
// ------------------------------------------------------------------
const editform = ref({
  _id: '',
  late: '',
  editClockIn: '',
  editClockOut: '',
  year: '',
  month: '',
  day: '',
  punchtype: '',
  hours: ''
})
// ------------------------------------------------------------------
//  上班時間至00 30
// const roundTimeIn = (timeStr) => {
//   let [hours, minutes] = timeStr.split(':').map(Number)

//   if (minutes > 5 && minutes <= 30) {
//     minutes = 30
//   } else if (minutes > 30) {
//     minutes = 0
//     hours++
//   }

//   return `${hours.toString().padStart(2, '0')}:${minutes
//     .toString()
//     .padStart(2, '0')}`
// }
// //  下班時間至00 30
// const roundTimeOut = (timeStr) => {
//   let [hours, minutes] = timeStr.split(':').map(Number)
//   if (minutes > 0 && minutes < 30) {
//     minutes = 0
//   } else if (minutes >= 30) {
//     minutes = 30
//   }

//   return `${hours.toString().padStart(2, '0')}:${minutes
//     .toString()
//     .padStart(2, '0')}`
// }

const openDialog = (props) => {
  prompt.value = true
  console.log(props)
  editform.value._id = props._id
  editform.value.editClockIn = props.ClockIn
  editform.value.editClockOut = props.ClockOut
  editform.value.year = props.year
  editform.value.month = props.month
  editform.value.day = props.day
  editform.value.punchtype = props.punchtype
  editform.value.hours = props.hours
}

watch(select.value, (newValue, oldValue) => {
  console.log(newValue)
  today.value = newValue
  getAllTime()
})
watch(member.leaved, (newValue, oldValue) => {
  if (newValue === true) {
    getAllTime()
  }
})
const closeDialog = (props) => {
  prompt.value = false
  editform.value._id = ''
  editform.value.editClockIn = ''
  editform.value.editClockOut = ''
  editform.value.year = ''
  editform.value.month = ''
  editform.value.day = ''
  editform.value.punchtype = ''
  editform.value.hours = ''
}
const Submittime = async () => {
  console.log(editform.value)
  try {
    const { data } = await apiAuth.patch('/leave/edit', editform.value)
    console.log(data)
    await $q.notify({
      color: 'positive',
      icon: 'cloud_done',
      position: 'center',
      message: data.data.name + '修改成功'
    })
  } catch (error) {
    console.log(error)
    await $q.notify({
      color: 'positive',
      icon: 'cloud_done',
      position: 'center',
      message: error.message
    })
  }
  await apiAuth.patch('/leave/edit', editform.value)
  await closeDialog()
  await getAllTime()
}

// const reject = async () => {
//   await apiAuth.patch('/work/check', rejectform.value)
//   await $q.notify({
//     color: 'positive',
//     icon: 'cloud_done',
//     message: '已更新'
//   })
//   await getAllTime()
// }
// ----------------------------------------------------------------

const columns = [
  {
    name: 'name',
    align: 'center',
    label: '名字',
    field: 'name',
    sortable: true
  },
  {
    name: 'team',
    align: 'center',
    label: '班別',
    field: 'team',
    sortable: true
  },
  {
    name: 'month',
    align: 'center',
    label: '年',
    field: 'month',
    sortable: true
  },
  { name: 'day', label: '日', field: 'day', align: 'center', sortable: true },
  {
    name: 'ClockIn',
    label: '開始時間',
    field: 'ClockIn',
    sortable: true,
    align: 'center'
  },
  {
    name: 'ClockOut',
    label: '結束時間',
    field: 'ClockOut',
    sortable: true,
    align: 'center'
  },
  {
    name: 'hours',
    label: '小時',
    field: 'hours',
    sortable: true,
    align: 'center'
  },
  {
    name: 'punchtype',
    label: '假別',
    field: 'punchtype',
    sortable: true,
    align: 'center'
  },
  // {
  //   name: 'state',
  //   label: '狀態',
  //   field: 'state',
  //   sortable: true,
  //   align: 'center'
  // },
  {
    name: 'edit',
    align: 'center',
    label: '編輯',
    field: 'edit',
    sortable: true
  }
]
</script>

<style lang="scss" scoped>
.editform {
  max-width: 1080px;
}
</style>
