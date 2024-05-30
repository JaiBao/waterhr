<template>
  <div class="q-pa-md w-100 row items-center justify-center">
    <q-table
      :rows="rows"
      :columns="columns"
      :row-key="rowkey"
      class="w-100 my-sticky-header-table"
      :filter="filters"
      :rows-per-page-options="[0]"
    >
      <template v-slot:top>
        <q-input
          filled
          v-model="selected.year"
          label="年"
          class="col-1 q-ma-xs"
          />
        <q-select
          filled
          v-model="selected.month"
          :options="optionsmonth"
          label="月份"
          class="col-1 q-ma-xs"
        />
        <q-btn
          label="當月"
          color="primary"
          class="col-1 q-mx-xs"
          @click="reset"
        />
        <q-input
          v-if="rowkey === 'name'"
          outlined
          v-model="filtername"
          label="姓名"
          class="col q-mx-md nameselect"
          clearable
        >
          <template v-slot:append>
            <q-btn-dropdown
              outline
              color="teal"
              size="md"
              dropdown-icon="change_history"
            >
              <q-list>
                <q-item
                  v-for="member of optionsmember"
                  :key="member.id"
                  clickable
                  @click="copyname(member.name)"
                  ><q-item-section avatar></q-item-section>
                  <q-item-section>
                    {{ member.name }}
                  </q-item-section>
                  <q-item-section avatar></q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </template>
        </q-input>
        <q-input
          v-if="rowkey === 'number'"
          outlined
          v-model="filternumber"
          label="工號"
          clearable
          clear-icon="close"
          class="col q-mx-md nameselect"
        >
          <template v-slot:append>
            <q-btn-dropdown outline color="teal" size="md">
              <q-list>
                <q-item
                  v-for="member of member.member"
                  :key="member.id"
                  clickable
                  @click="copynumber(member.number)"
                >
                  <q-item-section avatar></q-item-section>
                  <q-item-section> {{ member.number }}</q-item-section>
                  <q-item-section avatar></q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </template>
        </q-input>

        <q-btn
          v-if="rowkey === 'name'"
          color="yellow-10"
          label="改查工號"
          @click="findnumber"
        />
        <q-btn
          v-if="rowkey === 'number'"
          color="yellow-10"
          label="改查姓名"
          @click="findname"
        />
        <div class="column">
          <q-btn
            color="primary"
            icon="archive"
            label="下載總工時"
            @click="exportTable"
            class="q-mx-xs"
          />
        </div>
        <q-btn
          color="primary"
          icon="archive"
          label="下載詳細工時"
          @click="download"
          class="q-mx-xs"
        />
        <!-- <q-btn
      color="primary"
      icon="ios_share"
      label="下載全部"
      @click="downloadxlsx"
      class="q-mx-xs"
    /> -->
        <q-btn
          color="info"
          icon="ios_share"
          label="以日編輯"
          to="/admin/day"
          class="q-mx-xs"
        />
        <q-btn color="grey-9" class="q-mx-md" rounded>
          ?
          <q-tooltip class="bg-indigo" :offset="[10, 10]">
            <div class="fs-20">
              右方為當月應上班天數編輯區 <br />
              如當月未新增過,請填入天數後按下新增 <br />
              如已新增天數需修改,請輸入天數後按下修改
            </div>
          </q-tooltip>
        </q-btn>
        <q-input
          label="應上班天數"
          v-model="dutydaysShow"
          outlined
          class="q-mx-xs col-1 dutydayselect"
        />
        <div class="column">
          <q-btn color="teal-4" @click="adddays" class="q-mx-xs" label="新增" />
          <q-btn
            color="green-4"
            @click="editdays"
            class="q-mx-xs"
            label="修改"
          />
        </div>
      </template>
      <!-- <template v-slot:body-cell-actions="props">
        <q-td class="text-center q-gutter-sm">
          <q-btn
            icon="mdi-calculator"
            color="info"
            fab-mini
            unelevated
            size="sm"
            @click="openDialog(props.row)"
          />
        </q-td>
      </template> -->
      <template v-slot:body-cell-seeall="props">
        <q-td class="text-center q-gutter-sm">
          <q-btn
            icon="menu"
            color="info"
            fab-mini
            unelevated
            size="sm"
            @click="selectworker(props.row.number)"
          >
          </q-btn>
        </q-td>
      </template>
      <template v-slot:body-cell-depart="props">
        <q-td class="text-center q-gutter-sm">
          {{ findDepart(props.row.number) }}
        </q-td>
      </template>
    </q-table>
  </div>
  <div class="row w-100 items-center justify-center"></div>
  <div class="row w-100 justify-center"></div>
