import{r as e}from"./rolldown-runtime-S-ySWqyJ.js";import{$ as t,C as n,E as r,F as i,M as a,P as o,W as s,_ as c,a as l,c as u,s as d,u as f,v as p,w as m}from"./vendor-antd-Xac7S3WS.js";import{c as h,i as g}from"./index-Cxx-v8w2.js";var _=e(t(),1),v=h();function y(){let[e,t]=(0,_.useState)([]),[h,y]=(0,_.useState)(!1),[b,x]=(0,_.useState)(!1),[S,C]=(0,_.useState)(null),[w]=m.useForm(),{message:T}=s.useApp();(0,_.useEffect)(()=>{E()},[]);let E=async()=>{y(!0);try{t((await g.tree()).data)}catch{T.error(`加载分类失败`)}finally{y(!1)}},D=e=>{C(null),w.resetFields(),w.setFieldsValue({parent_id:e}),x(!0)},O=e=>{C(e),w.setFieldsValue({name:e.name,label:e.label,parent_id:e.parent_id}),x(!0)},k=async e=>{try{await g.delete(e),T.success(`删除成功`),E()}catch{T.error(`删除失败`)}},A=async()=>{try{let e=await w.validateFields();S?(await g.update(S.id,e),T.success(`更新成功`)):(await g.create(e),T.success(`创建成功`)),x(!1),E()}catch{T.error(`操作失败`),x(!1)}},j=e=>e.map(e=>({key:e.id,title:(0,v.jsxs)(`div`,{className:`category-tree-item`,children:[(0,v.jsxs)(`div`,{className:`category-info`,children:[(0,v.jsx)(`span`,{className:`category-name`,children:e.name}),e.label&&(0,v.jsx)(u,{color:`purple`,className:`category-label`,children:e.label})]}),(0,v.jsxs)(r,{size:`small`,className:`category-actions`,children:[(0,v.jsx)(i,{size:`small`,type:`text`,icon:(0,v.jsx)(o,{}),onClick:()=>D(e.id),className:`action-btn`,children:`添加`}),(0,v.jsx)(i,{size:`small`,type:`text`,icon:(0,v.jsx)(l,{}),onClick:()=>O(e),className:`action-btn`,children:`编辑`}),(0,v.jsx)(c,{title:`确定删除？`,onConfirm:()=>k(e.id),children:(0,v.jsx)(i,{size:`small`,type:`text`,danger:!0,icon:(0,v.jsx)(d,{}),className:`action-btn`,children:`删除`})})]})]}),children:e.children?j(e.children):void 0})),M=j(e);return(0,v.jsxs)(`div`,{className:`category-page`,children:[(0,v.jsxs)(`div`,{className:`page-header`,children:[(0,v.jsxs)(`div`,{className:`header-left`,children:[(0,v.jsx)(`h2`,{id:`category-manage-title`,children:`分类管理`}),(0,v.jsxs)(u,{id:`category-manage-count`,color:`blue`,children:[e.length,` 个分类`]})]}),(0,v.jsx)(i,{id:`category-manage-add-btn`,type:`primary`,icon:(0,v.jsx)(o,{}),onClick:()=>D(),className:`add-btn`,children:`添加顶级分类`})]}),(0,v.jsx)(a,{loading:h,className:`tree-card`,children:(0,v.jsx)(f,{showLine:!0,defaultExpandAll:!0,treeData:M})}),(0,v.jsx)(p,{title:S?`编辑分类`:`添加分类`,open:b,onOk:A,onCancel:()=>x(!1),className:`category-modal`,destroyOnHidden:!0,children:(0,v.jsxs)(m,{form:w,layout:`vertical`,children:[(0,v.jsx)(m.Item,{name:`name`,label:`分类名称`,rules:[{required:!0,message:`请输入分类名称`}],children:(0,v.jsx)(n,{id:`category-form-name`,placeholder:`请输入分类名称`})}),(0,v.jsx)(m.Item,{name:`label`,label:`自定义标签`,children:(0,v.jsx)(n,{id:`category-form-label`,placeholder:`请输入自定义标签（可选）`})}),(0,v.jsx)(m.Item,{name:`parent_id`,label:`父级分类`,children:(0,v.jsx)(n,{type:`number`,placeholder:`留空为顶级分类`})})]})}),(0,v.jsx)(`style`,{children:`
        .category-page {
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
          align-items: center;
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

        .add-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .add-btn:hover {
          background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
          transform: translateY(-1px);
        }

        .tree-card {
          border-radius: 12px;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .category-tree-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .category-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .category-name {
          font-weight: 500;
        }

        .category-label {
          font-size: 11px;
        }

        .category-actions {
          opacity: 0;
          transition: opacity 0.2s;
        }

        .category-tree-item:hover .category-actions {
          opacity: 1;
        }

        .action-btn {
          padding: 4px 8px;
          font-size: 12px;
        }

        .action-btn:hover {
          background: #f0f0f0;
          border-radius: 4px;
        }

        .category-modal .ant-modal-content {
          border-radius: 12px;
        }
      `})]})}export{y as default};