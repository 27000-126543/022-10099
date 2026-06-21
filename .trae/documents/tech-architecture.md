## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["React 18 + Vite"] --> B["React Router v6"]
        B --> C["页面组件"]
        C --> C1["总览大屏"]
        C --> C2["渠道分析"]
        C --> C3["项目漏斗"]
        C --> C4["人员追踪"]
        C --> C5["异常预警"]
        C --> C6["复盘报告"]
    end
    subgraph "数据层"
        D["Mock 数据模块"] --> D1["渠道数据"]
        D --> D2["项目数据"]
        D --> D3["人员数据"]
        D --> D4["预警数据"]
        D --> D5["月度数据"]
    end
    subgraph "可视化层"
        E["Recharts"] --> E1["折线图"]
        E --> E2["柱状图"]
        E --> E3["漏斗图"]
        E --> E4["环形图"]
        E --> E5["热力图"]
        F["CSS 动画"] --> F1["CountUp"]
        F --> F2["进度条"]
        F --> F3["脉冲效果"]
    end
    C1 --> D
    C2 --> D
    C3 --> D
    C4 --> D
    C5 --> D
    C6 --> D
    C1 --> E
    C2 --> E
    C3 --> E
    C4 --> E
    C5 --> E
    C6 --> E
```

## 2. 技术说明

- **前端框架**：React@18 + TypeScript
- **构建工具**：Vite
- **样式方案**：Tailwind CSS@3 + CSS Modules（用于复杂动画）
- **路由**：React Router v6
- **图表库**：Recharts（折线图、柱状图、面积图）+ 自定义 SVG（漏斗图、热力图）
- **动画库**：framer-motion（页面切换、组件入场动画）
- **数据管理**：React Context + 自定义 Hooks，无后端，全部 Mock 数据
- **PDF 导出**：html2canvas + jsPDF
- **后端**：无，纯前端项目
- **数据库**：无，使用 TypeScript 常量文件模拟数据

## 3. 路由定义

| 路由 | 用途 | 页面组件 |
|------|------|----------|
| `/` | 重定向到总览大屏 | Redirect |
| `/overview` | 总览大屏，核心指标概览 | OverviewPage |
| `/channel` | 渠道分析，渠道质量与成本 | ChannelPage |
| `/funnel` | 项目漏斗，项目转化分析 | FunnelPage |
| `/personnel` | 人员追踪，顾问跟进效率 | PersonnelPage |
| `/alert` | 异常预警，超期和下滑预警 | AlertPage |
| `/report` | 复盘报告，月度复盘与导出 | ReportPage |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    CHANNEL {
        string id PK
        string name
        string color
        number dailyCost
    }
    DAILY_CHANNEL_STATS {
        string channelId FK
        string date
        number newLeads
        number validLeads
        number booked
        number arrived
        number dealAmount
        number avgFirstResponseMin
    }
    PROJECT {
        string id PK
        string name
        string color
    }
    DAILY_PROJECT_STATS {
        string projectId FK
        string date
        number leads
        number booked
        number arrived
        number closed
        number dealAmount
    }
    CONSULTANT {
        string id PK
        string name
        string avatar
    }
    CONSULTANT_DAILY {
        string consultantId FK
        string date
        number activeLeads
        number avgFirstResponseMin
        number booked
        number arrived
        number closed
        number dealAmount
        number repeatPurchase
        number referralCount
    }
    ALERT_ITEM {
        string id PK
        string type
        string severity
        string title
        string description
        string date
        boolean resolved
    }
    MONTHLY_REPORT {
        string month
        number totalLeads
        number validRate
        number bookingRate
        number arrivalRate
        number totalDealAmount
        number repeatPurchaseRate
        number referralRate
    }
    LOST_REASON {
        string projectId FK
        string reason
        number count
    }
    CHANNEL ||--o{ DAILY_CHANNEL_STATS : "has"
    PROJECT ||--o{ DAILY_PROJECT_STATS : "has"
    PROJECT ||--o{ LOST_REASON : "has"
    CONSULTANT ||--o{ CONSULTANT_DAILY : "has"
```

## 5. 项目结构

```
src/
├── main.tsx                    # 入口文件
├── App.tsx                     # 根组件，路由配置
├── index.css                   # 全局样式 + Tailwind
├── types/                      # TypeScript 类型定义
│   └── index.ts
├── data/                       # Mock 数据
│   ├── channels.ts
│   ├── projects.ts
│   ├── consultants.ts
│   ├── alerts.ts
│   └── reports.ts
├── hooks/                      # 自定义 Hooks
│   ├── useCountUp.ts
│   └── useDateRange.ts
├── components/                 # 通用组件
│   ├── Layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── PageWrapper.tsx
│   ├── Cards/
│   │   ├── MetricCard.tsx
│   │   └── AlertCard.tsx
│   ├── Charts/
│   │   ├── FunnelChart.tsx
│   │   ├── HeatmapChart.tsx
│   │   ├── RingChart.tsx
│   │   └── Sparkline.tsx
│   └── UI/
│       ├── Badge.tsx
│       ├── Modal.tsx
│       └── Table.tsx
└── pages/                      # 页面组件
    ├── OverviewPage.tsx
    ├── ChannelPage.tsx
    ├── FunnelPage.tsx
    ├── PersonnelPage.tsx
    ├── AlertPage.tsx
    └── ReportPage.tsx
```
