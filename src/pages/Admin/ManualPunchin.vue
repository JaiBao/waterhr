<template>
  <div class="q-pa-md">
    <h5 class="text-center">補打卡</h5>
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
        v-model="form.time"
        mask="##:##"
        label="時間"
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
        v-model="form.day"
        label="日"
      />
      <q-select
        class="col-xs-12 col-md-6 col-lg-3 q-ma-md"
        outlined
        v-model="form.punchtype"
        label="上/下班"
        :options="punchoption"
      />
    </div>
    <div class="row justify-center items-center w-100 q-mt-md">
      <q-btn label="送出" color="secondary" @click="submit" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useMemberStore } from 'src/stores/member'
import { DateTime } from 'luxon'
import { apiAuth } from 'src/boot/axios'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
// ----------------------------------------------------------------
const today = DateTime.now()
const route = useRoute()
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
  time: '09:00',
  punchtype: ''
})
const punchoption = ['上班', '下班']
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
onMounted(() => {
  form.value.number = route.params.number
  form.value.name = member.member.find((item) => item.number === route.params.number)
})
const submit = async () => {
  if (form.value.punchtype === '上班') {
    try {
      const { data } = await apiAuth.post('/work/on', form.value)
      console.log(data)
      $q.notify({
        message: data.data.name + '補打卡成功',
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
  if (form.value.punchtype === '下班') {
    try {
      const { data } = await apiAuth.patch('/work/off', form.value)
      $q.notify({
        message: data.data.name + '補打卡成功',
        color: 'green-4',
        icon: 'warning',
        position: 'center'
      })
    } catch (error) {

    }
  }
}
</script>
