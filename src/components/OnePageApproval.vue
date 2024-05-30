<template>
  <div class="q-pa-xs w-100 row items-center justify-center">
    <q-table
      :title="title"
      :rows="rows"
      :columns="columns"
      row-key="_id"
      class="w-100 my-sticky-header-table"
      :rows-per-page-options="[0]"
      :visible-columns="visibleColumns"
      :row-class="setRowClass"
      v-model:pagination="pagination"
    >
      <template v-slot:top="props">
        <q-input
          v-model="select.year"
          outlined
          label="年"
        />
        <q-select
          v-model="select.month"
          outlined
          :options="member.monthoption"
          label="月份"
        />
        <div class="text-h6 q-mx-lg">{{ title }}</div>
        <q-btn
          label="補打卡"
          color="secondary"
          class="q-mx-md"
          @click="manual = true"
        />
        <q-btn
          color="primary"
          icon-right="archive"
          label="下載"
          @click="exportTable"
          class="q-ma-md"
        />
        <q-btn
          color="secondary"
          label="返回"
          to="/admin/hours"
          class="q-ma-md"
        />
        <q-space />
        <q-select
          v-model="visibleColumns"
          multiple
          outlined
          :display-value="$q.lang.table.columns"
          emit-value
          map-options
          label="顯示欄位"
          :options="columns"
          option-value="field"
          options-cover
          class="col-2 q-mx-xs"
        />
        <q-btn
          flat
          round
          dense
          :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
          @click="props.toggleFullscreen"
          class="q-ml-md"
        />
      </template>

      <template v-slot:body-cell-onClockIn="props">
        <q-td
          class="text-center q-gutter-sm"
          :class="backgroundAM(props.row.onClockIn, props.row.team)"
          @click="openDialog(props.row)"
        >
          {{ props.row.onClockIn }}
          <q-badge
            v-if="props.row.editClockInStatus"
            color="red"
            transparent
            rounded
          />
        </q-td>
      </template>
      <template v-slot:body-cell-onClockOut="props">
        <q-td
          class="text-center q-gutter-sm bordercell"
          :class="backgroundPM(props.row.onClockOut, props.row.team)"
          @click="openDialog(props.row)"
        >
          {{ props.row.onClockOut }}
          <q-badge
            v-if="props.row.editClockOutStatus"
            color="red"
            transparent
            rounded
          />
        </q-td>
      </template>
      <template v-slot:body-cell-late="props">
        <q-td class="text-center q-gutter-sm" @click="openDialog(props.row)">
          {{ props.row.late }}
          <q-badge v-if="props.row.lateEdit" color="red" rounded />
        </q-td>
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
      <template v-slot:body-cell-updates="props">
        <q-td class="text-center q-gutter-sm">
          {{ props.row.updates.length }}
        </q-td>
      </template>
      <template v-slot:body-cell-updatedby="props">
        <q-td class="text-center q-gutter-sm">
          {{ props.row.updates[props.row.updates.length - 1]?.updatedBy }}
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
            mask="time"
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
            mask="time"
            autofocus
          />
        </div>
        <div class="col-4 q-ma-md">
          <div class="text-h6">遲到(分鐘)</div>
          <q-input outlined v-model="editform.late" autofocus />
        </div>
      </div>
      <div class="row w-100">
        <div class="col-3 q-ma-md">
          <div class="text-h6">加班一(小時)倍率1.34</div>
          <q-input outlined v-model="editform.overhourfirst" autofocus />
        </div>
        <div class="col-3 q-ma-md">
          <div class="text-h6">加班二(小時)倍率1.67</div>

          <q-input outlined v-model="editform.overhoursecond" autofocus />
        </div>
        <div class="col-3 q-ma-md">
          <div class="text-h6">加班三(小時)倍率2</div>

          <q-input outlined v-model="editform.overhourthird" autofocus />
        </div>
      </div>
      <div class="row w-100">
        <q-checkbox v-model="editform.breaktimehalf" label="扣休半小時" />
        <q-checkbox v-model="editform.breaktime" label="扣休一小時" />
        <q-checkbox v-model="editform.breakday" label="休息日" />
        <q-checkbox v-model="editform.holiday" label="例假日 | 國定假日" />
      </div>
      <div class="row w-100 justify-end">
        <q-input
          outlined
          readonly
          v-model="editform.month"
          label="月"
          class="q-ma-md"
        />
        <q-input
          outlined
          readonly
          v-model="editform.day"
          label="日"
          class="q-ma-md"
        />
        <q-input
          outlined
          readonly
          v-model="editform.onClockIn"
          label="打卡上班"
          class="q-ma-md"
        />
        <q-input
          outlined
          readonly
          v-model="editform.onClockOut"
          label="打卡下班"
          class="q-ma-md"
        />
        <q-space />
        <q-input
          outlined
          class="col-3 q-ma-md"
          readonly
          v-model="editform._id"
          autofocus
        />
        <q-btn
          size="20px"
          color="red"
          label="取消"
          v-close-popup
          class="q-ma-xs"
        />
        <q-btn
          size="20px"
          color="primary"
          label="修改"
          v-close-popup
          @click="Submittime"
          class="q-ma-xs"
        />
      </div>
    </q-card>
  </q-dialog>
  <q-dialog v-model="manual">
    <q-card class="bg-white"> <ManualPunchin /></q-card>
  </q-dialog>
