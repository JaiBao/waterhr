<script setup>
import { ref, onBeforeMount } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { apiAuth } from 'src/boot/axios'
import { DateTime } from 'luxon'
import { useUserStore } from 'src/stores/users'
import { useMemberStore } from 'src/stores/member'
import { useQuasar } from 'quasar'
// ------------------------------------------------
const today = DateTime.now()
const user = useUserStore()
const member = useMemberStore()
const $q = useQuasar()
const prompt = ref(false)
const confirm = ref(false)
const deleteid = ref('')
const form = ref({
  name: '',
  number: '',
  year: today.year,
  month: today.month.toString().padStart(2, '0'),
  day: '',
  ClockIn: '',
  ClockOut: '',
  team: ''
})
onBeforeMount(async () => {
  firstget()
})
const firstget = async () => {
  const result = await apiAuth.get(
    `/workschedule/month/${today.month.toString().padStart(2, '0')}`
  )
  const events = result.data.message
    .filter((item) => user.team === '人事' || item.team === user.team) // 添加筛选条件
    .map((item) => ({
      id: item._id,
      title: `${item.ClockIn} > ${item.ClockOut}   ${item.name} ${item.team}`,
      date: `${item.year}-${item.month.padStart(2, '0')}-${item.day.padStart(
        2,
        '0'
      )}`
    }))

  calendarOptions.value.events = events
  console.log(events)
}
const handleEventClick = async (clickInfo) => {
  deleteid.value = clickInfo.event._def.publicId
  confirm.value = true
}
// 來處理確認操作
const handleConfirm = async () => {
  try {
    const { data } = await apiAuth.delete(
      `/workschedule/delete/${deleteid.value}`
    )
    $q.notify({
      color: 'green-4',
      textColor: 'white',
      icon: 'cloud_done',
      message: '刪除成功' + data.data.name
    })
  } catch (error) {
    console.log(error)
  }
  confirm.value = false
  deleteid.value = null
  firstget()
}

const selected = ref({
  year: today.year,
  month: today.month.toString().padStart(2, '0')
})
const optionsmonth = member.monthoption
const handleDateSelect = (selectInfo) => {
  form.value.year = selectInfo.start.getFullYear()
  form.value.month = (selectInfo.start.getMonth() + 1)
    .toString()
    .padStart(2, '0')
  form.value.day = selectInfo.start.getDate()
  prompt.value = true
}
const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridWeek',
  events: [],
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek'
  },
  locale: 'zh-tw',
  select: handleDateSelect,
  editable: true,
  selectable: true,
  eventClick: handleEventClick,
  currentEvents: []
})

