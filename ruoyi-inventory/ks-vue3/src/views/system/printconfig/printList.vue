<template>
  <!--模板列表与编辑页面-->
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :span="24" :xs="24">
        <!-- 查询表单 -->
        <el-form
            v-show="showSearch"
            ref="queryRef"
            :inline="true"
            :model="queryParams"
            label-width="90px"
        >
          <el-form-item label="模板名称" prop="templateName">
            <el-input
                v-model="queryParams.templateName"
                clearable
                placeholder="请输入模板名称"
                style="width: 200px"
                @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button icon="Search" type="primary" @click="handleQuery">查询</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 操作按钮 -->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
                v-hasPermi="['print:template:add']"
                icon="Plus"
                plain
                type="primary"
                @click="handleAdd"
            >新增
            </el-button>
            <el-button icon="QuestionFilled" type="primary" @click="drawerExamples">
              模板代码示例
            </el-button>
          </el-col>
          <right-toolbar
              v-model:showSearch="showSearch"
              @queryTable="getList"
          ></right-toolbar>
        </el-row>

        <!-- 表格数据 -->
        <el-table v-loading="loading" :data="templateList" border>
          <el-table-column align="center" label="模板ID" prop="templateId" width="70"/>
          <el-table-column align="center" label="模板名称" prop="templateName"/>
          <el-table-column align="center" label="备注" prop="remark" width="200"/>
          <el-table-column align="center" label="创建者" prop="createBy" width="100"/>
          <el-table-column align="center" label="创建时间" prop="createTime" width="180">
            <template #default="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column align="center" label="更新者" prop="updateBy" width="100"/>
          <el-table-column align="center" label="更新时间" prop="updateTime" width="180">
            <template #default="scope">
              <span>{{ parseTime(scope.row.updateTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column align="center" class-name="small-padding fixed-width" label="操作" width="200">
            <template #default="scope">
              <el-tooltip content="预览" placement="top">
                <el-button
                    v-hasPermi="['print:template:preview']"
                    icon="View"
                    link
                    type="info"
                    @click="handlePreview(scope.row)"
                >预览
                </el-button>
              </el-tooltip>
              <el-tooltip content="修改" placement="top">
                <el-button
                    v-hasPermi="['print:template:edit']"
                    icon="Edit"
                    link
                    type="primary"
                    @click="handleUpdate(scope.row)"
                >修改
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button
                    v-hasPermi="['print:template:remove']"
                    icon="Delete"
                    link
                    type="danger"
                    @click="handleDelete(scope.row)"
                >删除
                </el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <pagination
            v-show="total > 0"
            v-model:limit="queryParams.pageSize"
            v-model:page="queryParams.pageNum"
            :total="total"
            @pagination="getList"
        />
      </el-col>
    </el-row>

    <!-- 编辑/新增对话框 -->
    <el-dialog
        v-model="open"
        :title="dialogTitle"
        width="70%"
        @close="handleDialogClose"
    >
      <el-form ref="orderRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="模板名称" prop="templateName">
          <el-input v-model="form.templateName" placeholder="请输入模板名称"/>
        </el-form-item>
        <el-form-item label="JS代码" prop="jsContent">
          <el-input
              v-model="form.jsContent"
              :rows="15"
              placeholder="请输入JS内容"
              type="textarea"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
              v-model="form.remark"
              :rows="2"
              placeholder="请输入备注（可选）"
              type="textarea"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="save">保存</el-button>
          <el-button @click="open = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 模板预览对话框 -->
    <el-dialog
        v-model="previewOpen"
        :close-on-click-modal="false"
        append-to-body
        title="模板预览"
        width="80%"
    >
      <div
          ref="previewContainer"
          :style="{ height: '600px', overflow: 'auto', border: '1px solid #eee' }"
          class="template-preview-container"
      ></div>
    </el-dialog>

    <el-drawer v-model="drawer" :with-header="false" size="40%">
      <div class="code-header">
        <el-button
            type="primary"
            @click="copyCode"
        >
          复制代码
        </el-button>
        <span>注意：使用该代码，请取消注释最后一行代码，以免运行失败。谢谢！</span>
      </div>
      <div class="code-container">
        <pre><code class="javascript">{{ jsFileContent }}</code></pre>
      </div>
    </el-drawer>

  </div>
</template>

<script setup>
import {getCurrentInstance, reactive, ref} from 'vue'
import {addTemplate, delTemplate, getTemplate, listTemplate, updateTemplate} from '@/api/print/template'
import {useRouter} from 'vue-router'
import VxeUI from 'vxe-table'
import jsFileContent from '@/utils/printDocuments/printExample.js?raw'

window.VxeUI = VxeUI

const {proxy} = getCurrentInstance()
const router = useRouter()

// 表格相关
const templateList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])

// 对话框相关
const open = ref(false)
const isEdit = ref(false) // true 表示编辑，false 表示新增

// 预览相关
const previewOpen = ref(false)
const previewContainer = ref(null)
const drawer = ref(false)

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 50,
  templateName: undefined
})

