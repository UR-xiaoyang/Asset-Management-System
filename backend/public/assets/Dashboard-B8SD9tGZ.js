import{r as e}from"./rolldown-runtime-S-ySWqyJ.js";import{$ as t,F as n,M as r,R as i,b as a,c as o,h as s,j as c,m as l}from"./vendor-antd-Xac7S3WS.js";import{s as u}from"./vendor-react-B8PdV_Sd.js";import{C as d,a as f,w as p,x as m}from"./vendor-icons-jTmcUf7H.js";import{c as h,n as g,r as _}from"./index-dRS3hhno.js";var v=e(t(),1),y=h();function b(){let e=u(),[t,h]=(0,v.useState)(0),[b,x]=(0,v.useState)(0),[S,C]=(0,v.useState)(0),[w,T]=(0,v.useState)([]);(0,v.useEffect)(()=>{E()},[]);let E=async()=>{try{let[e,t,n]=await Promise.all([g.list({page:1,page_size:1}),_.list({page:1,page_size:100}),_.pending()]);h(e.data.total),x(n.data.length);let r=t.data.items;T(r.slice(0,5)),C(r.filter(e=>e.status===`approved`).length)}catch(e){console.error(`Failed to load stats:`,e)}},D=e=>{let{color:t,text:n}={pending:{color:`orange`,text:`待审批`},approved:{color:`green`,text:`已通过`},rejected:{color:`red`,text:`已拒绝`},returned:{color:`blue`,text:`已归还`}}[e]||{color:`default`,text:e};return(0,y.jsx)(o,{color:t,children:n})};return(0,y.jsxs)(`div`,{className:`dashboard-page`,children:[(0,y.jsxs)(`div`,{className:`page-header`,children:[(0,y.jsx)(`h1`,{id:`dashboard-title`,children:`欢迎回来 👋`}),(0,y.jsx)(`p`,{id:`dashboard-subtitle`,className:`subtitle`,children:`实时查看实验室资产统计数据`})]}),(0,y.jsxs)(s,{gutter:[20,20],children:[(0,y.jsx)(c,{xs:24,sm:12,lg:6,children:(0,y.jsxs)(r,{className:`stat-card stat-card-green`,children:[(0,y.jsx)(`div`,{className:`stat-icon-wrapper`,children:(0,y.jsx)(`div`,{className:`stat-icon stat-icon-green`,children:(0,y.jsx)(m,{})})}),(0,y.jsx)(`div`,{className:`stat-content`,children:(0,y.jsx)(l,{title:`资产总数`,value:t,styles:{content:{color:`#52c41a`,fontWeight:600}}})}),(0,y.jsxs)(`div`,{className:`stat-trend up`,children:[(0,y.jsx)(`span`,{children:`+12%`}),` 较上月`]})]})}),(0,y.jsx)(c,{xs:24,sm:12,lg:6,children:(0,y.jsxs)(r,{className:`stat-card stat-card-orange`,children:[(0,y.jsx)(`div`,{className:`stat-icon-wrapper`,children:(0,y.jsx)(`div`,{className:`stat-icon stat-icon-orange`,children:(0,y.jsx)(p,{})})}),(0,y.jsx)(`div`,{className:`stat-content`,children:(0,y.jsx)(l,{title:`待审批`,value:b,styles:{content:{color:`#fa8c16`,fontWeight:600}}})}),(0,y.jsxs)(`div`,{className:`stat-trend down`,children:[(0,y.jsx)(`span`,{children:`-5%`}),` 较上周`]})]})}),(0,y.jsx)(c,{xs:24,sm:12,lg:6,children:(0,y.jsxs)(r,{className:`stat-card stat-card-blue`,children:[(0,y.jsx)(`div`,{className:`stat-icon-wrapper`,children:(0,y.jsx)(`div`,{className:`stat-icon stat-icon-blue`,children:(0,y.jsx)(f,{})})}),(0,y.jsx)(`div`,{className:`stat-content`,children:(0,y.jsx)(l,{title:`借用中`,value:S,styles:{content:{color:`#1890ff`,fontWeight:600}}})}),(0,y.jsxs)(`div`,{className:`stat-trend up`,children:[(0,y.jsx)(`span`,{children:`+3%`}),` 较上周`]})]})}),(0,y.jsx)(c,{xs:24,sm:12,lg:6,children:(0,y.jsxs)(r,{className:`stat-card stat-card-purple`,children:[(0,y.jsx)(`div`,{className:`stat-icon-wrapper`,children:(0,y.jsx)(`div`,{className:`stat-icon stat-icon-purple`,children:(0,y.jsx)(d,{})})}),(0,y.jsx)(`div`,{className:`stat-content`,children:(0,y.jsx)(l,{title:`本月借用`,value:w.length,styles:{content:{color:`#722ed1`,fontWeight:600}}})}),(0,y.jsx)(`div`,{className:`stat-trend neutral`,children:`持续增长`})]})})]}),(0,y.jsxs)(s,{gutter:[20,20],style:{marginTop:24},children:[(0,y.jsx)(c,{xs:24,xl:16,children:(0,y.jsx)(r,{className:`recent-card`,title:(0,y.jsxs)(`div`,{className:`card-title-wrapper`,children:[(0,y.jsx)(`span`,{children:`最近借用记录`}),(0,y.jsx)(n,{type:`link`,id:`dashboard-view-more-borrows`,onClick:()=>e(`/borrows`),className:`view-more`,children:`查看更多 →`})]}),children:w.length>0?(0,y.jsx)(a,{dataSource:w,renderItem:e=>(0,y.jsxs)(a.Item,{className:`borrow-item`,children:[(0,y.jsx)(a.Item.Meta,{avatar:(0,y.jsx)(i,{icon:(0,y.jsx)(f,{}),style:{background:`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,boxShadow:`0 2px 8px rgba(102, 126, 234, 0.3)`}}),title:`${e.borrower_name} · ${e.asset?.name||e.asset_uuid}`,description:(0,y.jsxs)(`span`,{className:`borrow-meta`,children:[`借用了 `,(0,y.jsxs)(o,{color:`blue`,children:[e.quantity,` 件`]}),` · `,e.borrow_date]})}),(0,y.jsx)(`div`,{className:`borrow-action`,children:D(e.status)})]})}):(0,y.jsxs)(`div`,{className:`empty-state`,children:[(0,y.jsx)(d,{className:`empty-icon`}),(0,y.jsx)(`p`,{children:`暂无借用记录`})]})})}),(0,y.jsxs)(c,{xs:24,xl:8,children:[(0,y.jsx)(r,{className:`quick-card`,title:`快捷操作`,children:(0,y.jsxs)(`div`,{className:`quick-actions`,children:[(0,y.jsxs)(`a`,{id:`dashboard-add-asset`,onClick:()=>e(`/assets/new`),className:`quick-action-item`,children:[(0,y.jsx)(`div`,{className:`quick-icon`,style:{background:`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`},children:(0,y.jsx)(m,{})}),(0,y.jsx)(`span`,{children:`添加资产`})]}),(0,y.jsxs)(`a`,{id:`dashboard-borrow-approval`,onClick:()=>e(`/borrows`),className:`quick-action-item`,children:[(0,y.jsx)(`div`,{className:`quick-icon`,style:{background:`linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`},children:(0,y.jsx)(f,{})}),(0,y.jsx)(`span`,{children:`借用审批`})]}),(0,y.jsxs)(`a`,{id:`dashboard-category-manage`,onClick:()=>e(`/categories`),className:`quick-action-item`,children:[(0,y.jsx)(`div`,{className:`quick-icon`,style:{background:`linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`},children:(0,y.jsx)(d,{})}),(0,y.jsx)(`span`,{children:`分类管理`})]}),(0,y.jsxs)(`a`,{id:`dashboard-scan-borrow`,onClick:()=>e(`/scan`),className:`quick-action-item`,children:[(0,y.jsx)(`div`,{className:`quick-icon`,style:{background:`linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)`},children:(0,y.jsx)(m,{})}),(0,y.jsx)(`span`,{children:`扫码借用`})]})]})}),(0,y.jsxs)(r,{className:`tips-card`,style:{marginTop:20},children:[(0,y.jsx)(`div`,{className:`tips-header`,children:(0,y.jsx)(`span`,{children:`💡 小贴士`})}),(0,y.jsx)(`p`,{className:`tips-content`,children:`点击左侧菜单「资产管理」，可以快速添加新资产或批量导入现有资产。`})]})]})]}),(0,y.jsx)(`style`,{children:`
        .dashboard-page {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          color: #8c8c8c;
          margin: 0;
          font-size: 15px;
        }

        /* 统计卡片 */
        .stat-card {
          border-radius: 16px;
          border: none;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .stat-card-green::before { background: linear-gradient(90deg, #52c41a, #73d13d); }
        .stat-card-orange::before { background: linear-gradient(90deg, #fa8c16, #ffa940); }
        .stat-card-blue::before { background: linear-gradient(90deg, #1890ff, #40a9ff); }
        .stat-card-purple::before { background: linear-gradient(90deg, #722ed1, #9254de); }

        .stat-card .ant-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .stat-icon-wrapper {
          margin-bottom: 16px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #fff;
        }

        .stat-icon-green { background: linear-gradient(135deg, #52c41a, #73d13d); }
        .stat-icon-orange { background: linear-gradient(135deg, #fa8c16, #ffa940); }
        .stat-icon-blue { background: linear-gradient(135deg, #1890ff, #40a9ff); }
        .stat-icon-purple { background: linear-gradient(135deg, #722ed1, #9254de); }

        .stat-content {
          flex: 1;
        }

        .stat-content .ant-statistic-title {
          color: #8c8c8c;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .stat-content .ant-statistic-content {
          font-size: 32px;
        }

        .stat-trend {
          margin-top: 12px;
          font-size: 12px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }

        .stat-trend.up { color: #52c41a; }
        .stat-trend.down { color: #f5222d; }
        .stat-trend.neutral { color: #8c8c8c; }

        .stat-trend span {
          font-weight: 600;
          margin-right: 4px;
        }

        /* 最近记录卡片 */
        .recent-card {
          border-radius: 16px;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .recent-card .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
        }

        .card-title-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          font-weight: 600;
        }

        .view-more {
          font-weight: 400;
          font-size: 14px;
          color: #1890ff;
        }

        .borrow-item {
          padding: 16px 0;
          transition: background 0.2s;
        }

        .borrow-item:hover {
          background: #fafafa;
          margin: 0 -24px;
          padding: 16px 24px;
        }

        .borrow-meta {
          color: #8c8c8c;
        }

        .borrow-action {
          display: flex;
          align-items: center;
        }

        .empty-state {
          text-align: center;
          padding: 48px 0;
          color: #8c8c8c;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          color: #d9d9d9;
        }

        /* 快捷操作卡片 */
        .quick-card {
          border-radius: 16px;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .quick-action-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 12px;
          background: #fafafa;
          border-radius: 12px;
          text-decoration: none;
          color: #333;
          transition: all 0.2s;
        }

        .quick-action-item:hover {
          background: #f0f0f0;
          transform: translateY(-2px);
        }

        .quick-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #fff;
          margin-bottom: 10px;
        }

        .quick-action-item span {
          font-size: 13px;
          font-weight: 500;
        }

        /* 小贴士卡片 */
        .tips-card {
          border-radius: 16px;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          background: linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%);
        }

        .tips-header {
          font-weight: 600;
          margin-bottom: 8px;
        }

        .tips-content {
          color: #8c6d1f;
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 22px;
          }

          .page-header {
            margin-bottom: 16px;
          }

          .stat-card {
            border-radius: 16px;
            margin-bottom: 4px;
          }

          .stat-card::before {
            height: 3px;
          }

          .stat-card .ant-card-body {
            padding: 16px;
            flex-direction: row;
            align-items: center;
            gap: 14px;
          }

          .stat-icon-wrapper {
            margin-bottom: 0;
          }

          .stat-icon {
            width: 44px;
            height: 44px;
            font-size: 20px;
          }

          .stat-content {
            flex: 1;
          }

          .stat-content .ant-statistic-title {
            font-size: 12px;
            margin-bottom: 2px;
          }

          .stat-content .ant-statistic-content {
            font-size: 22px;
          }

          .stat-trend {
            display: none;
          }

          .recent-card {
            border-radius: 16px;
          }

          .recent-card .ant-card-body {
            padding: 12px;
          }

          .card-title-wrapper {
            font-size: 14px;
          }

          .view-more {
            font-size: 12px;
            padding: 0;
          }

          .borrow-item {
            padding: 12px 0;
          }

          .borrow-item:hover {
            margin: 0 -12px;
            padding: 12px;
          }

          .quick-card {
            border-radius: 16px;
          }

          .quick-actions {
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }

          .quick-action-item {
            padding: 12px 6px;
          }

          .quick-icon {
            width: 36px;
            height: 36px;
            font-size: 16px;
            margin-bottom: 6px;
          }

          .quick-action-item span {
            font-size: 11px;
            text-align: center;
          }

          .tips-card {
            border-radius: 16px;
            margin-top: 12px;
          }
        }

        @media (max-width: 576px) {
          .page-header h1 {
            font-size: 20px;
          }

          .subtitle {
            font-size: 13px;
          }

          .stat-content .ant-statistic-content {
            font-size: 20px;
          }

          .quick-actions {
            grid-template-columns: repeat(2, 1fr);
          }

          .quick-action-item span {
            font-size: 12px;
          }
        }
      `})]})}export{b as default};