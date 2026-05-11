import{r as e}from"./rolldown-runtime-S-ySWqyJ.js";import{$ as t,B as n,C as r,E as i,F as a,H as o,M as s,P as c,W as l,k as u,l as d,q as f,v as p,w as m}from"./vendor-antd-Xac7S3WS.js";import{S as h,r as g}from"./vendor-icons-jTmcUf7H.js";import{c as _,l as v,n as y,r as b}from"./index-Cxx-v8w2.js";var x=e(t(),1),S=_(),C=[{value:``,label:`全部`},{value:`pending`,label:`待审批`},{value:`approved`,label:`已通过`},{value:`rejected`,label:`已拒绝`},{value:`returned`,label:`已归还`}];function w(){let[e,t]=(0,x.useState)(!1),[_,w]=(0,x.useState)([]),[T,E]=(0,x.useState)(0),[D,O]=(0,x.useState)(1),[k,A]=(0,x.useState)(``),[j,M]=(0,x.useState)(!1),[N,P]=(0,x.useState)(null),[F,I]=(0,x.useState)(``),[L,R]=(0,x.useState)(!1),[z,B]=(0,x.useState)([]),[V,H]=(0,x.useState)(null),[U,W]=(0,x.useState)(!1),[G]=m.useForm(),K=v(e=>e.user),{message:q}=l.useApp();(0,x.useEffect)(()=>{J()},[D,k]);let J=async()=>{t(!0);try{let e=await b.list({page:D,page_size:10,status:k});w(e.data.items),E(e.data.total)}catch{q.error(`加载失败`)}finally{t(!1)}},Y=async e=>{try{await b.approve(e.id,K?.username||`admin`),q.success(`审批通过`),J()}catch{q.error(`操作失败`)}},X=()=>!N||!F?(q.warning(`请输入拒绝原因`),!1):(async()=>{try{return await b.reject(N.id,K?.username||`admin`,F),q.success(`已拒绝`),M(!1),I(``),J(),!0}catch{return q.error(`操作失败`),!1}})(),Z=async e=>{try{await b.return(e.id),q.success(`已归还`),J()}catch{q.error(`操作失败`)}},Q=async()=>{try{B((await y.list({page:1,page_size:100})).data.items),R(!0),G.resetFields(),H(null)}catch{q.error(`加载资产列表失败`)}},$=()=>{R(!1),G.resetFields(),H(null)},ee=async e=>{if(!V){q.error(`请选择资产`);return}W(!0);try{await b.create({asset_uuid:V.uuid,borrower_name:e.borrower_name,borrower_email:e.borrower_email,borrower_phone:e.borrower_phone,quantity:e.quantity,remark:e.remark}),q.success(`借用申请已提交`),$(),J()}catch(e){q.error(e.response?.data?.error||`提交失败`),$()}finally{W(!1)}},te=e=>{let{color:t,text:n}={pending:{color:`#faad14`,text:`待审批`},approved:{color:`#52c41a`,text:`已通过`},rejected:{color:`#ff4d4f`,text:`已拒绝`},returned:{color:`#1890ff`,text:`已归还`}}[e]||{color:`#d9d9d9`,text:e};return(0,S.jsx)(`span`,{style:{color:t,padding:`2px 8px`,borderRadius:4,background:t+`20`},children:n})};return(0,S.jsxs)(`div`,{className:`borrow-list-page`,children:[(0,S.jsxs)(`div`,{className:`page-header`,children:[(0,S.jsxs)(`div`,{className:`header-left`,children:[(0,S.jsx)(`h2`,{id:`borrow-list-title`,children:`借用管理`}),(0,S.jsxs)(`span`,{id:`borrow-list-count`,className:`total-count`,children:[`共 `,T,` 条记录`]})]}),(0,S.jsxs)(i,{children:[(0,S.jsx)(a,{id:`borrow-list-refresh-btn`,icon:(0,S.jsx)(h,{}),onClick:J,children:`刷新`}),(0,S.jsx)(n,{id:`borrow-list-status-select`,value:k,onChange:e=>{A(e),O(1)},options:C,style:{width:120},className:`status-select`}),(0,S.jsx)(a,{id:`borrow-list-add-btn`,type:`primary`,icon:(0,S.jsx)(c,{}),onClick:Q,className:`add-btn`,children:`发起借用`})]})]}),(0,S.jsxs)(s,{className:`flow-card`,children:[(0,S.jsxs)(`div`,{className:`flow-header`,children:[(0,S.jsx)(`span`,{className:`flow-icon`,children:`📋`}),(0,S.jsx)(`span`,{className:`flow-title`,children:`OA审批流程`})]}),(0,S.jsxs)(`div`,{className:`flow-steps`,children:[(0,S.jsxs)(`div`,{className:`flow-step`,children:[(0,S.jsx)(`div`,{className:`step-number`,children:`1`}),(0,S.jsxs)(`div`,{className:`step-content`,children:[(0,S.jsx)(`div`,{className:`step-title`,children:`发起借用`}),(0,S.jsx)(`div`,{className:`step-desc`,children:`提交借用申请`})]})]}),(0,S.jsx)(`div`,{className:`flow-arrow`,children:`→`}),(0,S.jsxs)(`div`,{className:`flow-step`,children:[(0,S.jsx)(`div`,{className:`step-number`,children:`2`}),(0,S.jsxs)(`div`,{className:`step-content`,children:[(0,S.jsx)(`div`,{className:`step-title`,children:`待审批`}),(0,S.jsx)(`div`,{className:`step-desc`,children:`等待管理员处理`})]})]}),(0,S.jsx)(`div`,{className:`flow-arrow`,children:`→`}),(0,S.jsxs)(`div`,{className:`flow-step`,children:[(0,S.jsx)(`div`,{className:`step-number`,children:`3`}),(0,S.jsxs)(`div`,{className:`step-content`,children:[(0,S.jsx)(`div`,{className:`step-title`,children:`管理员审批`}),(0,S.jsx)(`div`,{className:`step-desc`,children:`通过/拒绝申请`})]})]}),(0,S.jsx)(`div`,{className:`flow-arrow`,children:`→`}),(0,S.jsxs)(`div`,{className:`flow-step`,children:[(0,S.jsx)(`div`,{className:`step-number`,children:`4`}),(0,S.jsxs)(`div`,{className:`step-content`,children:[(0,S.jsx)(`div`,{className:`step-title`,children:`归还`}),(0,S.jsx)(`div`,{className:`step-desc`,children:`确认归还资产`})]})]})]})]}),(0,S.jsx)(s,{className:`table-card`,children:(0,S.jsx)(d,{rowKey:`id`,loading:e,dataSource:_,columns:[{title:`资产`,key:`asset`,render:(e,t)=>(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`div`,{children:t.asset?.name||`-`}),(0,S.jsxs)(`div`,{style:{fontSize:12,color:`#999`},children:[`UUID: `,t.asset_uuid.slice(0,8),`...`]})]})},{title:`借用人`,key:`borrower`,render:(e,t)=>(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`div`,{children:t.borrower_name}),(0,S.jsx)(`div`,{style:{fontSize:12,color:`#999`},children:t.borrower_phone||`-`})]})},{title:`数量`,dataIndex:`quantity`,key:`quantity`,width:80},{title:`状态`,dataIndex:`status`,key:`status`,render:e=>te(e),width:100},{title:`借用日期`,dataIndex:`borrow_date`,key:`borrow_date`,width:120},{title:`审批人`,dataIndex:`approved_by`,key:`approved_by`,width:100,render:e=>e||`-`},{title:`备注`,dataIndex:`remark`,key:`remark`,ellipsis:!0},{title:`操作`,key:`action`,width:180,render:(e,t)=>(0,S.jsxs)(i,{children:[t.status===`pending`&&(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(a,{type:`primary`,size:`small`,icon:(0,S.jsx)(o,{}),onClick:()=>Y(t),children:`通过`}),(0,S.jsx)(a,{size:`small`,danger:!0,icon:(0,S.jsx)(f,{}),onClick:()=>{P(t),M(!0)},children:`拒绝`})]}),t.status===`approved`&&(0,S.jsx)(a,{size:`small`,icon:(0,S.jsx)(g,{}),onClick:()=>Z(t),children:`归还`})]})}],pagination:{current:D,total:T,pageSize:10,showSizeChanger:!1,showTotal:e=>`共 ${e} 条`,onChange:O}})}),(0,S.jsx)(p,{title:`拒绝原因`,open:j,onOk:X,onCancel:()=>M(!1),okText:`确认拒绝`,cancelText:`取消`,destroyOnHidden:!0,children:(0,S.jsx)(r.TextArea,{id:`borrow-reject-reason`,value:F,onChange:e=>I(e.target.value),placeholder:`请输入拒绝原因`,rows:4})}),(0,S.jsx)(p,{title:`发起借用申请`,open:L,onCancel:$,footer:null,width:520,destroyOnHidden:!0,children:L&&(0,S.jsxs)(m,{form:G,layout:`vertical`,onFinish:ee,initialValues:{quantity:1},children:[(0,S.jsx)(m.Item,{name:`asset_id`,label:`选择资产`,rules:[{required:!0,message:`请选择资产`}],children:(0,S.jsx)(n,{placeholder:`请选择要借用的资产`,showSearch:!0,optionFilterProp:`children`,onChange:e=>{H(z.find(t=>t.id===e)||null)},children:z.map(e=>(0,S.jsxs)(n.Option,{value:e.id,children:[e.name,` - `,e.owner||`无所有人`,` (库存: `,e.quantity,`)`]},e.id))})}),V&&(0,S.jsxs)(`div`,{style:{marginBottom:16,padding:12,background:`#f5f5f5`,borderRadius:4},children:[(0,S.jsx)(`div`,{children:(0,S.jsx)(`b`,{children:`资产信息`})}),(0,S.jsxs)(`div`,{style:{display:`flex`,gap:16},children:[(0,S.jsxs)(`span`,{children:[`名称：`,V.name]}),(0,S.jsxs)(`span`,{children:[`规格：`,V.spec||`-`]})]}),(0,S.jsxs)(`div`,{style:{display:`flex`,gap:16},children:[(0,S.jsxs)(`span`,{children:[`库存：`,V.quantity]}),(0,S.jsxs)(`span`,{children:[`位置：`,V.location||`-`]})]})]}),(0,S.jsx)(m.Item,{name:`borrower_name`,label:`借用人姓名`,rules:[{required:!0,message:`请输入借用人姓名`}],children:(0,S.jsx)(r,{id:`borrow-create-borrower-name`,placeholder:`请输入借用人姓名`})}),(0,S.jsx)(m.Item,{name:`borrower_email`,label:`借用人邮箱`,children:(0,S.jsx)(r,{id:`borrow-create-email`,type:`email`,placeholder:`用于接收审批结果通知`})}),(0,S.jsx)(m.Item,{name:`borrower_phone`,label:`联系电话`,children:(0,S.jsx)(r,{id:`borrow-create-phone`,placeholder:`请输入联系电话`})}),(0,S.jsx)(m.Item,{name:`quantity`,label:`借用数量`,rules:[{required:!0,message:`请输入数量`}],children:(0,S.jsx)(u,{min:1,max:V?.quantity||1,style:{width:`100%`}})}),(0,S.jsx)(m.Item,{name:`remark`,label:`借用原因/备注`,children:(0,S.jsx)(r.TextArea,{id:`borrow-create-remark`,placeholder:`请输入借用原因`,rows:3})}),(0,S.jsx)(m.Item,{style:{marginBottom:0},children:(0,S.jsxs)(i,{children:[(0,S.jsx)(a,{id:`borrow-create-submit-btn`,type:`primary`,htmlType:`submit`,loading:U,children:`提交申请`}),(0,S.jsx)(a,{onClick:$,children:`取消`})]})})]})}),(0,S.jsx)(`style`,{children:`
        .borrow-list-page {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .header-left {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .page-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .total-count {
          color: #8c8c8c;
          font-size: 14px;
          background: #f0f0f0;
          padding: 4px 12px;
          border-radius: 12px;
        }

        .add-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .add-btn:hover {
          background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
          transform: translateY(-1px);
        }

        .status-select {
          border-radius: 6px;
        }

        /* 流程卡片 */
        .flow-card {
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #f0f5ff 0%, #fafbff 100%);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          margin-bottom: 20px;
        }

        .flow-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .flow-icon {
          font-size: 20px;
        }

        .flow-title {
          font-weight: 600;
          font-size: 16px;
          color: #333;
        }

        .flow-steps {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .flow-step {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          min-width: 120px;
        }

        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .step-content {
          display: flex;
          flex-direction: column;
        }

        .step-title {
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }

        .step-desc {
          font-size: 12px;
          color: #8c8c8c;
        }

        .flow-arrow {
          color: #667eea;
          font-size: 18px;
          font-weight: 600;
        }

        /* 表格卡片 */
        .table-card {
          border-radius: 12px;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .table-card .ant-card-body {
          padding: 0;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            padding: 16px;
            border-radius: 16px;
            margin-bottom: 12px;
            box-shadow: 0 2px 12px rgba(102, 126, 234, 0.08);
          }

          .page-header .ant-space {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
            gap: 8px;
          }

          .page-header h2 {
            font-size: 18px;
          }

          .flow-card {
            border-radius: 16px;
            padding: 4px;
          }

          .flow-steps {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .flow-arrow {
            transform: rotate(90deg);
            margin: 2px 0;
          }

          .flow-step {
            width: 100%;
            padding: 10px 14px;
          }

          .table-card {
            border-radius: 16px;
          }

          .total-count {
            font-size: 12px;
            padding: 3px 10px;
          }
        }

        /* 移动端表格适配 */
        @media (max-width: 576px) {
          .borrow-list-page .ant-table {
            font-size: 12px;
            min-width: 600px;
            border-radius: 12px;
            overflow: hidden;
          }

          .borrow-list-page .ant-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border-radius: 12px;
          }

          .borrow-list-page .ant-table-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .borrow-list-page .ant-table-body {
            overflow-x: auto;
          }
        }
      `})]})}export{w as default};