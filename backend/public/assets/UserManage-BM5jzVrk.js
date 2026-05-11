import{r as e}from"./rolldown-runtime-S-ySWqyJ.js";import{$ as t,B as n,C as r,E as i,F as a,P as o,V as s,_ as c,a as l,c as u,l as d,s as f,v as p,w as m,y as h}from"./vendor-antd-Xac7S3WS.js";import{S as g}from"./vendor-icons-jTmcUf7H.js";import{c as _,l as v,s as y}from"./index-BUdRzENf.js";var b=e(t(),1),x=_(),S={super_admin:`red`,admin:`blue`,visitor:`green`},C={super_admin:`超级管理员`,admin:`管理员`,visitor:`访客`};function w(){let[e,t]=(0,b.useState)([]),[_,w]=(0,b.useState)(!1),[T,E]=(0,b.useState)({current:1,pageSize:10,total:0}),[D,O]=(0,b.useState)(``),[k,A]=(0,b.useState)(!1),[j,M]=(0,b.useState)(null),[N]=m.useForm(),[P,F]=(0,b.useState)(!1),{user:I}=v(),L=(0,b.useRef)(null),R=(0,b.useRef)(!1),z=(0,b.useCallback)(async(e=1,n=10)=>{w(!0);try{let r=await y.list({page:e,page_size:n,keyword:D});t(r.data.items),E({current:r.data.page,pageSize:n,total:r.data.total})}catch(e){let t=e;h.error(t.response?.data?.error||`加载用户列表失败`)}finally{w(!1)}},[D]);(0,b.useEffect)(()=>{R.current||(R.current=!0,z())},[z]);let B=(e,t,n)=>{e.current&&e.pageSize&&z(e.current,e.pageSize)},V=()=>{E(e=>({...e,current:1})),z(1,T.pageSize)},H=()=>{M(null),N.resetFields(),A(!0)},U=e=>{M(e),N.setFieldsValue({name:e.name,email:e.email,phone:e.phone,role:e.role}),A(!0)},W=async()=>{try{let e=await N.validateFields();if(F(!0),j){let t={name:e.name,email:e.email,phone:e.phone,role:e.role};await y.update(j.id,t),h.success(`更新成功`)}else{let t={username:e.username,password:e.password,name:e.name,email:e.email,phone:e.phone,role:e.role};await y.create(t),h.success(`创建成功`)}A(!1),z(T.current,T.pageSize)}catch(e){let t=e;t.errorFields||(h.error(t.response?.data?.error||`操作失败`),A(!1))}finally{F(!1)}},G=async e=>{try{await y.delete(e.id),h.success(`删除成功`),z(T.current,T.pageSize)}catch(e){let t=e;h.error(t.response?.data?.error||`删除失败`)}},K=async e=>{try{await y.resetPassword(e.id),h.success(`密码已重置为 123456`)}catch(e){let t=e;h.error(t.response?.data?.error||`重置密码失败`)}};return(0,x.jsxs)(`div`,{className:`user-manage-container`,children:[(0,x.jsxs)(`div`,{className:`user-manage-header`,children:[(0,x.jsxs)(`div`,{className:`user-search-area`,children:[(0,x.jsx)(r,{ref:L,placeholder:`搜索用户名/姓名/邮箱`,value:D,onChange:e=>O(e.target.value),onPressEnter:V,className:`user-search-input`,prefix:(0,x.jsx)(s,{style:{color:`#999`}}),allowClear:!0}),(0,x.jsx)(a,{type:`primary`,onClick:V,className:`user-search-btn`,children:`搜索`})]}),(0,x.jsx)(a,{type:`primary`,icon:(0,x.jsx)(o,{}),onClick:H,className:`user-add-btn`,children:`新增`})]}),(0,x.jsx)(d,{columns:[{title:`用户名`,dataIndex:`username`,key:`username`,width:150},{title:`姓名`,dataIndex:`name`,key:`name`,width:120},{title:`邮箱`,dataIndex:`email`,key:`email`,width:180},{title:`电话`,dataIndex:`phone`,key:`phone`,width:130},{title:`角色`,dataIndex:`role`,key:`role`,width:100,render:e=>(0,x.jsx)(u,{color:S[e]||`default`,children:C[e]||e})},{title:`注册时间`,dataIndex:`created_at`,key:`created_at`,width:160,render:e=>new Date(e).toLocaleString(`zh-CN`)},{title:`操作`,key:`action`,width:200,render:(e,t)=>(0,x.jsxs)(i,{size:`small`,children:[(0,x.jsx)(a,{type:`link`,size:`small`,icon:(0,x.jsx)(l,{}),onClick:()=>U(t),children:`编辑`}),(0,x.jsx)(a,{type:`link`,size:`small`,icon:(0,x.jsx)(g,{}),onClick:()=>K(t),children:`重置密码`}),t.id!==I?.id&&t.role!==`super_admin`&&(0,x.jsx)(c,{title:`确定删除该用户？`,description:`删除后不可恢复`,onConfirm:()=>G(t),okText:`确定`,cancelText:`取消`,children:(0,x.jsx)(a,{type:`link`,size:`small`,danger:!0,icon:(0,x.jsx)(f,{}),children:`删除`})})]})}],dataSource:e,loading:_,rowKey:`id`,pagination:{current:T.current,pageSize:T.pageSize,total:T.total,showSizeChanger:!0,showQuickJumper:!0,showTotal:e=>`共 ${e} 条`},onChange:B,scroll:{x:900},size:`small`}),(0,x.jsx)(`style`,{children:`
        .user-manage-container {
          padding: 0 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .user-manage-container .ant-table-wrapper {
          width: 100%;
          max-width: 1000px;
        }
        .user-manage-header {
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .user-search-area {
          display: flex;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        .user-search-input {
          flex: 1;
          min-width: 150px;
          max-width: 280px;
        }
        .user-search-btn {
          flex-shrink: 0;
        }
        .user-add-btn {
          flex-shrink: 0;
        }
        @media screen and (max-width: 480px) {
          .user-manage-header {
            flex-direction: column;
            align-items: stretch;
          }
          .user-search-area {
            width: 100%;
          }
          .user-search-input {
            max-width: none;
          }
          .user-add-btn {
            width: 100%;
            margin-top: 8px;
          }
        }
      `}),(0,x.jsx)(p,{title:j?`编辑用户`:`新增用户`,open:k,onCancel:()=>A(!1),onOk:W,confirmLoading:P,width:480,destroyOnHidden:!0,children:(0,x.jsxs)(m,{form:N,layout:`vertical`,style:{marginTop:16},children:[!j&&(0,x.jsx)(m.Item,{name:`username`,label:`用户名`,rules:[{required:!0,message:`请输入用户名`},{min:3,message:`用户名至少3个字符`}],children:(0,x.jsx)(r,{placeholder:`请输入用户名（登录用）`,maxLength:50})}),!j&&(0,x.jsx)(m.Item,{name:`password`,label:`密码`,rules:[{required:!0,message:`请输入密码`},{min:6,message:`密码至少6个字符`}],children:(0,x.jsx)(r.Password,{placeholder:`请输入密码`,maxLength:50})}),(0,x.jsx)(m.Item,{name:`name`,label:`姓名`,children:(0,x.jsx)(r,{placeholder:`请输入真实姓名`,maxLength:100})}),(0,x.jsx)(m.Item,{name:`email`,label:`邮箱`,children:(0,x.jsx)(r,{placeholder:`请输入邮箱`,maxLength:200})}),(0,x.jsx)(m.Item,{name:`phone`,label:`电话`,children:(0,x.jsx)(r,{placeholder:`请输入联系电话`,maxLength:20})}),(0,x.jsx)(m.Item,{name:`role`,label:`角色`,rules:[{required:!0,message:`请选择角色`}],initialValue:`admin`,children:(0,x.jsx)(n,{options:[{label:`管理员`,value:`admin`},{label:`超级管理员`,value:`super_admin`},{label:`访客`,value:`visitor`}]})})]})})]})}export{w as default};