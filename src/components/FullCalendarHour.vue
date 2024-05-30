<script setup>
import { ref, onBeforeMount, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { apiAuth } from 'src/boot/axios'
import { DateTime } from 'luxon'
import { useRoute } from 'vue-router'
import { useHolidayStore } from 'src/stores/workingdate'
import { useMemberStore } from 'src/stores/member'
import { useUserStore } from 'src/stores/users'
import { useHoursStore } from 'src/stores/hours'

const route = useRoute()
const calendarComponent = ref(null)
const today = DateTime.now()
const holiday = useHolidayStore()
const member = useMemberStore()
const user = useUserStore()
const hours = useHoursStore()

onMounted(() => {
  // 当组件挂载后，使用引用访问 FullCalendar 组件
  const calendarApi = calendarComponent.value.getApi()

  // 现在可以使用 calendarApi.gotoDate(), calendarApi.next(), 等等...
  calendarApi.gotoDate(new Date())
})
// --------------------------------------------------------------------
// 轉國定假日進日曆
function transformData (dataArray) {
  return dataArray.map((data) => {
    const year = data.year
    const month = data.month.padStart(2, '0')
    const day = data.day.padStart(2, '0')

    return {
      start: `${year}-${month}-${day}`,
      end: `${year}-${month}-${day}`,
      display: 'background',
      title: data?.description
    }
  })
}
const firstget = async () => {
  const transformedData = transformData(holiday.holidayData)
  const transformData2 = transformData(holiday.manualData)
  const month = selected.value.month
  try {
    const result = await apiAuth.get(`/work/${route.params.number}`)
    const result2 = await apiAuth.get(`/leave/find/${month}/${route.params.number}`)
    const result3 = await apiAuth.post(`/workschedule/month/${route.params.number}`, selected.value)
    if (result.data && Array.isArray(result.data.result)) {
      const events = result.data.result.filter(item => user.team === '人事' || item.team === user.team) // 添加筛选条件
        .map(item => {
          const color = item.onClockIn && item.onClockOut ? 'teal' : 'red'

          return {
            title: '打卡時間' + ` ${item.onClockIn || '?'} > ${item.onClockOut || '?'}`,
            date: `${item.year}-${item.month.padStart(2, '0')}-${item.day.padStart(2, '0')}`,
            color
          }
        })
      const events2 = result2.data.data.map((item) => ({
        title: `請假時間 : ${item.ClockIn} - ${item.ClockOut} 假別:${item.punchtype}`,
        date: `${item.year}-${item.month.padStart(2, '0')}-${item.day.padStart(
          2,
          '0'
        )}`,
        color: 'orange'
      }))
      const events3 = result3.data.data.map((item) => ({
        title: `班表時間 : ${item.ClockIn} - ${item.ClockOut} ${item.team}`,
        date: `${item.year}-${item.month.padStart(2, '0')}-${item.day.padStart(
          2,
          '0'
        )}`,
        color: 'teal'
      }))
      calendarOptions.value.events = events.concat(transformedData, transformData2, events2, events3) // 將events和transformedData兩個陣列合併
    } else {
      console.error('Unexpected data format from API.')
    }
  } catch (err) {
    console.error('Error fetching data from API:', err)
  }
}
const handleDateSelect = async (selectInfo) => {
  console.log(selectInfo.event.startStr)
  hours.editdate = selectInfo.event.startStr
  hours.shouldedit = true
}
const handleDate = async (selectInfo) => {
  console.log(selectInfo.startStr)
  hours.editdate = selectInfo.startStr
  hours.shouldPunchin = true
}
// --------------------------------------------------------------------
onBeforeMount(async () => {
  // await holiday.getjson()
  firstget()
})

const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  events: [],
  locale: 'zh-tw',
  selectable: true,
  select: handleDate,
  eventClick: handleDateSelect,
  headerToolbar: {
    left: 'prev,next today',
    right: 'dayGridMonth'
  }
})
const selected = ref({
  year: today.year,
  month: today.month.toString().padStart(2, '0')
})

const searchmonth = async () => {
  const transformedData = transformData(holiday.holidayData)
  const transformData2 = transformData(holiday.manualData)
  const month = selected.value.month
  try {
    const result = await apiAuth.get(`/work/${route.params.number}`)
    const result2 = await apiAuth.get(`/leave/find/${month}/${route.params.number}`)
    const result3 = await apiAuth.post(`/workschedule/month/${route.params.number}`, selected.value)
    if (result.data && Array.isArray(result.data.result)) {
      const events = result.data.result.filter(item => user.team === '人事' || item.team === user.team) // 添加筛选条件
        .map(item => {
          const color = item.onClockIn && item.onClockOut ? 'teal' : 'red'

          return {
            title: '打卡時間' + ` ${item.onClockIn || '?'} > ${item.onClockOut || '?'}`,
            date: `${item.year}-${item.month.padStart(2, '0')}-${item.day.padStart(2, '0')}`,
            color
          }
        })
      const events2 = result2.data.data.map((item) => ({
        title: `請假時間 : ${item.ClockIn} - ${item.ClockOut} 假別:${item.punchtype}`,
        date: `${item.year}-${item.month.padStart(2, '0')}-${item.day.padStart(
          2,
          '0'
        )}`,
        color: 'orange'
      }))
      const events3 = result3.data.data.map((item) => ({
        title: `班表時間 : ${item.ClockIn} - ${item.ClockOut} ${item.team}`,
        date: `${item.year}-${item.month.padStart(2, '0')}-${item.day.padStart(
          2,
          '0'
        )}`,
        color: 'teal'
      }))
      calendarOptions.value.events = events.concat(transformedData, transformData2, events2, events3) // 將events和transformedData兩個陣列合併
      // 跳轉到選擇的月份
      const selectedDate = `${selected.value.year}-${selected.value.month
    .toString()
    .padStart(2, '0')}-01`
      const calendarApi = calendarComponent.value.getApi()
      calendarApi.gotoDate(selectedDate)
    }
  } catch {
    console.error('Unexpected data format from API.')
  }
}
// const searchyear = async () => {
//   const result = await apiAuth.post(
//     `/work/year/${route.params.number}`,
//     selected.value
//   )
//   const events = result.data.message.map((item) => ({
//     title: `時間 : ${item.editClockIn} - ${item.editClockOut}`,
//     date: `${item.year}-${item.month.padStart(2, '0')}-${item.day.padStart(
//       2,
//       '0'
//     )}`
//   }))
//   const transformedData = transformData(holiday.holidayData)
//   const transformData2 = transformData(holiday.manualData)
//   calendarOptions.value.events = events.concat(transformedData, transformData2)
// }
</script>
<template>
  <div class="w-100 row items-center justify-center">
    <q-input
      filled
      v-model="selected.year"
      label="年"
      class="col-2 q-ma-xs"
    />
    <q-select
      filled
      v-model="selected.month"
      :options="member.monthoption"
      label="月份"
      class="col-2  q-ma-xs"
    />
    <q-btn label="查指定月" class="q-ma-xs" color="primary" @click="searchmonth"></q-btn>
    <!-- <q-btn label="查年" class="q-ma-xs" color="secondary" @click="searchyear"></q-btn> -->
  </div>
  <FullCalendar
    :options="calendarOptions"
    class="w-100"
    ref="calendarComponent"
  />
</template>
