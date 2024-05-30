<template>
  <div class="q-pa-md">
    <h5 class="text-center">請假申請</h5>
    <div class="row w-100 justify-center items-center">
      <q-select
        class="col-xs-12 col-md-6 col-lg-3 q-ma-md"
        outlined
        v-model="form.name"
        label="姓名"
        :options="optionsname"
      />
      <q-input
        class="col-xs-12 col-md-6 col-lg-3 q-ma-md"
        outlined
        v-model="form.number"
        readonly
        label="工號"
      />
      <q-input
        class="col-xs-12 col-md-6 col-lg-3 q-ma-md"
        outlined
        v-model="form.ClockIn"
        mask="##:##"
        label="開始時間"
      />
      <q-input
        class="col-xs-12 col-md-6 col-lg-3 q-ma-md"
        outlined
        v-model="form.ClockOut"
        mask="##:##"
        label="結束時間"
      />
      <q-input
        class="col-xs-12 col-md-6 col-lg-3 q-ma-md"
        outlined
        v-model="form.year"
        label="年"
      />
      <q-input
        class="col-xs-12 col-md-6 col-lg-3 q-ma-md"
        outlined
        v-model="form.month"
        label="月"
      />
      <q-input
        class="col-xs-12 col-md-6 col-lg-3 q-ma-md"
        outlined
        v-model="form.hours"
        label="時長"
      />
      <q-input
        class="col-xs-12 col-md-6 col-lg-3 q-ma-md"
        outlined
        v-model="form.day"
        label="日"
      />
      <q-select
        class="col-xs-12 col-md-6 col-lg-3 q-ma-md"
        outlined
        v-model="form.punchtype"
        label="上/下班"
        :options="leaveoption"
      />
    </div>
    <div class="row justify-center items-center w-100 q-mt-md">
      <q-btn label="送出" color="secondary" @click="submit" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMemberStore } from 'src/stores/member'
import { DateTime } from 'luxon'
import { apiAuth } from 'src/boot/axios'
import { useQuasar } from 'quasar'
// ----------------------------------------------------------------
const today = DateTime.now()
const $q = useQuasar()
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
  day: today.day,
  ClockIn: '',
  ClockOut: '',
  punchtype: '',
  hours: ''
})
const leaveoption = ['事假', '病假', '公假', '喪假']
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
// ----------------------------------------------------------------

const submit = async () => {
  // const start = DateTime.fromFormat(form.value.ClockIn, 'HH:mm')
  // const end = DateTime.fromFormat(form.value.ClockOut, 'HH:mm')
  // const diff = end.diff(start, ['hours', 'minutes'])
  // form.value.hours = diff.hours + ':' + diff.minutes
  try {
    const { data } = await apiAuth.post('/leave/create', form.value)
    console.log(data)
    $q.notify({
      message: data.data.name + '新增請假成功',
      color: 'green-4',
      icon: 'warning',
      position: 'center'
    })
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