</template>

<script setup>
import { ref, reactive, watch, onBeforeMount, onMounted } from 'vue'
import { apiAuth } from 'src/boot/axios'
import { DateTime } from 'luxon'
import { useRouter } from 'vue-router'
import { exportFile, useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/users'
import { useMemberStore } from 'src/stores/member'
import { useDutyStore } from 'src/stores/dutydays'
import { useHoursStore } from 'src/stores/hours'
import Papa from 'papaparse'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import iconv from 'iconv-lite'
import * as XLSX from 'xlsx'
// ----------------------------------------------------------------
const user = useUserStore()
const member = useMemberStore()
const duty = useDutyStore()
const hours = useHoursStore()
const router = useRouter()
const $q = useQuasar()
const date = ref([])
const rows = reactive([])
const today = DateTime.now()
const filtername = ref('')
// eslint-disable-next-line
let filters = ref(filtername);
const filternumber = ref('')
const rowkey = ref('name')
const selected = ref({
  month: today.month.toString().padStart(2, '0'),
  year: today.year
})
// const dialog = ref(false)
const optionsmonth = member.monthoption
const optionsmember = ref([])

const copyname = (val) => {
  filtername.value = val
}
const copynumber = (val) => {
  filternumber.value = val
}

const dutydaysShow = ref(0)

const selectworker = (val) => {
  duty.month = selected.value.month
  duty.year = selected.value.year
  duty.shouldChangeMonth = true
  router.push(`/admin/hours/${val}`)
}

const findDepart = (val) => {
  const find = member.member.find((item) => item.number === val)
  return find && find.depart ? find.depart : ''
}

// ----------------------------------------------------------------
// const calculateform = ref({
//   name: '',
//   number: '',
//   count: '',
//   hours: '',
//   overtime8to10: '',
//   overtimeOver10: '',
//   breakday: 0,
//   holiday: 0
// })
const reset = () => {
  selected.value.month = today.month.toString().padStart(2, '0')
}
// ----------------------------------------------------------------
const columns = [
  {
    name: 'seeall',
    label: '看他',
    field: 'seeall',
    align: 'center',
    sortable: false,
    skip: true
  },
  {
    name: 'number',
    align: 'center',
    label: '工號',
    field: 'number',
    sortable: true
  },
  {
    name: 'name',
    align: 'center',
    label: '姓名',
    field: 'name',
    sortable: true
  },
  {
    name: 'team',
    align: 'center',
    label: '組別',
    field: 'team',
    sortable: true
  },
  {
    name: 'depart',
    align: 'center',
    label: '部門',
    field: 'depart',
    sortable: true
  },
  {
    name: 'dutydays',
    align: 'center',
    label: '應上班天數',
    field: 'dutydays',
    sortable: true
  },
  {
    name: 'count',
    align: 'center',
    label: '總工作天數',
    field: 'count',
    sortable: true
  },
  {
    name: 'hours',
    align: 'center',
    label: '總工作時數',
    field: 'hours',
    sortable: true
  },
  {
    name: 'late',
    align: 'center',
    label: '遲到(分鐘)',
    field: 'late',
    sortable: true,
    style: 'border-right: 2px solid #ddd'
  },
  {
    name: 'overhours',
    align: 'center',
    label: '總加班時數(小時)',
    field: 'overhours',
    sortable: true
  },
  {
    name: 'overhourfirst',
    align: 'center',
    label: '加班1.34',
    field: 'overhourfirst',
    sortable: true
  },
  {
    name: 'overhoursecond',
    align: 'center',
    label: '加班1.67',
    field: 'overhoursecond',
    sortable: true
  },
  {
    name: 'overhourthird',
    align: 'center',
    label: '加班2',
    field: 'overhourthird',
    sortable: true
  }
  // {
  //   name: 'actions',
  //   label: '試算',
  //   field: 'actions',
  //   align: 'center',
  //   sortable: false
  // },

]
// ----------------------------------------------------------------------
const getAllTime = async () => {
  const result = await apiAuth.get(`/work/month/${selected.value.year}/${selected.value.month}`)
  const userTeam = user.team // 假设你已经获取到了用户所在的团队
  const dutydays = duty.dutydays
  let filteredRecords = result.data.message
  if (userTeam !== '人事') {
    filteredRecords = filteredRecords.filter(
      (record) => record.team === userTeam
    )
  }
  date.value = filteredRecords
  const uniqueNamesSet = new Set(filteredRecords.map((record) => record.name))
  const uniqueNames = Array.from(uniqueNamesSet)
  uniqueNames.forEach((name) => {
    const recordsOfThisName = filteredRecords.filter(
      (record) => record.name === name
    )
    const validRecordsOfThisName = recordsOfThisName.filter((record) => {
      const hoursMinutes = record.hours.split(':')
      return (
        hoursMinutes.length === 2 &&
        !isNaN(hoursMinutes[0]) &&
        !isNaN(hoursMinutes[1])
      )
    })

    let totalOverhours = 0
    let totalOverhourFirst = 0
    let totalOverhourSecond = 0
    let totalOverhourThird = 0
    let late = 0
    validRecordsOfThisName.forEach((record) => {
      const overhourfirst = parseFloat(record.overhourfirst) || 0
      const overhoursecond = parseFloat(record.overhoursecond) || 0
      const overhourthird = parseFloat(record.overhourthird) || 0
      const lateValue = parseInt(record.late) || 0

      totalOverhours += overhourfirst + overhoursecond + overhourthird
      totalOverhourFirst += overhourfirst
      totalOverhourSecond += overhoursecond
      totalOverhourThird += overhourthird
      late += lateValue
    })
    const totalHoursMinutes = validRecordsOfThisName.reduce(
      (sum, record) => {
        const [hours, minutes] = record.hours.split(':').map(Number)
        return [sum[0] + hours, sum[1] + minutes]
      },
      [0, 0]
    )

    // 將超過 60 分鐘的時間轉為小時
    let [totalHours, totalMinutes] = totalHoursMinutes
    totalHours += Math.floor(totalMinutes / 60)
    totalMinutes = totalMinutes % 60
    const totalHoursDecimal = totalHours + totalMinutes / 60
    // const formattedHours = String(totalHours).padStart(2, '0')
    // const formattedMinutes = String(totalMinutes).padStart(2, '0')
    if (
      recordsOfThisName[0].team === '早班' ||
      recordsOfThisName[0].team === '晚班' ||
      recordsOfThisName[0].team === '外籍'
    ) {
      pushRow(
        recordsOfThisName,
        totalHoursDecimal,
        dutydays,
        totalOverhours,
        totalOverhourFirst,
        totalOverhourSecond,
        totalOverhourThird,
        late
      )
    } else {
      pushRow(
        recordsOfThisName,
        totalHoursDecimal,
        null,
        totalOverhours,
        totalOverhourFirst,
        totalOverhourSecond,
        totalOverhourThird,
        late
      )
    }
  })
  // console.log(rows)
  dutydaysShow.value = duty.dutydays
}
// ---------------------------------------------------------
function pushRow (
  records,
  totalHoursDecimal,
  dutydaysValue = null,
  totalOverhours,
  totalOverhourFirst,
  totalOverhourSecond,
  totalOverhourThird,
  late
) {
  const row = {
    name: records[0].name,
    number: records[0].number,
    count: records.length,
    hours: totalHoursDecimal,
    overhours: totalOverhours,
    overhourfirst: totalOverhourFirst,
    overhoursecond: totalOverhourSecond,
    overhourthird: totalOverhourThird,
    team: records[0].team,
    depart: findDepart(records[0].number),
    late
  }
  if (dutydaysValue) {
    if (row.team === '早班' || row.team === '晚班') {
      row.dutydays = dutydaysValue
    } else if (row.team === '外籍') {
      row.dutydays = 22
    }
  }
  rows.push(row)
}

// ------------------------------------------------

// ----------------------------------------------------
watch(selected.value, async () => {
  if (selected.value.year.length !== 4) {
    return
  }
  rows.splice(0, rows.length)
  await duty.getdutyDays(selected.value.year, selected.value.month)
  dutydaysShow.value = duty.dutydays
  await getAllTime()
})
const findnumber = () => {
  rowkey.value = 'number'
  filters = filternumber
}
const findname = () => {
  rowkey.value = 'name'
  filters = filtername
}

// ----------------------------------------------------
const adddays = async () => {
  try {
    const { data } = await apiAuth.post('/dutydays/create', {
      year: selected.value.year,
      days: dutydaysShow.value,
      month: selected.value.month
    })
    console.log(data.data)
    $q.notify({
      message:
        '已新增' + data.data.month + '月份的應上班天數為' + data.data.day,
      color: 'info',
      icon: 'warning',
      position: 'center'
    })
  } catch (error) {
    console.log(error)
    $q.notify({
      message: error.message,
      color: 'warning',
      icon: 'warning',
      position: 'center'
    })
  }
}
const editdays = async () => {
  try {
    const { data } = await apiAuth.patch(`/dutydays/edit/${selected.value}`, {
      year: today.year,
      days: dutydaysShow.value
    })
    console.log(data.data)
    $q.notify({
      message:
        '已修改' + data.data.month + '月份的應上班天數為' + data.data.day,
      color: 'info',
      icon: 'warning',
      position: 'center'
    })
  } catch (error) {
    console.log(error)
    $q.notify({
      message: error.message,
      color: 'warning',
      icon: 'warning',
      position: 'center'
    })
  }
}
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

function exportTable () {
  const content = [
    columns
      .filter((col) => !col.skip) // 僅包括 skip 不為 true 的列
      .map((col) => wrapCsvValue(col.label))
  ]
    .concat(
      rows.map((row) =>
        columns
          .filter((col) => !col.skip) // 僅包括 skip 不為 true 的列
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

  // 导出CSV文件的代码
  const status = exportFile('總時數表.csv', '\ufeff' + content, 'text/csv')

  if (status !== true) {
    $q.notify({
      message: '無法下載',
      color: 'negative',
      icon: 'warning'
    })
  }
}
// ---------------------------------------------------
// ---------------------------------------------------
// 定義中文標題與欄位對應關係
const fieldMapping = {
  name: '姓名',
  number: '工號',
  depart: '部門',
  month: '月',
  day: '日',
  onClockIn: '上班打卡',
  onClockOut: '下班打卡',
  editClockIn: '計算上班',
  editClockOut: '計算下班',
  hours: '時數',
  late: '遲到(分)',
  overhourfirst: '加班1.34(小時)',
  overhoursecond: '加班1.67(小時)',
  overhourthird: '加班2(小時)',
  remark: '備註'
}
// ----------------------------------------------
const prepareRows = async (groupedData, includeColumns, fieldMapping) => {
  const preparedRows = {}
  for (const name of Object.keys(groupedData)) {
    const rows = groupedData[name].map((item) => {
      const filteredItem = {}
      includeColumns.forEach((column) => {
        filteredItem[column] = item[column]
      })
      return filteredItem
    })

    const {
      totalHoursDecimal,
      totalLate,
      totalOverhourFirst,
      totalOverhourSecond,
      totalOverhourThird
    } = await hours.calculate(rows)

    rows.push({
      name: 'Total',
      hours: totalHoursDecimal,
      late: totalLate,
      overhourfirst: totalOverhourFirst,
      overhoursecond: totalOverhourSecond,
      overhourthird: totalOverhourThird
    })

    preparedRows[name] = rows
  }
  return preparedRows
}
// =----------------------------------------
const download = async () => {
  const { data } = await apiAuth.get(`/work/month/${selected.value.year}/${selected.value.month}`)
  const groupedData = {}
  data.message.forEach((item) => {
    const name = item.name
    if (!groupedData[name]) {
      groupedData[name] = []
    }
    groupedData[name].push(item)
  })
  for (const name in groupedData) {
    const records = groupedData[name]
    const year = selected.value.year
    const month = selected.value.month

    // 建立一個存儲已經存在的日期的集合
    const existingDays = new Set(records.map((record) => record.day))

    for (let day = 1; day <= 31; day++) {
      // 假設每個月最多31天
      const dayStr = day.toString().padStart(2, '0') // 轉換為 '01', '02', ..., '31'
      if (!existingDays.has(dayStr)) {
        // 如果該天數不存在，則新增預設的紀錄
        const defaultRecord = createDefaultRecord(
          name,
          records.number,
          year,
          month,
          dayStr
        )
        groupedData[name].push(defaultRecord)
      }
    }

    // 如果需要按日期排序
    groupedData[name].sort((a, b) => a.day - b.day)
  }
  const includeColumns = [
    'name',
    'number',
    'month',
    'day',
    'depart',
    'onClockIn',
    'onClockOut',
    'editClockIn',
    'editClockOut',
    'hours',
    'late',
    'overhourfirst',
    'overhoursecond',
    'overhourthird',
    'remark'
  ]

  const preparedRows = await prepareRows(groupedData, includeColumns)
  const zip = new JSZip()

  // Generate CSV files
  for (const name of Object.keys(preparedRows)) {
    const rows = preparedRows[name]
    const csv = Papa.unparse({
      fields: Object.keys(fieldMapping).map((key) => fieldMapping[key]),
      data: rows.map((row) => {
        const newRow = {}
        Object.keys(row).forEach((key) => {
          newRow[fieldMapping[key]] = row[key]
        })
        return newRow
      })
    })
    const csvBuffer = iconv.encode(csv, 'big5')
    zip.file(`${name}-${selected.value.month}月.csv`, csvBuffer)
  }

  // Generate XLSX files
  const wb = XLSX.utils.book_new()
  for (const name of Object.keys(preparedRows)) {
    const rows = preparedRows[name].map((row) => {
      const newRow = {}
      Object.keys(row).forEach((key) => {
        newRow[fieldMapping[key]] = row[key]
      })
      return newRow
    })
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: Object.keys(fieldMapping).map((key) => fieldMapping[key]),
      skipHeader: false
    })
    XLSX.utils.book_append_sheet(wb, ws, name)
  }

  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  zip.file(`${selected.value.month}月總表.xlsx`, xlsxBuffer)

  // Generate ZIP file and trigger download
  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `${selected.value.month}月.zip`)
}
// ---------------------------------------------------------------------