// 表单数据
const form = reactive({
  templateId: undefined,
  templateName: undefined,
  htmlContent: undefined,
  cssContent: undefined,
  jsContent: undefined,
  remark: undefined,
})

// 表单校验规则
const rules = reactive({
  templateName: [{required: true, message: '模板名称不能为空', trigger: 'blur'}],
  jsContent: [{required: true, message: 'JS代码不能为空', trigger: 'blur'}],
})

// 对话框标题
const dialogTitle = computed(() => isEdit.value ? '修改模板' : '新增模板')

// 获取列表
function getList() {
  loading.value = true
  listTemplate(proxy.addDateRange(queryParams, dateRange.value)).then(response => {
    templateList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

// 查询
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

// 重置
function resetQuery() {
  dateRange.value = []
  proxy.resetForm('queryRef')
  handleQuery()
}

// 新增
function handleAdd() {
  isEdit.value = false
  Object.assign(form, {
    templateId: undefined,
    templateName: undefined,
    jsContent: undefined,
    remark: undefined,
  })
  open.value = true
}

// 修改
function handleUpdate(row) {
  isEdit.value = true
  getTemplate(row.templateId).then(response => {
    Object.assign(form, response.data)
    open.value = true
  })
}

// 删除
function handleDelete(row) {
  proxy.$modal.confirm(`确认要删除ID为${row.templateId}的打印模板?`).then(() => {
    return delTemplate(row.templateId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {
  })
}

// 保存
function save() {
  proxy.$refs['orderRef'].validate(valid => {
    if (valid) {
      const api = isEdit.value ? updateTemplate : addTemplate
      api(form).then(() => {
        proxy.$modal.msgSuccess('保存成功')
        open.value = false
        getList()
      })
    }
  })
}

// 关闭对话框时重置表单（可选）
function handleDialogClose() {
  proxy.$refs['orderRef']?.resetFields()
}

function handlePreview(row) {
  // 创建示例数据
  const exampleData = {
    data: {
      originalReceipt: '20231001001',
      systematicReceipt: 'SYS20231001001',
      invoiceDate: '2023-10-01',
      customer: {customerName: '测试客户有限公司'},
      details: [
        {
          productCode: 'P001',
          productName: '不锈钢螺丝',
          productSpecifications: 'M6x50mm',
          measureUnit: '个',
          planQuantity: '100',
          univalence: '0.50',
          money: '50.00',
          remarks: '标准件'
        },
        {
          productCode: 'P002',
          productName: '铝合金板',
          productSpecifications: '100x50x5mm',
          measureUnit: '张',
          planQuantity: '50',
          univalence: '20.00',
          money: '1000.00',
          remarks: '特殊规格'
        }
      ],
      sysUser: {userName: '张三'},
      receiptNotes: '请于2023-10-05前送达'
    }
  }

  try {
    // 1. 确保有JS代码
    if (!row.jsContent) {
      alert('模板JS代码为空')
      return
    }

    // 2. 直接执行模板代码（使用全局VxeUI）
    try {
      const templateFnFactory = new Function(`${row.jsContent}`);
      const templateFn = templateFnFactory();
      if (typeof templateFn === 'function') {
        alert('预览已触发打印！请在浏览器打印对话框中确认打印设置，数据为模拟数据。请放心！')
        templateFn(exampleData);
      } else {
        throw new Error('模板未返回有效函数');
      }
    } catch (e) {
      console.error('模板执行失败:', e);
      proxy.$modal.msgError(`执行失败: ${e.message}`);
    }
  } catch (e) {
    alert(`预览失败: ${e.message}`)
  }
}

// 代码模板示例按钮
function drawerExamples() {
  drawer.value = true
}

// 复制代码按钮
async function copyCode() {
  try {
    await navigator.clipboard.writeText(jsFileContent)
    proxy.$modal.msgSuccess('代码已复制到剪贴板')
  } catch (error) {
    console.log(error)
  }
}

// 初始化
getList()
</script>

<style scoped>
:deep(.template-preview-container *) {
  box-sizing: border-box;
}

.preview-loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.preview-error {
  text-align: center;
  padding: 20px;
  color: #e53935;
  background: #ffebee;
  border-radius: 4px;
}

.preview-error {
  text-align: center;
  padding: 20px;
  color: #d32f2f;
  background: #ffebee;
  border-radius: 4px;
  font-weight: bold;
  line-height: 1.5;
}

.code-container {
  padding: 0;
  background: #f6f8fa;
  height: 100%;
  overflow: auto;
}

pre {
  margin: 0;
  white-space: pre;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 20px;
  color: #24292e;
}

pre code {
  display: block;
}

</style>