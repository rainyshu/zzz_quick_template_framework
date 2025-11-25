function getWarehouseReceipt(response) {
    // 项目编号
    const originalReceipt = response.data.originalReceipt || "";

    // 项目编号
    const systematicReceipt = response.data.systematicReceipt || "";

    // 开单日期and送货日期
    const invoiceDate = response.data.invoiceDate || "";

    // 客户名称
    const customerName = response.data.customer.customerName || "";

    // 明细信息
    const items = response.data.details.map((item) => ({
        boringNumber: item.productCode || "",
        materialName: item.productName || "",
        materialType: item.productSpecifications || "",
        unit: item.measureUnit || "",
        quantity: item.planQuantity || "",
        price: item.univalence || "",
        total: item.money || "",
        remark: item.remarks || "",
        sumQuantity: Number(item.planQuantity) || 0,
    }));

    // 合计（小写）
    const userName = response.data.sysUser.userName || "";

    // 使用 reduce 计算总数
    const sumQuantity = items.reduce(
        (total, item) => total + item.sumQuantity,
        0
    );

    // 备注
    const remark = response.data.receiptNotes || "";

    // 每页显示的数据条数
    const itemsPerPage = 8;

    // 计算总页数
    const totalPages = Math.ceil(items.length / itemsPerPage);

    // 总页面

    VxeUI.print({
        sheetName: "销售出仓单打印",
        style: `
    @media print
    {
      @page
      {
        margin-top: 5px;
      }
    }
    .invoice-page {
      margin: 0 0 0 0;
      break-after: page;
      font-family: Arial, sans-serif;
    }
    .invoice-header {
      font-size: 25px;
      padding-left:200px;
    }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .invoice-table {
      width: 97%;
      border-collapse: collapse;
      position: relative;
      top: -25px;
    }
    .invoice-table th, .invoice-table td {
      font-weight: normal;
      border: 1px solid #000;
      text-align: center;
    }
    .invoice-table tr {
      height: 27px;  // 设置行高
    }
    .foot-table {
      width: 97%;
      padding-right: 50px;
      border-collapse: collapse;
      position: relative;
      top: -25px;
    }
    .foot-table th, .foot-table td {
      border: 1px solid #000;
      text-align: center;
    }
    .foot-table tr {
      height: 30px;  // 设置行高
    }
    .invoice-footer {
      display: flex;
      font-size: 14px;
      position: relative;
      top: -25px;
    }
    .invoice-right {
      padding-right: 95px;
    }
  `,
        content: Array.from(
            {length: totalPages},
            (_, pageIndex) => `
<div class="invoice-page">
<div class="invoice-info">
<div>
<div class="invoice-header">铠思出仓单</div>
<div class="invoice-customer">客户：${customerName}</div>
</div>
<div style="padding-right:20px;">
<p>结算单号:${originalReceipt}</p>
<p style="position: relative; top: -10px;">系统编号:${systematicReceipt}</p>
<p style="position: relative; top: -20px;">送货日期:${invoiceDate}</p>
</div>
</div>
<div style="position: fixed; writing-mode: vertical-rl; right: 0;  top: 90px;">注<span style="margin-bottom:3px;">①</span>白色存根<span style="margin-bottom:3px;">②</span>红色客户<span style="margin-bottom:3px;">③</span>蓝色跟单<span style="margin-bottom:3px;">④</span>黄色财务</div>
<table class="invoice-table">
<thead>
<tr>
  <th width=75>编号</th>
  <th width=390>品名规格</th>
  <th width=45>单位</th>
  <th width=45>数量</th>
  <th>备注</th>
</tr>
</thead>
<tbody>
${items.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((item) =>
                ` <tr> <td>${item.boringNumber}</td> <td>${item.materialName}</td> <td>${item.unit}</td> <td>${item.quantity}</td> <td>${item.remark}</td> </tr> `
            ).join("")}
${Array(itemsPerPage - items.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).length
            ).fill().map(() => ` <tr> <td>&nbsp;</td> <td>&nbsp;</td> <td>&nbsp;</td> <td>&nbsp;</td> <td>&nbsp;</td> </tr> `).join("")}
</tbody>
</table>
<table class="foot-table">
<tbody>
  <tr>
    <td width=75>业务</td>
    <td width=105>${userName}</td>
    <td width=285>此单共${totalPages}页 现第${pageIndex + 1}页</td>
    <td style="text-align: left;">合计：${sumQuantity}件</td>
  </tr>
  <tr>
    <td colspan="1" rowspan="3" height=60 >备注</td>
    <td colspan="3" rowspan="3" style="text-align: left;">${remark}</td>
  </tr>
</tbody>
</table>
<div class="invoice-footer">
<div class="invoice-right">仓库：</div>
<div class="invoice-right">装卸：</div>
<div class="invoice-right">提货：</div>
<div class="invoice-right">审核：</div>
<div class="invoice-right">签收：</div>
</div>
</div>
`
        ).join(""),
    });
}

// return getWarehouseReceipt;
