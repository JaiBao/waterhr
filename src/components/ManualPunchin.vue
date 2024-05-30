<template>
  <div class="q-pa-md">
    <h5 class="text-center">補打卡</h5>
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
      <q-btn icon="event" round color="teal-7" class="q-mx-xs">
      <q-popup-proxy cover transition-show="scale" transition-hide="scale" v-model="showDatePicker">
        <q-date v-model="date" mask="YYYY-MM-DD" color="yellow-9" @input="$emit('close')">
          <div class="row items-center justify-end q-gutter-sm">
            <q-btn label="Cancel" color="primary" flat v-close-popup />
          </div>
        </q-date>
      </q-popup-proxy>
    </q-btn>
    </div>
    <div class="row w-100 justify-center items-center">
      <q-input
        class="col q-mx-xs q-my-md q-pb-none"
        outlined
        v-model="form.time"
        mask="time"
      >
        <template v-slot:append>
          <q-icon name="access_time" class="cursor-pointer">
            <q-popup-proxy
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-time v-model="form.time" format24h>
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
        v-model="form.remark"
        label="備註"
      />
    </div>
    <div class="row justify-center items-center w-100 q-mt-md">
      <q-btn label="補上班" color="secondary" @click="submit('上班')" class="q-mx-xs" />
      <q-btn label="補下班" color="primary" @click="submit('下班')" class="q-mx-xs"/>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useMemberStore } from 'src/stores/member'
import { useHoursStore } from 'src/stores/hours'
import { DateTime } from 'luxon'
import { apiAuth } from 'src/boot/axios'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
// ----------------------------------------------------------------
const today = DateTime.now()
const showDatePicker = ref(false)
const date = ref(`${today.year} + '-' +${today.month.toString().padStart(2, '0')} + '-' + ${today.day.toString().padStart(2, '0')}`)
const route = useRoute()
const $q = useQuasar()
const member = useMemberStore()
const hours = useHoursStore()
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
  time: '09:00',
  remark: ''
})
// const punchoption = ['上班', '下班']
// const dateoption = member.dateoption
// const monthoption = member.monthoption
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
// watch date值改變時，同步到form.value.year month day
watch(
  () => date.value,
  (newDate) => {
    form.value.year = newDate.split('-')[0]
    form.value.month = newDate.split('-')[1]
    form.value.day = newDate.split('-')[2]
    showDatePicker.value = false
  }
)

// ----------------------------------------------------------------
onMounted(() => {
  if (route.params.number) {
    form.value.name = member.member.find(
      (item) => item.number === route.params.number
    ).name
    form.value.number = route.params.number
  } else {
    form.value.name = ''
    form.value.number = ''
  }
  form.value.year = hours.editdate.split('-')[0] || today.year
  form.value.month = hours.editdate.split('-')[1] || today.month.toString().padStart(2, '0')
  form.value.day = hours.editdate.split('-')[2] || today.day.toString().padStart(2, '0')
  hours.editdate = ''
  hours.shouldPunchin = false
})
const submit = async (val) => {
  if (val === '上班') {
    form.value.punchtype = '上班'
    member.punched = false
    try {
      const { data } = await apiAuth.post('/work/on', form.value)
      console.log(data)
      $q.notify({
        message: data.data.name + '補上班成功' || data.data,
        color: 'green-4',
        icon: 'warning',
        position: 'center'
      })
      member.punched = true
    } catch (error) {
      $q.notify({
        message: error.response.data.message,
        color: 'negative',
        icon: 'warning',
        position: 'center'
      })
    }
  }
  if (val === '下班') {
    form.value.punchtype = '下班'
    member.punched = false
    try {
      const { data } = await apiAuth.patch('/work/off', form.value)
      $q.notify({
        message: data.data.name + '補下班成功',
        color: 'green-4',
        icon: 'warning',
        position: 'center'
      })
      member.punched = true
    } catch (error) {
      $q.notify({
        message: error.response.data.message,
        color: 'negative',
        icon: 'warning',
        position: 'center'
      })
    }
  }
}
</script>