</template>
<script setup>
import { ref, reactive, watchEffect, watch } from 'vue' // computed
import { DateTime } from 'luxon'
import { apiAuth } from 'src/boot/axios'
import { exportFile, useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/users'
import { useMemberStore } from 'src/stores/member'
import { useHoursStore } from 'src/stores/hours'
import { useDutyStore } from 'src/stores/dutydays'
import { useRoute } from 'vue-router'
import ManualPunchin from 'src/components/ManualPunchin.vue'

// ------------------------------------------------------------------
const manual = ref(false)
// const leave = ref(false)
// const fivePM = DateTime.fromObject({ hour: 17 })
// ------------------------------------------------------------------
const user = useUserStore()
const member = useMemberStore()
const hours = useHoursStore()
const duty = useDutyStore()
const route = useRoute()
const $q = useQuasar()
const prompt = ref(false)
const today = ref(DateTime.now())
const title = ref('')
const data = ref(null) // 存储从API获取的数据
const visibleColumns = ref([
  'name',
  'team',
  'month',
  'day',
  'week',
  'onClockIn',
  'onClockOut',
  'editClockIn',
  'editClockOut',
  'hours',
  'late',
  'overhourfirst',
  'overhoursecond',
  'overhourthird',
  'edit',
  'updates',
  'updatedby'
])
const pagination = ref({
  sortBy: 'day',
  descending: false

})
watchEffect(() => {
  title.value = '月打卡記錄'
  console.log(data.value)
  // ${today.value.month.toString().padStart(2, '0')}月
  if (data.value && data.value.team === '早班') {
    title.value += '  早班規則 0800-1630 固定加班1.5h 至 1800'
  }
  if (
    data.value &&
    (data.value.team === '晚班' || data.value.team === '外籍')
  ) {
    title.value += '  晚班規則 2200-0600 固定加班2h 至 0800'
  }
  if (data.value && data.value.team === 'PT') {
    title.value += '  PT以總時數計算'
  }
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
const rows = reactive([])
const getAllTime = async () => {
  rows.splice(0, rows.length)
  await hours.gethours(route.params.number, select.value)
  for (let i = 0; i < hours.work.length; i++) {
    const record = hours.work[i]
    if (
      (user.team === '人事' && record.state === '已審核') ||
      (record.team === user.team && record.state === '已審核')
    ) {
      record.editClockIn = roundTimeIn(record.editClockIn)
      if (record.editClockOut) {
        record.editClockOut = roundTimeOut(record.editClockOut)
      } else {
        record.editClockOut = record.editClockIn
      }
      record.editClockOut = roundTimeOut(record.editClockOut)
      // 加入星期幾
      if (record.year && record.month && record.day) {
        const dt = DateTime.fromObject({
          year: parseInt(record.year, 10),
          month: parseInt(record.month, 10),
          day: parseInt(record.day, 10)
        })
        record.week = dt.weekdayShort // 使用 `.weekdayShort` 來得到縮寫
      }
      rows.push(record)
    } else {
      continue
    }
  }
}

// let totalOverhourFirst
// let totalHoursFormatted
// let totalOverhourSecond
// let totalOverhourThird
// let totalLate
watch(
  () => hours.shouldedit,
  (newValue, oldValue) => {
    if (newValue === true) {
      const day = hours.editdate.split('-')[2]
      const result = rows.find((item) => item.day === day)
      openDialog(result)
      hours.shouldedit = false
      hours.editdate = ''
    }
  }
)
watch(
  () => hours.shouldPunchin,
  (newValue, oldValue) => {
    if (newValue === true) {
      // const day = hours.editdate.split('-')[2]
      // const result = rows.find((item) => item.day === day)
      manual.value = true
    }
  }
)
watch(
  () => member.punched,
  (newValue, oldValue) => {
    if (newValue === true) {
      console.log('Punched in!')
      getAllTime()
    }
  }
)
watch(
  () => member.leaved,
  (newValue, oldValue) => {
    if (newValue === true) {
      console.log('leaved in!')
      getAllTime()
    }
  }
)

if (duty.shouldChangeMonth) {
  console.log('month change!')
  select.value.month = duty.month
  select.value.year = duty.year
  // duty.shouldChangeMonth = false
}
getAllTime()
// ----------------------------------------------------------------
// const props = defineProps(['rows'])
const backgroundAM = (clockIn, team) => {
  if (!clockIn) {
    return 'bg-orange-5'
  }
  const clockInTime = DateTime.fromFormat(clockIn, 'HH:mm')
  let targetTime

  switch (team) {
    case '早班':
      targetTime = DateTime.fromObject({ hour: 8 })
      break
    case '晚班':
      targetTime = DateTime.fromObject({ hour: 22 })
      break
    case '外籍':
      targetTime = DateTime.fromObject({ hour: 22 })
      break
    default:
      return ''
  }

  const diff = clockInTime.diff(targetTime, 'minutes').as('minutes')

  return diff < -29 ? 'bg-yellow-5' : diff < 0 ? '' : 'bg-red-5' //
}
// ------------------------------------------------------------------
const backgroundPM = (clockIn, team) => {
  const classes = []
  if (!clockIn) {
    return 'bg-orange-5'
  }
  const clockInTime = DateTime.fromFormat(clockIn, 'HH:mm')
  let targetTime
  if (clockIn.includes('58' || '59')) {
    classes.push('redfont')
  }
  switch (team) {
    case '早班':
      targetTime = DateTime.fromObject({ hour: 18 })
      break
    case '晚班':
    case '外籍':
      targetTime = DateTime.fromObject({ hour: 8 })
      break
    default:
      return ''
  }

  const diff = clockInTime.diff(targetTime, 'minutes').as('minutes')
  if (diff < -179) {
    classes.push('bg-red-5')
  } else if (diff > 29) {
    classes.push('bg-yellow-5')
  }

  return classes.join(' ')
}
// const onRowClick = (val) => {
//   console.log(val)
// }
// ------------------------------------------------------------------
const editform = ref({
  _id: '',
  late: '',
  month: '',
  day: '',
  onClockIn: '',
  onClockOut: '',
  editClockIn: '',
  editClockOut: '',
  breaktime: false,
  breaktimehalf: false,
  holiday: false,
  breakday: false,
  overhourfirst: '',
  overhoursecond: '',
  overhourthird: ''
})
// ------------------------------------------------------------------
//  上班時間至00 30
const roundTimeIn = (timeStr) => {
  try {
    let [hours, minutes] = timeStr.split(':').map(Number)

    if (minutes > 5 && minutes <= 30) {
      minutes = 30
    } else if (minutes > 30) {
      minutes = 0
      hours++
    }

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`
  } catch (error) {
    if (error instanceof TypeError) {
      return '09:00'
    }
    throw error // If it's another type of error, re-throw it.
  }
}
//  下班時間至00 30
const roundTimeOut = (timeStr) => {
  try {
    let [hours, minutes] = timeStr.split(':').map(Number)

    if (minutes > 0 && minutes < 30) {
      minutes = 0
    } else if (minutes >= 30) {
      minutes = 30
    }

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`
  } catch (error) {
    if (error instanceof TypeError) {
      return '18:00'
    }
    throw error // If it's another type of error, re-throw it.
  }
}

const openDialog = (props) => {
  prompt.value = true
  console.log(props)
  editform.value._id = props._id
  editform.value.month = props.month
  editform.value.day = props.day
  editform.value.onClockIn = props.onClockIn
  editform.value.onClockOut = props.onClockOut
  editform.value.editClockIn =
    props.editClockIn || roundTimeIn(props.onClockIn)
  editform.value.editClockOut =
    props.editClockOut || roundTimeOut(props.onClockOut)
  editform.value.overhourfirst = props.overhourfirst
  editform.value.overhoursecond = props.overhoursecond
  editform.value.overhourthird = props.overhourthird
  editform.value.late = props.late
}

watch(select.value, (newValue, oldValue) => {
  console.log(newValue)
  today.value = newValue
  getAllTime()
})

const closeDialog = (props) => {
  prompt.value = false
  editform.value._id = ''
  editform.value.editClockIn = ''
  editform.value.editClockOut = ''
  editform.value.breaktime = false
}
const Submittime = async () => {
  console.log(editform.value)
  await apiAuth.patch('/work/approve/edittime', editform.value)
  await closeDialog()
  await getAllTime()
}

// ----------------------------------------------------------------
function wrapCsvValue (val, formatFn, row2) {
  let formatted = formatFn !== undefined ? formatFn(val, row2) : val

  formatted =
    formatted === undefined || formatted === null ? '' : String(formatted)

  formatted = formatted.split('"').join('""')
  /**
   * Excel accepts \n and \r in strings, but some other CSV parsers do not
   * Uncomment the next two lines to escape new lines
   */
  // .split('\n').join('\\n')
  // .split('\r').join('\\r')

  return `"${formatted}"`
}

async function exportTable () {
  // 總小時

  const content = [
    columns.filter((col) => !col.skip).map((col) => wrapCsvValue(col.label))
  ]
    .concat(
      rows.map((row) =>
        columns
          .filter((col) => !col.skip)
          .map((col) =>
            wrapCsvValue(
              typeof col.field === 'function'
                ? col.field(row)
                : row[col.field === undefined ? col.name : col.field],
              col.format,
              row
            )
          )
          .join(',')
      )
    )
    .join('\r\n')
  const {
    totalHoursFormatted,
    totalLate,
    totalOverhourFirst,
    totalOverhourSecond,
    totalOverhourThird
  } = await hours.calculate(rows)

  const summaryRow = [
    'Total hours:',
    '',
    '',
    '',
    '',
    '',
    '',
    '', // 其他空欄位，數量根據實際情況
    totalHoursFormatted,
    totalLate,
    totalOverhourFirst,
    totalOverhourSecond,
    totalOverhourThird,
    '',
    '' // 其他空欄位
  ].join(',')

  const fullContent = `${content}\r\n${summaryRow}` //

  // 輸出CSV文件的代碼
  const status = exportFile(
    `${rows[0].name}-${route.params.number}-${rows[0].month}月.csv`,
    '\ufeff' + fullContent,
    'text/csv'
  )

  if (status !== true) {
    $q.notify({
      message: '無法下載',
      color: 'negative',
      icon: 'warning'
    })
  }
}
// ----------------------------------------------------------------------
const columns = [
  {
    name: 'name',
    align: 'center',
    label: '名字',
    field: 'name'
  },
  {
    name: 'team',
    align: 'center',
    label: '班別',
    field: 'team'
  },
  {
    name: 'month',
    align: 'center',
    label: '月',
    field: 'month'
  },
  { name: 'day', label: '日', field: 'day', align: 'center', sortable: true },
  {
    name: 'week',
    label: '星期',
    field: 'week',
    align: 'center',
    sortable: true,
    style: 'border-right: 2px solid #ddd'
  },
  {
    name: 'onClockIn',
    label: '打卡上班',
    field: 'onClockIn',
    align: 'center'
  },
  {
    name: 'onClockOut',
    label: '打卡下班',
    field: 'onClockOut',
    align: 'center'
  },
  {
    name: 'editClockIn',
    label: '計算上班',
    field: 'editClockIn',
    align: 'center'
  },
  {
    name: 'editClockOut',
    label: '計算下班',
    field: 'editClockOut',
    align: 'center'
  },
  {
    name: 'hours',
    label: '小時',
    field: 'hours',
    align: 'center'
  },
  {
    name: 'late',
    label: '遲到(分)',
    field: 'late',
    align: 'center'
  },
  {
    name: 'leaveEarly',
    label: '早退(分)',
    field: 'leaveEarly',
    align: 'center'
  },
  {
    name: 'overhourfirst',
    label: '加班1.34(時)',
    field: 'overhourfirst',
    align: 'center',
    style: 'border-left: 2px solid #ddd'
  },
  {
    name: 'overhoursecond',
    label: '加班1.67(時)',
    field: 'overhoursecond',
    align: 'center'
  },
  {
    name: 'overhourthird',
    label: '加班2(時)',
    field: 'overhourthird',
    align: 'center'
  },
  {
    name: 'remark',
    label: '備註',
    field: 'remark',
    align: 'center',
    sortable: true
  },
  {
    name: 'edit',
    align: 'center',
    label: '編輯',
    field: 'edit',
    skip: true
  },
  {
    name: 'updates',
    label: '修改次數',
    field: 'updates',
    align: 'center',
    skip: true
  },
  {
    name: 'updatedby',
    label: '最後修改人',
    field: 'updatedby',
    align: 'center',
    skip: true
  }
]
</script>

<style lang="scss" scoped>
.editform {
  max-width: 1080px;
}

.bordercell {
  border-right: 2px solid #eee;
}
.w-50px {
  width: 50px;
}

.redfont {
  color: red;
}
</style>