// const downloadxlsx = async (data) => {
//   const groupedData = {}
//   data.message.forEach((item) => {
//     const name = item.name
//     if (!groupedData[name]) {
//       groupedData[name] = []
//     }
//     groupedData[name].push(item)
//   })
//   const wb = XLSX.utils.book_new() // 新建工作簿
//   const includeColumns = ['name', 'number', 'month', 'day', 'onClockIn', 'onClockOut', 'editClockIn', 'editClockOut', 'hours', 'late', 'overhourfirst', 'overhoursecond', 'overhourthird', 'remark']
//   // 將分類後的數據轉為CSV並添加到壓縮檔案中
//   for (const name of Object.keys(groupedData)) {
//     const rows = groupedData[name].map((item) => {
//       const filteredItem = {}
//       includeColumns.forEach((column) => {
//         filteredItem[column] = item[column]
//       })
//       return filteredItem
//     })
//     // 使用你的calculate函數計算統計數據
//     const {
//       totalHoursFormatted,
//       totalLate,
//       totalOverhourFirst,
//       totalOverhourSecond,
//       totalOverhourThird
//     } = await hours.calculate(rows)
//     rows.push({
//       name: 'Total',
//       hours: totalHoursFormatted,
//       late: totalLate,
//       overhourfirst: totalOverhourFirst,
//       overhoursecond: totalOverhourSecond,
//       overhourthird: totalOverhourThird
//     })
//     // const csv = Papa.unparse({
//     //   fields: Object.keys(fieldMapping).map(key => fieldMapping[key]),
//     //   data: rows.map(row => {
//     //     const newRow = {}
//     //     Object.keys(row).forEach(key => {
//     //       newRow[fieldMapping[key]] = row[key]
//     //     })
//     //     return newRow
//     //   })
//     // })
//     const ws = XLSX.utils.json_to_sheet(rows) // 將JSON數據轉換為工作表
//     XLSX.utils.book_append_sheet(wb, ws, name) // 將工作表添加到工作簿，並命名為 `name`
//   }