const searchmonth = async () => {
  const result = await apiAuth.get(
    `/workschedule/month/${selected.value.month}`
  )

  const events = result.data.message
    .filter((item) => user.team === '人事' || item.team === user.team) // 添加筛选条件
    .map((item) => ({
      title: `${item.ClockIn} > ${item.ClockOut}   ${item.name} ${item.place}`,
      date: `${item.year}-${item.month.padStart(2, '0')}-${item.day.padStart(
        2,
        '0'
      )}`
    }))

  calendarOptions.value.events = events
}
const searchyear = async () => {
  const result = await apiAuth.get(`/workschedule/year/${selected.value.year}`)
  const events = result.data.message
    .filter((item) => user.team === '人事' || item.team === user.team) // 添加筛选条件
    .map((item) => ({
      title: `${item.ClockIn} > ${item.ClockOut}   ${item.name} ${item.place}`,
      date: `${item.year}-${item.month.padStart(2, '0')}-${item.day.padStart(
        2,
        '0'
      )}`
    }))

  calendarOptions.value.events = events
}
// ---------------------------------------
const upload = async () => {
  try {
    const { data } = await apiAuth.post('/workschedule/add', form.value)
    console.log(data)
    $q.notify({
      color: 'green-4',
      textColor: 'white',
      icon: 'cloud_done',
      message: '新增成功' + data.data.name
    })
    prompt.value = false
    firstget()
  } catch (error) {
    console.log(error)
    $q.notify({
      color: 'red-4',
      textColor: 'white',
      icon: 'cloud_done',
      message: error
    })
  }
}
// ---------------------------------------------------------
const menuName = ref(false)
const menuNumber = ref(false)
const optionsmember = ref([])
member.getMember().then(() => {
  member.member.forEach((item, index) => {
    optionsmember.value.push({
      id: index,
      name: item.name,
      number: item.number
    })
  })
})
const copyname = (val) => {
  form.value.name = val.name
  form.value.number = val.number
  menuName.value = false
}
const copynumber = (val) => {
  form.value.name = val.name
  form.value.number = val.number
  menuNumber.value = false
}
// --------------------------------------------
const options = ref([])
const getteam = async () => {
  const result = await apiAuth.get('/users/team')
  options.value = result.data
}
getteam()
</script>
<template>
  <div class="q-pa-md w-100 row items-center justify-center">
    <q-input filled v-model="selected.year" label="year" class="w-25 q-ma-xs" />
    <q-select
      filled
      v-model="selected.month"
      :options="optionsmonth"
      label="month"
      class="w-25 q-ma-xs"
    />
    <q-btn label="查指定月" class="q-ma-xs" @click="searchmonth"></q-btn>
    <q-btn label="查年" class="q-ma-xs" @click="searchyear"></q-btn>
  </div>
  <FullCalendar :options="calendarOptions" class="w-100" />
  <q-dialog v-model="prompt" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="row w-100 items-center">
          <div class="col q-mx-xs">
            <div class="text-h6">姓名</div>
            <q-input outlined v-model="form.name">
              <template v-slot:append>
                <q-btn-dropdown
                  menu-anchor="bottom start"
                  color="teal"
                  size=".5rem"
                  dropdown-icon="change_history"
                  v-model="menuName"
                >
                  <q-list>
                    <q-item
                      v-for="member of optionsmember"
                      :key="member.id"
                      clickable
                      @click="copyname(member)"
                    >
                      {{ member.name }}
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </template>
            </q-input>
          </div>
          <div class="col q-mx-xs">
            <div class="text-h6">工號</div>
            <q-input outlined v-model="form.number" >
              <template v-slot:append>
                <q-btn-dropdown
                  menu-anchor="bottom start"
                  color="teal"
                  size=".5rem"
                  dropdown-icon="change_history"
                  v-model="menuNumber"
                >
                  <q-list>
                    <q-item
                      v-for="member of optionsmember"
                      :key="member.id"
                      clickable
                      @click="copynumber(member)"
                    >
                      {{ member.number }}
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </template>
              </q-input>
          </div>
        </div>
        <div class="row w-100 items-center">
          <div class="col q-mx-xs">
            <div class="text-h6">年</div>
            <q-input outlined v-model="form.year" />
          </div>
          <div class="col q-mx-xs">
            <div class="text-h6">月</div>
            <q-input outlined v-model="form.month" />
          </div>
          <div class="col q-mx-xs">
            <div class="text-h6">日</div>
            <q-input outlined v-model="form.day" />
          </div>
        </div>
        <div class="row w-100 items-center">
          <div class="col q-mx-xs">
            <div class="text-h6">上班</div>
            <q-input outlined v-model="form.ClockIn" />
          </div>
          <div class="col q-mx-xs">
            <div class="text-h6">下班</div>
            <q-input outlined v-model="form.ClockOut" />
          </div>
          <div class="col q-mx-xs">
            <div class="text-h6">組別</div>
            <q-select outlined v-model="form.team" :options="options" />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn label="取消" v-close-popup color="red" />
        <q-btn label="增加" v-close-popup @click="upload()" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="confirm">
    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">你確定要刪除?</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn flat label="Yes" color="primary" @click="handleConfirm()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
