export const SERVICES_CATALOG: Record<
  string,
  {
    name: string;
    platform: string;
    description: string;
    includes: string[];
  }
> = {
  tg_setup: {
    name: 'Telegram Ads Campaign Setup',
    platform: 'Telegram Ads',
    description:
      'Professional end-to-end setup of official Telegram Sponsored Messages and channel advertising campaigns.',
    includes: [
      'Target channel research and competitor audience mapping',
      'High-CTR ad copy creation adhering to strict Telegram guidelines',
      'Optimal CPM bid strategy to minimize acquisition cost',
      'Pixel tracking, bot funnel integration, and link UTM tracking',
      'Pre-launch verification to prevent ad rejections',
    ],
  },
  tg_support: {
    name: 'Telegram Ads Account Support',
    platform: 'Telegram Ads',
    description:
      'Ongoing technical and operational support for Telegram Advertising accounts, budget allocations, and policy compliance.',
    includes: [
      'Account top-up & currency threshold guidance (TON & EUR)',
      'Channel verification and owner eligibility assistance',
      'Daily campaign health monitoring and pacing controls',
      'Direct troubleshooting with ad review appeals',
      'Dedicated ad specialist support',
    ],
  },
  tg_rejection: {
    name: 'Telegram Ads Rejection Solutions',
    platform: 'Telegram Ads',
    description:
      'Fast resolution and copy overhaul for rejected Telegram Ads campaigns and restricted advertising channels.',
    includes: [
      'Deep analysis of rejection notices & policy breaches',
      'Complete rewriting of ad text to guarantee instant approval',
      'Landing page & destination channel compliance cleanup',
      'Direct appeal re-submission management',
      'Guaranteed compliance guidelines for future ads',
    ],
  },
  tt_setup: {
    name: 'TikTok Ads Campaign Setup',
    platform: 'TikTok Ads',
    description:
      'Conversion-focused TikTok Ads setup designed for viral hooks, lead generation, and e-commerce scale.',
    includes: [
      'TikTok Business Center & Ads Manager structure setup',
      'TikTok Events API & Pixel installation with Advanced Matching',
      'Creative brief crafting & trending sound recommendations',
      'Custom audience creation & Lookalike modeling',
      'Campaign budget optimization (CBO) strategy setup',
    ],
  },
  tt_opt: {
    name: 'TikTok Ads Optimization',
    platform: 'TikTok Ads',
    description:
      'Systematic A/B testing and cost-reduction audits for underperforming TikTok ad campaigns.',
    includes: [
      'Comprehensive audit of current ad spend, CPA, and ROAS',
      'Fatigue prevention via creative refreshing strategies',
      'Smart bidding calibration (Cost Cap vs Lowest Cost)',
      'Funnel drop-off diagnosis & conversion rate optimization',
      'Weekly performance analytics reporting',
    ],
  },
  leads: {
    name: 'Targeted Audience & Lead Generation',
    platform: 'Multi-Platform (Telegram & TikTok)',
    description:
      'Acquire verified, high-intent leads and engaged subscribers straight into your Telegram community or sales pipeline.',
    includes: [
      'Audience persona profiling and interest clustering',
      'Lead magnet and interactive Telegram bot onboarding funnels',
      'Automated lead qualification and CRM webhooks',
      'Laser-targeted paid campaign management',
      'Real-time lead conversion analytics',
    ],
  },
  consult: {
    name: 'Advertising Consultation',
    platform: 'General Digital Marketing',
    description:
      'Strategic 1-on-1 consultation session with senior digital marketing and media buying specialists.',
    includes: [
      'Comprehensive review of your marketing goals & budget',
      'Platform suitability assessment (Telegram vs TikTok vs Meta)',
      'Offer positioning, hook scripting & pricing review',
      'Detailed growth roadmap tailored for your business',
      'Written action summary with recorded session notes',
    ],
  },
};