//   // 寫入文件
//   XLSX.writeFile(wb, `${selected.value}月.xlsx`)
// }
// ---------------------------------------------------------
const createDefaultRecord = (name, number, year, month, day) => {
  return {
    _id: '',
    name,
    number,
    year,
    month,
    day,
    depart: '',
    onClockIn: '',
    onClockOut: '',
    editClockIn: '',
    editClockInStatus: false,
    editClockOut: '',
    editClockOutStatus: false,
    hours: '',
    holiday: false,
    break: false,
    overhourfirst: '',
    overhoursecond: '',
    overhourthird: '',
    late: 0,
    lateEdit: false,
    state: '',
    team: '',
    remark: '',
    updates: []
  }
}
onBeforeMount(async () => {
  member.getMember().then(() => {
    member.member.forEach((item, index) => {
      optionsmember.value.push({
        id: index,
        name: item.name,
        number: item.number,
        depart: item?.depart
      })
    })
  })
})
onMounted(async () => {
  await duty.getdutyDays(selected.value.year, selected.value.month)
  await getAllTime()
  dutydaysShow.value = duty.dutydays
})
</script>

<style lang="scss" scoped>
.my-sticky-header-table {
  /* height or max-height is important */
  max-height: 1080px;

  .q-table__top,
  thead tr:first-child th {
    /* bg color is important for th; just specify one */
    background-color: #fff;
  }

  thead tr th {
    position: sticky;
    z-index: 1;
  }

  thead tr:first-child th {
    top: 0;
  }

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th {
    /* height of all previous header rows */
    top: 48px;
  }

  /* prevent scrolling behind sticky top row on focus */
  tbody {
    /* height of all previous header rows */
    scroll-margin-top: 48px;
  }
}

.dutydayselect {
  max-width: 100px;
}
.nameselect {
  max-width: 200px;
}
.fs-20 {
  font-size: 20px;
}
</style>
