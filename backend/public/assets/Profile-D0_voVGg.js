import{r as e}from"./rolldown-runtime-S-ySWqyJ.js";import{$ as t,A as n,C as r,F as i,M as a,w as o,y as s}from"./vendor-antd-Xac7S3WS.js";import{d as c,p as l,t as u}from"./vendor-icons-jTmcUf7H.js";import{c as d,l as f,s as p}from"./index-Cxx-v8w2.js";var m=e(t(),1),h=d();function g(){let{user:e}=f(),[t]=o.useForm(),[d,g]=(0,m.useState)(!1);return(0,m.useEffect)(()=>{e&&t.setFieldsValue({username:e.username,name:e.name||``,email:e.email||``,phone:e.phone||``,role:e.role})},[e,t]),(0,h.jsxs)(`div`,{className:`profile-container`,children:[(0,h.jsxs)(a,{title:`个人信息`,className:`profile-card`,children:[(0,h.jsxs)(o,{form:t,layout:`vertical`,disabled:!0,children:[(0,h.jsx)(o.Item,{name:`username`,label:`用户名`,children:(0,h.jsx)(r,{prefix:(0,h.jsx)(u,{})})}),(0,h.jsx)(o.Item,{name:`role`,label:`角色`,children:(0,h.jsx)(r,{})})]}),(0,h.jsx)(n,{}),(0,h.jsxs)(o,{form:t,layout:`vertical`,children:[(0,h.jsx)(o.Item,{name:`name`,label:`姓名`,rules:[{required:!0,message:`请输入姓名`}],children:(0,h.jsx)(r,{prefix:(0,h.jsx)(u,{}),placeholder:`请输入姓名`,maxLength:100})}),(0,h.jsx)(o.Item,{name:`email`,label:`邮箱`,rules:[{type:`email`,message:`请输入有效的邮箱地址`}],children:(0,h.jsx)(r,{prefix:(0,h.jsx)(l,{}),placeholder:`请输入邮箱`,maxLength:200})}),(0,h.jsx)(o.Item,{name:`phone`,label:`电话`,children:(0,h.jsx)(r,{prefix:(0,h.jsx)(c,{}),placeholder:`请输入联系电话`,maxLength:20})})]}),(0,h.jsx)(`div`,{className:`profile-actions`,children:(0,h.jsx)(i,{type:`primary`,onClick:async()=>{try{let n=await t.validateFields();g(!0),await p.update(e.id,{name:n.name,email:n.email,phone:n.phone}),s.success(`个人信息更新成功`)}catch(e){let t=e;s.error(t.response?.data?.error||`更新失败`)}finally{g(!1)}},loading:d,children:`保存修改`})})]}),(0,h.jsx)(`style`,{children:`
        .profile-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 0 8px;
        }

        .profile-card {
          margin-bottom: 24px;
        }

        .profile-actions {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
        }

        @media screen and (max-width: 480px) {
          .profile-container {
            padding: 0;
          }
        }
      `})]})}export{g as default};