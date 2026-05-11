const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/vendor-pdf-MhJeMgTN.js","assets/rolldown-runtime-S-ySWqyJ.js","assets/vendor-antd-Xac7S3WS.js"])))=>i.map(i=>d[i]);
import{r as e}from"./rolldown-runtime-S-ySWqyJ.js";import{$ as t,B as n,C as r,E as i,F as a,K as o,L as s,M as c,P as l,U as u,V as d,W as f,_ as p,a as m,c as h,i as g,l as _,n as v,o as y,q as b,r as x,s as S,v as C,x as w,z as T}from"./vendor-antd-Xac7S3WS.js";import{r as E}from"./vendor-pdf-MhJeMgTN.js";import{s as D}from"./vendor-react-B8PdV_Sd.js";import{n as O,u as k,v as A}from"./vendor-icons-jTmcUf7H.js";import{a as j,c as M,i as N,n as P,o as F}from"./index-Cxx-v8w2.js";var I=e(t(),1),L=M(),{Text:R}=g;function z({open:e,onClose:t,onSuccess:n}){let[r,s]=(0,I.useState)(!1),[c,l]=(0,I.useState)(null);return(0,L.jsx)(C,{title:`批量导入资产`,open:e,onCancel:()=>{l(null),t()},footer:null,width:600,destroyOnHidden:!0,children:(0,L.jsxs)(`div`,{style:{padding:`16px 0`},children:[(0,L.jsxs)(i,{orientation:`vertical`,style:{width:`100%`},size:`large`,children:[(0,L.jsxs)(`div`,{style:{textAlign:`center`},children:[(0,L.jsxs)(i,{size:`large`,children:[(0,L.jsx)(v,{accept:`.xlsx,.xls,.csv`,beforeUpload:async e=>{s(!0);try{let t=await j.importAssets(e);l(t.data),t.data.success>0&&n&&n()}catch(e){l(null),C.error({title:`导入失败`,content:e.response?.data?.error||`服务器错误`})}finally{s(!1)}return!1},showUploadList:!1,disabled:r,children:(0,L.jsx)(a,{type:`primary`,icon:(0,L.jsx)(O,{}),loading:r,children:`选择文件`})}),(0,L.jsx)(a,{icon:(0,L.jsx)(x,{}),onClick:()=>{let e=[[`资产名称`,`分类`,`规格`,`数量`,`所有人`,`存放位置`,`登记人`].join(`,`),[`笔记本电脑`,`电子设备`,`ThinkPad X1`,`1`,`张三`,`实验室A`,`管理员`].join(`,`)].join(`
`),t=new Blob([`﻿`+e],{type:`text/csv;charset=utf-8`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`资产导入模板.csv`,r.click(),URL.revokeObjectURL(n)},children:`下载模板`})]}),(0,L.jsx)(`div`,{style:{marginTop:16},children:(0,L.jsx)(R,{type:`secondary`,children:`支持 .xlsx、.xls、.csv 格式，单次最多导入1000条`})})]}),(0,L.jsx)(o,{type:`info`,showIcon:!0,icon:(0,L.jsx)(A,{}),title:`文件格式说明`,description:(0,L.jsxs)(`div`,{children:[(0,L.jsxs)(`p`,{style:{marginBottom:4},children:[(0,L.jsx)(`strong`,{children:`必填列：`}),`资产名称`]}),(0,L.jsxs)(`p`,{style:{marginBottom:4},children:[(0,L.jsx)(`strong`,{children:`可选列：`}),`分类、规格、数量（默认1）、所有人、存放位置、登记人`]}),(0,L.jsx)(`p`,{style:{margin:0},children:`如果分类不存在，会自动创建`})]})})]}),c&&(0,L.jsxs)(`div`,{style:{marginTop:24},children:[(0,L.jsx)(o,{type:c.failed===0?`success`:`warning`,message:(0,L.jsxs)(`span`,{children:[`导入完成：成功 `,(0,L.jsx)(`strong`,{children:c.success}),` 条， 失败 `,(0,L.jsx)(`strong`,{children:c.failed}),` 条`]}),style:{marginBottom:16}}),(c.errors?.length??0)>0&&(0,L.jsxs)(L.Fragment,{children:[(0,L.jsx)(`h4`,{style:{marginBottom:8},children:`失败详情：`}),(0,L.jsx)(_,{size:`small`,dataSource:c.errors,columns:[{title:`行号`,dataIndex:`row`,key:`row`,width:80},{title:`错误信息`,dataIndex:`message`,key:`message`}],pagination:!1,scroll:{y:200},rowKey:`row`})]})]})]})})}var B=()=>E(()=>import(`./vendor-pdf-MhJeMgTN.js`).then(e=>e.t),__vite__mapDeps([0,1,2])),V=()=>E(()=>import(`./vendor-pdf-MhJeMgTN.js`).then(t=>e(t.n(),1)),__vite__mapDeps([0,1,2])),H=[{label:`50x25mm (标准)`,width:50,height:25,cols:4},{label:`50x30mm`,width:50,height:30,cols:4},{label:`60x40mm`,width:60,height:40,cols:2},{label:`70x25mm`,width:70,height:25,cols:3},{label:`70x35mm`,width:70,height:35,cols:3},{label:`90x40mm (标准)`,width:90,height:40,cols:2},{label:`100x50mm (大标签)`,width:100,height:50,cols:2},{label:`自定义`,width:0,height:0,cols:2}];function U({open:e,onClose:t,assetIds:r}){let[o,s]=(0,I.useState)(!1),[c,l]=(0,I.useState)([]),[d,p]=(0,I.useState)(`90x40mm`),[m,h]=(0,I.useState)(90),[g,_]=(0,I.useState)(40),[v,y]=(0,I.useState)(!1),b=(0,I.useRef)(new Map),{message:S}=f.useApp();(0,I.useEffect)(()=>{e&&r.length>0&&T()},[e,r]),(0,I.useEffect)(()=>{c.length===0&&b.current.clear()},[c]);let T=async()=>{s(!0);try{l((await F.generateBatch(r)).data.items)}catch(e){console.error(`Failed to load labels:`,e),l([])}finally{s(!1)}},E=()=>{let e=H.find(e=>e.label===d);return e&&e.width>0?e:{label:`自定义`,width:m,height:g,cols:2}},D=()=>{window.print()},O=async()=>{if(c.length!==0){y(!0);try{let[e,t]=await Promise.all([B(),V()]),{jsPDF:n}=e,r=t.default||t,i=E(),a=document.createElement(`div`);a.style.cssText=`position: fixed; left: 0; top: 0; background: white; z-index: -1; overflow: hidden;`,document.body.appendChild(a);let o=new n({orientation:i.width>i.height?`landscape`:`portrait`,unit:`mm`,format:[i.width,i.height]});for(let e=0;e<c.length;e++){let t=c[e],n=document.createElement(`div`);n.style.cssText=`
          width: 900px;
          height: 400px;
          padding: 20px;
          box-sizing: border-box;
          border: 5px solid #000000;
          display: flex;
          align-items: center;
          gap: 20px;
          font-size: 40px;
          font-family: "Microsoft YaHei", "PingFang SC", "SimHei", sans-serif;
          color: #000000;
          background: #ffffff;
        `,n.innerHTML=`
          <div style="width: 495.00000000000006px; height: 360px; flex-shrink: 0; border: 1px solid #000000; padding: 5px; box-sizing: border-box; background: #ffffff;">
            <img src="data:image/png;base64,${t.qr_base64}" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: hidden; color: #000000;">
            <div style="font-weight: bold; margin-bottom: 15px; text-align: left; font-size: 48px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000000;">${t.name}</div>
            <div style="margin-bottom: 8px; text-align: left; font-size: 36px; color: #000000;">规格: ${t.spec||`-`}</div>
            <div style="margin-bottom: 8px; text-align: left; font-size: 36px; color: #000000;">数量: ${t.quantity}</div>
            <div style="margin-bottom: 8px; text-align: left; font-size: 36px; color: #000000;">所有人: ${t.owner||`-`}</div>
            <div style="font-size: 28px; color: #000000; text-align: left; font-family: monospace; word-break: break-all; background: #ffffff;">UUID: ${t.uuid}</div>
          </div>
        `,a.appendChild(n);let s=n.querySelector(`img`);s&&await new Promise(e=>{s.complete?e():(s.onload=()=>e(),s.onerror=()=>e())});let l=await r(n,{scale:1,useCORS:!0,allowTaint:!0,backgroundColor:`#ffffff`,logging:!1});a.removeChild(n),e>0&&o.addPage([i.width,i.height]);let u=l.toDataURL(`image/png`);o.addImage(u,`PNG`,0,0,i.width,i.height)}document.body.removeChild(a),o.save(`资产标签_${c.length}张.pdf`),S.success(`已导出 ${c.length} 张标签`)}catch(e){console.error(`导出 PDF 失败:`,e),S.error(`导出 PDF 失败`)}finally{y(!1)}}},A=E();return(0,L.jsxs)(C,{title:`打印标签 (${c.length}个)`,open:e,onCancel:t,width:900,footer:(0,L.jsxs)(`div`,{className:`print-modal-footer`,children:[(0,L.jsx)(a,{onClick:t,children:`取消`}),(0,L.jsx)(a,{icon:(0,L.jsx)(x,{}),onClick:O,loading:v,disabled:c.length===0,children:`导出 PDF`}),(0,L.jsx)(a,{type:`primary`,icon:(0,L.jsx)(k,{}),onClick:D,children:`打印`})]}),children:[(0,L.jsx)(`style`,{children:`
        @page {
          margin: 0;
          size: auto;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .print-labels-container,
          .print-labels-container * {
            visibility: visible;
          }
          .print-labels-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
          }
          .ant-modal-footer,
          .ant-modal-header {
            display: none !important;
          }
          .ant-modal-content {
            box-shadow: none !important;
            padding: 0 !important;
          }
          .label-card {
            border: 1px solid #000000;
            padding: 2mm;
            margin: 0;
            page-break-inside: avoid;
            display: inline-block;
            vertical-align: top;
            box-sizing: border-box;
          }
          .label-card .label-header { display: none; }
          .label-card .label-qr img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .label-card .label-info {
            flex: 1;
            overflow: hidden;
          }
          .label-card .label-info .info-row {
            margin-bottom: 1px;
            color: #000000;
          }
          .label-card .label-title-right {
            font-weight: bold;
            text-align: left;
            margin-bottom: 1mm;
            color: #000000;
          }
          .label-card .label-uuid {
            color: #000000;
            font-family: monospace;
            word-break: break-all;
            text-align: left;
          }
        }
        .print-labels-container {
          min-height: 200px;
          padding-top: 8px;
        }
        .label-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #000000;
          margin-bottom: 12px;
        }
        .label-preview-header .preset-select { width: 180px; }
        .label-preview-header .custom-size {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .label-preview-header .custom-size input { width: 70px; }
        .label-preview-grid {
          display: grid;
          gap: 16px;
          padding: 12px 0;
        }
        .label-card-preview {
          border: 1px solid #000000;
          border-radius: 4px;
          padding: 12px;
          background: #ffffff;
          display: flex;
          gap: 12px;
        }
        .label-card-preview .label-header { display: none; }
        .label-card-preview .label-qr { flex-shrink: 0; }
        .label-card-preview .label-qr img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .label-card-preview .label-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .label-card-preview .label-title-right {
          font-weight: bold;
          font-size: 16px;
          text-align: left;
          margin-bottom: 6px;
          color: #000000;
        }
        .label-card-preview .label-info .info-row {
          display: flex;
          gap: 6px;
          margin-bottom: 4px;
          font-size: 14px;
          text-align: left;
          color: #000000;
        }
        .label-card-preview .label-info .info-label {
          color: #000000;
          min-width: 50px;
          flex-shrink: 0;
        }
        .label-card-preview .label-info .info-value {
          font-weight: 500;
          word-break: break-word;
          color: #000000;
        }
        .label-card-preview .label-uuid {
          font-size: 11px;
          color: #000000;
          font-family: monospace;
          word-break: break-all;
          text-align: left;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px dashed #000000;
        }
      `}),(0,L.jsx)(`div`,{className:`print-labels-container`,style:{minHeight:200},children:o?(0,L.jsxs)(`div`,{style:{textAlign:`center`,padding:40},children:[(0,L.jsx)(w,{size:`large`}),(0,L.jsx)(`p`,{style:{marginTop:16,color:`#999`},children:`正在生成标签...`})]}):c.length===0?(0,L.jsx)(u,{description:`暂无标签数据`}):(0,L.jsxs)(L.Fragment,{children:[(0,L.jsxs)(`div`,{className:`label-preview-header`,children:[(0,L.jsx)(`span`,{style:{fontWeight:500},children:`标签尺寸：`}),(0,L.jsxs)(i,{children:[(0,L.jsx)(n,{className:`preset-select`,value:d,onChange:e=>{if(p(e),e!==`自定义`){let t=H.find(t=>t.label===e);t&&(h(t.width),_(t.height))}},options:H.map(e=>({label:e.label,value:e.label}))}),d===`自定义`&&(0,L.jsxs)(i,{className:`custom-size`,children:[(0,L.jsx)(`span`,{children:`宽:`}),(0,L.jsx)(`input`,{type:`number`,value:m,onChange:e=>h(Number(e.target.value)),min:`20`,max:`200`}),(0,L.jsx)(`span`,{children:`mm`}),(0,L.jsx)(`span`,{children:`高:`}),(0,L.jsx)(`input`,{type:`number`,value:g,onChange:e=>_(Number(e.target.value)),min:`10`,max:`200`}),(0,L.jsx)(`span`,{children:`mm`})]})]})]}),(0,L.jsx)(`div`,{className:`label-preview-grid`,style:{gridTemplateColumns:`repeat(${E().cols}, 1fr)`},children:c.map(e=>{let t=A.width/A.height,n=Math.min(100,A.height*1.5);return(0,L.jsxs)(`div`,{ref:t=>{t&&b.current.set(e.id,t)},className:`label-card-preview label-card`,children:[(0,L.jsx)(`div`,{className:`label-qr`,style:{width:n*t*.6,height:n-24},children:(0,L.jsx)(`img`,{src:`data:image/png;base64,${e.qr_base64}`,alt:`二维码`})}),(0,L.jsxs)(`div`,{className:`label-info`,children:[(0,L.jsx)(`div`,{className:`label-title-right`,children:e.name}),(0,L.jsxs)(`div`,{className:`info-row`,children:[(0,L.jsx)(`span`,{className:`info-label`,children:`规格:`}),(0,L.jsx)(`span`,{className:`info-value`,children:e.spec||`-`})]}),(0,L.jsxs)(`div`,{className:`info-row`,children:[(0,L.jsx)(`span`,{className:`info-label`,children:`数量:`}),(0,L.jsx)(`span`,{className:`info-value`,children:e.quantity})]}),(0,L.jsxs)(`div`,{className:`info-row`,children:[(0,L.jsx)(`span`,{className:`info-label`,children:`所有人:`}),(0,L.jsx)(`span`,{className:`info-value`,children:e.owner||`-`})]}),(0,L.jsxs)(`div`,{className:`label-uuid`,children:[`UUID: `,e.uuid]})]})]},e.id)})}),(0,L.jsx)(`div`,{style:{marginTop:8,padding:`6px 8px`,background:`#e6f7ff`,borderRadius:4,fontSize:11,color:`#1890ff`},children:`💡 提示：导出 PDF 每张标签独立一页；打印时每页可排布多个标签`})]})})]})}function W(){let e=D(),[t,n]=(0,I.useState)(!1),[o,u]=(0,I.useState)([]),[g,v]=(0,I.useState)(0),[x,C]=(0,I.useState)(1),[w,E]=(0,I.useState)(``),[A,j]=(0,I.useState)(),[M,F]=(0,I.useState)([]),[R,B]=(0,I.useState)(!1),[V,H]=(0,I.useState)([]),[W,G]=(0,I.useState)(!1),{message:K}=f.useApp(),q=e=>{H(e)};(0,I.useEffect)(()=>{J()},[]),(0,I.useEffect)(()=>{Y()},[x,w,A]);let J=async()=>{try{F((await N.tree()).data)}catch(e){console.error(`Failed to load categories:`,e)}},Y=async()=>{n(!0);try{let e=await P.list({page:x,page_size:10,keyword:w,category_id:A});u(e.data.items),v(e.data.total)}catch{K.error(`加载资产失败`)}finally{n(!1)}},X=async e=>{try{await P.delete(e),K.success(`删除成功`),Y()}catch{K.error(`删除失败`)}},Z=e=>{H([e.id]),G(!0)};return(0,L.jsxs)(`div`,{id:`asset-list-page`,className:`asset-list-page`,children:[(0,L.jsxs)(`div`,{className:`page-header`,children:[(0,L.jsxs)(`div`,{className:`header-left`,children:[(0,L.jsx)(`h2`,{id:`asset-list-title`,children:`资产管理`}),(0,L.jsxs)(`span`,{id:`asset-list-count`,className:`total-count`,children:[`共 `,g,` 项`]})]}),(0,L.jsxs)(i,{children:[(0,L.jsx)(a,{id:`asset-list-import-btn`,icon:(0,L.jsx)(O,{}),onClick:()=>B(!0),children:`批量导入`}),(0,L.jsx)(a,{id:`asset-list-add-btn`,type:`primary`,icon:(0,L.jsx)(l,{}),onClick:()=>e(`/assets/new`),children:`新增资产`})]})]}),V.length>0&&(0,L.jsxs)(`div`,{id:`asset-list-selection-bar`,className:`selection-bar`,children:[(0,L.jsxs)(`div`,{className:`selection-info`,children:[(0,L.jsxs)(`span`,{id:`asset-list-selection-count`,className:`selection-count`,children:[`已选择 `,(0,L.jsx)(`strong`,{children:V.length}),` 项资产`]}),(0,L.jsx)(a,{id:`asset-list-clear-selection-btn`,type:`link`,size:`small`,icon:(0,L.jsx)(b,{}),onClick:()=>H([]),children:`清除选择`})]}),(0,L.jsxs)(a,{id:`asset-list-batch-print-btn`,type:`primary`,icon:(0,L.jsx)(k,{}),onClick:()=>G(!0),children:[`打印标签 (`,V.length,`)`]})]}),(0,L.jsx)(`div`,{id:`asset-list-filter-section`,className:`filter-section`,children:(0,L.jsxs)(`div`,{className:`filter-row`,children:[(0,L.jsx)(r,{id:`asset-list-search-input`,prefix:(0,L.jsx)(d,{style:{color:`#bfbfbf`}}),placeholder:`搜索资产名称/所有人/位置`,value:w,onChange:e=>{E(e.target.value),C(1)},style:{width:280},allowClear:!0,className:`search-input`}),(0,L.jsx)(y,{id:`asset-list-category-select`,placeholder:`选择分类`,style:{width:200},allowClear:!0,treeDefaultExpandAll:!0,value:A,onChange:e=>{j(e),C(1)},fieldNames:{label:`name`,value:`id`,children:`children`},treeData:M,className:`category-tree-select`}),(w||A)&&(0,L.jsx)(a,{id:`asset-list-clear-filter-btn`,type:`link`,onClick:()=>{E(``),j(void 0),C(1)},className:`clear-filter-btn`,children:`清除筛选`})]})}),(0,L.jsx)(c,{id:`asset-list-table-card`,className:`table-card`,children:(0,L.jsx)(_,{id:`asset-list-table`,rowKey:`id`,loading:t,dataSource:o,columns:[{title:`资产名称`,dataIndex:`name`,key:`name`,width:180,render:(e,t)=>(0,L.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:8},children:[(0,L.jsx)(`span`,{style:{fontWeight:500},children:e}),t.quantity>0&&(0,L.jsx)(s,{count:t.quantity,style:{backgroundColor:`#52c41a`,fontSize:10},showZero:!1})]})},{title:`分类`,dataIndex:`category`,key:`category`,width:100,render:e=>e?.name?(0,L.jsx)(h,{color:`blue`,children:e.name}):`-`},{title:`规格`,dataIndex:`spec`,key:`spec`,minWidth:100},{title:`所有人`,dataIndex:`owner`,key:`owner`,minWidth:80},{title:`存放位置`,dataIndex:`location`,key:`location`,minWidth:100},{title:`数量`,dataIndex:`quantity`,key:`quantity`,width:70,align:`center`},{title:`UUID`,dataIndex:`uuid`,key:`uuid`,width:140,render:e=>(0,L.jsx)(T,{title:e,children:(0,L.jsx)(h,{style:{cursor:`pointer`,fontFamily:`monospace`,fontSize:11},onClick:()=>{navigator.clipboard.writeText(e),K.success(`已复制`)},children:e})})},{title:`操作`,key:`action`,width:150,render:(t,n)=>(0,L.jsxs)(i,{size:`small`,children:[(0,L.jsx)(T,{title:`打印标签`,children:(0,L.jsx)(a,{type:`text`,icon:(0,L.jsx)(k,{}),size:`small`,onClick:()=>Z(n)})}),(0,L.jsx)(T,{title:`编辑`,children:(0,L.jsx)(a,{type:`text`,icon:(0,L.jsx)(m,{}),size:`small`,onClick:()=>e(`/assets/${n.id}`)})}),(0,L.jsx)(p,{title:`确定删除？`,onConfirm:()=>X(n.id),children:(0,L.jsx)(T,{title:`删除`,children:(0,L.jsx)(a,{type:`text`,danger:!0,icon:(0,L.jsx)(S,{}),size:`small`})})})]})}],scroll:{x:1e3},pagination:{current:x,total:g,pageSize:10,showSizeChanger:!1,showTotal:e=>`共 ${e} 条`,onChange:C},rowSelection:{selectedRowKeys:V,onChange:q},size:`middle`})}),(0,L.jsx)(z,{open:R,onClose:()=>B(!1),onSuccess:Y}),(0,L.jsx)(U,{open:W,onClose:()=>{G(!1),H([])},assetIds:V}),(0,L.jsx)(`style`,{children:`
        .asset-list-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
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
          margin-bottom: 8px;
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

        /* 筛选区域 */
        .filter-section {
          background: #fff;
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        /* 批量选择操作栏 */
        .selection-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(102, 126, 234, 0.3);
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .selection-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .selection-count {
          color: #fff;
          font-size: 14px;
        }

        .selection-count strong {
          font-size: 16px;
          margin-right: 4px;
        }

        .selection-bar .ant-btn-link {
          color: rgba(255, 255, 255, 0.8);
          padding: 0;
        }

        .selection-bar .ant-btn-link:hover {
          color: #fff;
        }

        .selection-bar .ant-btn-primary {
          background: #fff;
          color: #667eea;
          border: none;
          font-weight: 600;
        }

        .selection-bar .ant-btn-primary:hover {
          background: #f0f0f0;
          color: #5a6fd6;
        }

        .filter-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-input {
          border-radius: 8px;
          transition: all 0.2s;
        }

        .search-input:hover,
        .search-input:focus-within {
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .category-tree-select {
          border-radius: 8px;
        }

        .clear-filter-btn {
          color: #8c8c8c;
          padding-left: 8px;
        }

        .clear-filter-btn:hover {
          color: #667eea;
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

        .table-card .ant-table-wrapper {
          margin: 0;
        }

        /* 表格样式优化 */
        .table-card .ant-table-thead > tr > th {
          background: #fafafa;
          font-weight: 600;
          color: #333;
        }

        .table-card .ant-table-tbody > tr:hover > td {
          background: #f9f9ff;
        }

        /* 按钮样式优化 */
        .page-header .ant-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          transition: all 0.2s;
        }

        .page-header .ant-btn-primary:hover {
          background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .page-header .ant-btn:not(.ant-btn-primary) {
          border-color: #d9d9d9;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .page-header .ant-btn:not(.ant-btn-primary):hover {
          border-color: #667eea;
          color: #667eea;
        }

        /* 移动端适配 */
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
          }

          .filter-section {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            padding: 14px 16px;
            border-radius: 14px;
            margin-bottom: 12px;
          }

          .filter-row {
            flex-direction: column;
            gap: 10px;
          }

          .filter-row .ant-input,
          .filter-row .ant-select,
          .filter-row .ant-tree-select {
            width: 100% !important;
            border-radius: 10px;
          }

          .page-header h2 {
            font-size: 18px;
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
          .asset-list-page .ant-table {
            font-size: 12px;
            min-width: 600px;
            border-radius: 12px;
            overflow: hidden;
          }

          .asset-list-page .ant-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border-radius: 12px;
          }

          .asset-list-page .ant-table-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .asset-list-page .ant-table-body {
            overflow-x: auto;
          }
        }

        /* 移动端批量选择栏适配 */
        @media (max-width: 576px) {
          .selection-bar {
            flex-direction: column;
            gap: 14px;
            padding: 16px;
            border-radius: 14px;
          }

          .selection-info {
            width: 100%;
            justify-content: space-between;
          }

          .selection-bar .ant-btn-primary {
            width: 100%;
            height: 46px;
            border-radius: 12px;
          }
        }
      `})]})}export{W as default};