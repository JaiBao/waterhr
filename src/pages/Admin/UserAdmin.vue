<template>
  <div class="q-pa-md">
    <q-table
      title="用戶資料   最高權限:人事"
      :rows="rows"
      :columns="columns"
      row-key="name"
      :filter="filter"
      :rows-per-page-options="[0]"
    >
      <template v-slot:top-right>
        <div class="row w-100">
          <q-input outlined v-model="filter" placeholder="姓名" class="col-12" clearable clear-icon="close">
            <template v-slot:append>
              <q-btn-dropdown color="primary" rounded class="w-32px">
                <q-list class="w-250px">
                  <q-item class="item"
                  clickable
                  v-for="member of memberOptions" :key="member.id" @click="add(member.name)">
                  {{ member.name }}
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </template>
            </q-input>
        </div>
      </template>
      <template v-slot:body-cell-edit="props">
        <q-td class="text-center q-gutter-sm">
          <q-btn
            icon="mdi-pencil"
            color="info"
            fab-mini
            unelevated
            size="sm"
            @click="openDialog(props.row)"
          />
        </q-td>
      </template>
      <template v-slot:body-cell-delete="props">
        <q-td class="text-center q-gutter-sm">
          <q-btn
            icon="delete"
            color="red"
            fab-mini
            unelevated
            size="md"
            @click="deleteuser(props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </div>
  <!-- ---------------------------------- -->
  <q-dialog v-model="prompt" full-width>
    <q-card class="w-100">
      <q-card-section>
        <div class="row w-100">
          <div class="col-4">
            <div class="text-h6">_id</div>
            <q-input
              outlined
              readonly
              v-model="accountForm._id"
              autofocus
              class="q-mr-md q-my-xl"
            />
          </div>
        </div>
        <div class="row w-100 items-center q-my-lg">
          <div class="col-4">
            <div class="text-h6">名字</div>
            <q-input
              outlined
              v-model="accountForm.name"
              autofocus
              class="q-mr-md"
            />
          </div>
          <div class="col-4">
            <div class="text-h6">工號</div>
            <q-input
              outlined
              v-model="accountForm.number"
              autofocus
              class="q-mr-md"
            />
          </div>
        </div>
        <div class="row w-100 justify-center items-center q-my-lg">
          <div class="col">
            <div class="text-h6">密碼</div>
            <q-input
              outlined
              type="password"
              v-model="accountForm.password"
              autofocus
              class="q-mr-md"
            />
          </div>
          <div class="col">
            <div class="text-h6">權限 0:使用者 1:管理員 2:唯讀</div>
            <q-input
              outlined
              v-model="accountForm.role"
              autofocus
              class="q-mr-md"
            />
          </div>
          <div class="col">
            <div class="text-h6">組別</div>
            <q-select
              outlined
              :options="options"
              v-model="accountForm.team"
              autofocus
              class="q-mr-md"
            />
          </div>
          <div class="col">
            <div class="text-h6">部門</div>
            <q-input
              outlined
              v-model="accountForm.depart"
              autofocus
              class="q-mr-md"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn color="red" label="取消" v-close-popup />
        <q-btn color="secondary" label="修改" v-close-popup @click="Submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <!-- ---------------------------------------------------- -->
</template>
<script setup>
import { ref, reactive } from 'vue'
import { apiAuth } from 'src/boot/axios'
import { useQuasar } from 'quasar'
// import { useUserStore } from 'src/stores/users'
import { useMemberStore } from 'src/stores/member'

const options = ref(null)
// const user = useUserStore()
const member = useMemberStore()
const $q = useQuasar()
const prompt = ref(false)
const accountForm = reactive({
  _id: '',
  name: '',
  number: '',
  password: '',
  role: '',
  team: '',
  depart: ''
})
const getteam = async () => {
  const result = await apiAuth.get('/users/team')
  options.value = result.data
}
getteam()
const filter = ref('')
const openDialog = (props) => {
  prompt.value = true
  accountForm._id = props._id
  accountForm.name = props.name
  accountForm.number = props.number
  accountForm.role = props.role
  accountForm.team = props.team
  accountForm.depart = props.depart
}
const closeDialog = (props) => {
  prompt.value = false
  accountForm._id = ''
  accountForm.name = ''
  accountForm.number = ''
  accountForm.role = ''
  accountForm.password = ''
  accountForm.team = ''
  accountForm.depart = ''
}
const Submit = async () => {
  await apiAuth.patch(`/users/admin/${accountForm._id}`, accountForm)
  closeDialog()
  $q.notify({
    color: 'green-4',
    textColor: 'white',
    icon: 'cloud_done',
    message: '修改成功'
  })
  await getuser()
}
const memberOptions = ref([])
// watch member.geted to push memberoptions value
setTimeout(() => {
  rows.value = member.member
  member.member.forEach((item, index) => {
    memberOptions.value.push({ id: index, name: item.name })
  })
}, 1000)
const columns = [
  {
    name: 'name',
    align: 'left',
    label: '名字',
    field: 'name',
    sortable: true
  },
  {
    name: 'number',
    align: 'left',
    label: '工號',
    field: 'number',
    sortable: true
  },
  {
    name: 'team',
    align: 'left',
    label: '班別',
    field: 'team',
    sortable: true
  },
  {
    name: 'depart',
    align: 'left',
    label: '部門',
    field: 'depart',
    sortable: true
  },
  {
    name: 'edit',
    align: 'center',
    label: '編輯',
    field: 'edit',
    sortable: false
  },
  // {
  //   name: 'year',
  //   align: 'left',
  //   label: '到職年',
  //   field: 'year',
  //   sortable: true
  // },
  // {
  //   name: 'month',
  //   align: 'left',
  //   label: '月',
  //   field: 'month',
  //   sortable: true
  // },
  // {
  //   name: 'day',
  //   align: 'left',
  //   label: '日',
  //   field: 'day',
  //   sortable: true
  // },
  {
    name: 'delete',
    align: 'center',
    label: '刪除',
    field: 'delete',
    sortable: true
  },
  {
    name: 'role',
    align: 'right',
    label: '權限 0=用戶 1=管理員 2=唯讀',
    field: 'role',
    sortable: true
  },
  { name: '_id', align: 'right', label: '_id', field: '_id', sortable: true }
]
const rows = ref([])
const getuser = async () => {
  rows.value = []
  member.geted = false
  await member.getMember()
  rows.value = member.member
}
// getuser()

const deleteuser = async (row) => {
  await apiAuth.delete(`/users/delete/${row._id}`)
  $q.notify({
    color: 'green-4',
    textColor: 'white',
    icon: 'cloud_done',
    message: '修改成功'
  })
  await getuser()
}

const add = (val) => {
  filter.value = val
}
</script>
<style lang="scss" scoped>
.w-250px {
  width: 210px;
  overflow-x: hidden;
  position: relative;
  left:50px
}
.w-32px{
  width: 32px;}
  .item{
    transform: translateX(10px);

  }
</style>
