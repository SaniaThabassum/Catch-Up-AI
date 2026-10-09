/**
 * Sample Chat Datasets for "What Did I Miss?" Local-First AI Micro-App
 * Realistic multi-participant conversations with urgent incidents, deadlines,
 * decisions, announcements, changed plans, and conflicting updates.
 */

const SAMPLE_DATASETS = {
  incident: {
    id: "incident",
    name: "🚨 #war-room-api-outage",
    channel: "war-room-api-outage",
    platform: "Slack",
    description: "Production incident: API Gateway 502 errors and database connection pool exhaustion.",
    unreadCount: 25,
    timeRange: "Today, 1:45 PM - 3:30 PM",
    participants: ["David (DevOps)", "Sarah (Incident Commander)", "Alex (Frontend Lead)", "Elena (DBA)", "PagerDuty Bot"],
    messages: [
      {
        id: "m1",
        author: "PagerDuty Bot",
        time: "1:45 PM",
        text: "🚨 [CRITICAL ALERT] Service 'api-gateway' is returning 502 Bad Gateway to 42% of incoming traffic. P99 latency exceeded 4500ms."
      },
      {
        id: "m2",
        author: "Sarah",
        time: "1:47 PM",
        text: "Announcement: I am stepping in as Incident Commander. P0 Incident is officially declared. Everyone please keep chatter in this channel."
      },
      {
        id: "m3",
        author: "David",
        time: "1:49 PM",
        text: "Checking AWS CloudWatch. Looks like RDS PostgreSQL connection pool is completely pegged at 100% capacity."
      },
      {
        id: "m4",
        author: "Elena",
        time: "1:52 PM",
        text: "I see 120 idle transactions stuck on the orders table from the latest deployment v2.4.2 that went out 30 minutes ago."
      },
      {
        id: "m5",
        author: "Sarah",
        time: "1:55 PM",
        text: "@David can you inspect if connection pool max limits can be bumped temporarily or if we must rollback?"
      },
      {
        id: "m6",
        author: "David",
        time: "1:58 PM",
        text: "Bumping limits won't fix it; the leaked connections don't close. We need an immediate rollback."
      },
      {
        id: "m7",
        author: "Sarah",
        time: "2:01 PM",
        text: "Decision: We are rolling back release v2.4.2 immediately to v2.4.1 to restore traffic stability."
      },
      {
        id: "m8",
        author: "Sarah",
        time: "2:03 PM",
        text: "@David please initiate the rollback on Kubernetes prod cluster ASAP. We have to finish before 2:30 PM."
      },
      {
        id: "m9",
        author: "David",
        time: "2:06 PM",
        text: "Rollback initiated. Pods are cycling now. ETA 8 minutes."
      },
      {
        id: "m10",
        author: "Sarah",
        time: "2:10 PM",
        text: "@Alex are customers seeing 502 error screens or is the client fallback cache showing friendly offline states?"
      },
      {
        id: "m11",
        author: "Sarah",
        time: "2:12 PM",
        text: "@Alex we urgently need your verification on the web checkout page once v2.4.1 is back online, deadline by 2:40 PM."
      },
      {
        id: "m12",
        author: "Elena",
        time: "2:15 PM",
        text: "I manually terminated the 120 blocked transactions. DB CPU dropped from 98% down to 24%."
      },
      {
        id: "m13",
        author: "David",
        time: "2:19 PM",
        text: "Kubernetes rollback complete. All 18 pods healthy on v2.4.1."
      },
      {
        id: "m14",
        author: "Sarah",
        time: "2:22 PM",
        text: "Traffic looks stable now. Error rate dropped under 0.1%."
      },
      {
        id: "m15",
        author: "Sarah",
        time: "2:25 PM",
        text: "Action Item: @David flush all Redis session caches and monitor memory consumption until 4 PM."
      },
      {
        id: "m16",
        author: "Sarah",
        time: "2:28 PM",
        text: "Action Item: @Elena write up root cause analysis for the unclosed DB transaction leak by EOD tomorrow."
      },
      {
        id: "m17",
        author: "Sarah",
        time: "2:31 PM",
        text: "Action Item: @Alex verify frontend checkout and user login flows on prod, and report back in this thread."
      },
      {
        id: "m18",
        author: "David",
        time: "2:35 PM",
        text: "Redis cache flushed. Memory stable at 38%."
      },
      {
        id: "m19",
        author: "Sarah",
        time: "2:40 PM",
        text: "Decision: We will hold off on any further production deployments until Elena's connection leak fix is reviewed and load tested."
      },
      {
        id: "m20",
        author: "Sarah",
        time: "2:45 PM",
        text: "Action Item: @Sarah draft customer-facing status update for statuspage.io by 3:15 PM today."
      },
      {
        id: "m21",
        author: "David",
        time: "2:52 PM",
        text: "All monitoring green for the past 30 minutes. Latency back to 68ms."
      },
      {
        id: "m22",
        author: "Sarah",
        time: "3:00 PM",
        text: "Announcement: Incident closed. Post-mortem sync is scheduled for tomorrow at 10:00 AM in Conference Room 3A."
      },
      {
        id: "m23",
        author: "Sarah",
        time: "3:15 PM",
        text: "Update: Post-mortem meeting rescheduled from 10:00 AM to 11:30 AM tomorrow, and venue changed to Google Meet link https://meet.google.com/abc-xyz instead of Room 3A."
      },
      {
        id: "m24",
        author: "David",
        time: "3:20 PM",
        text: "Correction: Initial alert estimated 42% traffic impact, but final CloudFront logs confirm only 18% of checkout requests were affected."
      },
      {
        id: "m25",
        author: "Sarah",
        time: "3:30 PM",
        text: "Thanks everyone for the rapid turnaround. Great teamwork."
      }
    ]
  },

  launch: {
    id: "launch",
    name: "🚀 #q4-product-launch",
    channel: "q4-product-launch",
    platform: "Slack",
    description: "Launch countdown: Design assets, Apple Pay PR, pricing page revisions, marketing blast.",
    unreadCount: 18,
    timeRange: "Today, 9:00 AM - 1:45 PM",
    participants: ["Sarah (Product Lead)", "Alex (Frontend Lead)", "David (Backend)", "Elena (Design)", "Marcus (Marketing)"],
    messages: [
      {
        id: "l1",
        author: "Sarah",
        time: "9:00 AM",
        text: "Announcement: Good morning team! Today is Launch Day - 2 for Q4. Code freeze was originally set for 7:00 PM tonight."
      },
      {
        id: "l2",
        author: "Marcus",
        time: "9:15 AM",
        text: "Press release is finalized with TechCrunch! Embargo lifts Thursday at 8:00 AM PST."
      },
      {
        id: "l3",
        author: "Elena",
        time: "9:30 AM",
        text: "I uploaded the final hero banners and social cards to Figma. Check the 'Launch Final' page."
      },
      {
        id: "l4",
        author: "Sarah",
        time: "9:45 AM",
        text: "Decision: We agreed to launch with the annual billing discount set at 25% off instead of 20% to drive upfront ARR."
      },
      {
        id: "l5",
        author: "Marcus",
        time: "10:00 AM",
        text: "Love that decision. That will convert much higher on the landing page."
      },
      {
        id: "l6",
        author: "Sarah",
        time: "10:15 AM",
        text: "@Alex what is the status of PR #842 for Apple Pay and Google Pay one-click checkout? Is it ready for staging review?"
      },
      {
        id: "l7",
        author: "David",
        time: "10:30 AM",
        text: "Stripe webhook handlers are already deployed and verified in sandbox."
      },
      {
        id: "l8",
        author: "Sarah",
        time: "10:45 AM",
        text: "@Alex please make sure to merge PR #842 and deploy to staging by 2:00 PM today so QA can sign off."
      },
      {
        id: "l9",
        author: "Sarah",
        time: "11:00 AM",
        text: "Action Item: @Alex review mobile responsiveness on the checkout modal before code freeze."
      },
      {
        id: "l10",
        author: "Elena",
        time: "11:20 AM",
        text: "@Sarah do we have consensus on the dark mode onboarding toggle?"
      },
      {
        id: "l11",
        author: "Sarah",
        time: "11:35 AM",
        text: "Decision: We will respect system preference for theme by default on initial sign up."
      },
      {
        id: "l12",
        author: "Marcus",
        time: "11:50 AM",
        text: "Action Item: @Marcus configure Google Ads campaign budget cap at $10,000/week starting Thursday morning."
      },
      {
        id: "l13",
        author: "Sarah",
        time: "12:10 PM",
        text: "Action Item: @David enable database read replica autoscaling by 5:00 PM today to handle launch traffic spike."
      },
      {
        id: "l14",
        author: "David",
        time: "12:30 PM",
        text: "Will do. Taking care of that right after lunch."
      },
      {
        id: "l15",
        author: "Sarah",
        time: "1:00 PM",
        text: "Update: Code freeze is rescheduled from 7:00 PM to 8:30 PM tonight to allow QA enough buffer on the Apple Pay PR."
      },
      {
        id: "l16",
        author: "Sarah",
        time: "1:15 PM",
        text: "@Alex do you need any backend assistance on the checkout PR or are you all set?"
      },
      {
        id: "l17",
        author: "Marcus",
        time: "1:30 PM",
        text: "Announcement: Launch press release embargo moved to Friday 9:00 AM PST instead of Thursday morning per PR agency advice."
      },
      {
        id: "l18",
        author: "David",
        time: "1:45 PM",
        text: "Tentative notice: Database replica autoscaling might need 30 minutes of read-only mode during migration; pending final approval."
      }
    ]
  },

  backend: {
    id: "backend",
    name: "🛠️ #core-architecture",
    channel: "core-architecture",
    platform: "Discord",
    description: "Database migration RFC debate: DynamoDB vs PostgreSQL vs Redis caching tier.",
    unreadCount: 14,
    timeRange: "Yesterday, 3:00 PM - 6:45 PM",
    participants: ["David (Lead Architect)", "Elena (Senior DBA)", "Alex (Frontend Lead)", "Sarah (Director of Eng)"],
    messages: [
      {
        id: "b1",
        author: "David",
        time: "3:00 PM",
        text: "Team, we need to finalize the RFC on replacing our legacy MongoDB cluster before next sprint."
      },
      {
        id: "b2",
        author: "Elena",
        time: "3:15 PM",
        text: "I ran performance benchmarks on PostgreSQL 16 with pgvector and Timescale extensions. Query latency was 4x lower."
      },
      {
        id: "b3",
        author: "David",
        time: "3:30 PM",
        text: "What about write throughput during high burst ingestion?"
      },
      {
        id: "b4",
        author: "Elena",
        time: "3:45 PM",
        text: "With partitioned tables and PgBouncer connection pooling, Postgres handled 25,000 writes/sec without dropping a single packet."
      },
      {
        id: "b5",
        author: "Sarah",
        time: "4:00 PM",
        text: "That satisfies our 3-year growth forecast. How does migration impact frontend GraphQL queries?"
      },
      {
        id: "b6",
        author: "David",
        time: "4:15 PM",
        text: "@Alex will the client-side GraphQL schema require breaking changes if we move to strict relational foreign keys?"
      },
      {
        id: "b7",
        author: "Sarah",
        time: "4:30 PM",
        text: "Decision: We are officially adopting PostgreSQL 16 managed on AWS RDS as our primary datastore."
      },
      {
        id: "b8",
        author: "Sarah",
        time: "4:45 PM",
        text: "Decision: We will use Prisma ORM with strict type generation across both backend and frontend repositories."
      },
      {
        id: "b9",
        author: "David",
        time: "5:00 PM",
        text: "Action Item: @David create the Terraform scripts for RDS Aurora multi-AZ cluster by Friday 4 PM."
      },
      {
        id: "b10",
        author: "Elena",
        time: "5:15 PM",
        text: "Action Item: @Elena write the data migration script with shadow validation mode by next Tuesday."
      },
      {
        id: "b11",
        author: "Sarah",
        time: "5:30 PM",
        text: "Action Item: @Alex review the updated schema types and audit any deprecated fields in the frontend by Friday EOD."
      },
      {
        id: "b12",
        author: "David",
        time: "6:00 PM",
        text: "Announcement: Tech architecture sync moved from Room A to Discord voice channel #engineering-stage tomorrow at 2 PM."
      },
      {
        id: "b13",
        author: "Sarah",
        time: "6:30 PM",
        text: "Update: RFC feedback deadline extended from Wednesday to Friday 5:00 PM to give everyone time to review."
      },
      {
        id: "b14",
        author: "David",
        time: "6:45 PM",
        text: "Full RFC document is updated in Notion. Thanks team!"
      }
    ]
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SAMPLE_DATASETS };
}
