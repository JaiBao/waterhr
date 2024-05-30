<template>
  <div class="q-pa-md">
    <h5 class="text-center">請假申請</h5>
    <div class="row w-100 justify-center items-center">
      <q-select
        class="col q-mx-xs q-my-md"
        outlined
        v-model="form.name"
        label="姓名"
        :options="optionsname"
      />
      <q-input
        class="col q-mx-xs q-my-md"
        outlined
        v-model="form.number"
        readonly
        label="工號"
      />
    </div>
    <div class="row w-100 justify-center items-center">
      <q-input
        class="col q-mx-xs q-my-md"
        outlined
        v-model="form.ClockIn"
        mask="time"
        label="開始時間"
      >
        <template v-slot:append>
          <q-icon name="access_time" class="cursor-pointer">
            <q-popup-proxy
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-time v-model="form.ClockIn" format24h>
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-time>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
      <q-input
        class="col q-mx-xs q-my-md"
        outlined
        v-model="form.ClockOut"
        mask="time"
        label="結束時間"
      >
        <template v-slot:append>
          <q-icon name="access_time" class="cursor-pointer">
            <q-popup-proxy
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-time v-model="form.ClockOut" format24h>
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-time>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>
    <div class="row w-100 justify-center items-center">
      <q-input
        class="col q-mx-xs q-my-md"
        outlined
        v-model="form.year"
        label="年"
      />
      <q-input
        class="col q-mx-xs q-my-md"
        outlined
        v-model="form.month"
        label="月"
      />
      <q-input
        class="col q-mx-xs q-my-md"
        outlined
        v-model="form.day"
        label="日"
      />
      <q-btn icon="event" round color="primary" class="q-mx-xs">
      <q-popup-proxy  cover transition-show="scale" transition-hide="scale" v-model="datePicker">
        <q-date v-model="date" color="teal-4" mask="YYYY-MM-DD">
          <div class="row items-center justify-end q-gutter-sm">
            <q-btn label="Cancel" color="primary" flat v-close-popup />
          </div>
        </q-date>
      </q-popup-proxy>
    </q-btn>
    </div>
    <div class="row w-100 justify-center items-center">
      <q-input
        class="col q-mx-xs q-my-md"
        outlined
        v-model="form.hours"
        label="時長(小時)"
      />

      <q-select
        class="col q-mx-xs q-my-md"
        outlined
        v-model="form.punchtype"
        label="假別"
        :options="leaveoption"
      />
    </div>
    <div class="row justify-center items-center w-100 q-mt-md">
      <q-btn label="計算" @click="calculate" color="info" class="q-mx-xs" />
      <q-btn label="送出" color="secondary" @click="submit" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useMemberStore } from 'src/stores/member'
import { DateTime } from 'luxon'
import { apiAuth } from 'src/boot/axios'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
// ----------------------------------------------------------------
const today = DateTime.now()
const $q = useQuasar()
const route = useRoute()
const datePicker = ref(false)
const date = ref(`${today.year}-${today.month.toString().padStart(2, '0')}-${today.day.toString().padStart(2, '0')}`)
const member = useMemberStore()
member.getMember().then(() => {
  member.member.forEach((item) => {
    optionsname.value.push(item.name)
  })
})
const optionsname = ref([])
const form = ref({
  name: '',
  number: '',
  year: today.year,
  month: today.month.toString().padStart(2, '0'),
  day: today.day.toString().padStart(2, '0'),
  ClockIn: '',
  ClockOut: '',
  punchtype: '',
  hours: ''
})
const leaveoption = member.leaveoption
// ----------------------------------------------------------------
watch(
  () => form.value.name,
  (newName) => {
    const foundMember = member.member.find((item) => item.name === newName)
    if (foundMember) {
      form.value.number = foundMember.number
    }
  }
)
const calculate = () => {
  const start = DateTime.fromFormat(form.value.ClockIn, 'HH:mm')
  const end = DateTime.fromFormat(form.value.ClockOut, 'HH:mm')
  const diff = end.diff(start, ['hours', 'minutes'])

  // 轉換為小數小時
  const decimalHours = diff.hours + (diff.minutes / 60)

  form.value.hours = decimalHours.toFixed(2) // 將結果四捨五入到小數點後一位
}
watch(
  () => date.value,
  () => {
    form.value.year = date.value.split('-')[0]
    form.value.month = date.value.split('-')[1]
    form.value.day = date.value.split('-')[2]
    datePicker.value = false
  }
)
// ----------------------------------------------------------------
onMounted(() => {
  form.value.number = route.params.number
  form.value.name = member.member.find(
    (item) => item.number === route.params.number
  ).name
})
const submit = async () => {
  if (!form.value.hours) {
    $q.notify({
      message: '請先按計算, 再按送出',
      color: 'negative',
      icon: 'warning',
      position: 'center'
    })
    return
  }
  try {
    member.leaved = false
    const { data } = await apiAuth.post('/leave/create', form.value)
    console.log(data)
    $q.notify({
      message: data.data.name + '新增請假成功',
      color: 'green-4',
      icon: 'warning',
      position: 'center'
    })
    member.leaved = true
  } catch (error) {
    $q.notify({
      message: error.response.data.message,
      color: 'negative',
      icon: 'warning',
      position: 'center'
    })
  }
}
</script>
