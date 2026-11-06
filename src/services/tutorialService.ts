import { prisma } from '../database/index.js';
import { Tutorial, TutorialCategory } from '@prisma/client';

export class TutorialService {
  static async getCategories(): Promise<{ category: TutorialCategory; label: string; count: number }[]> {
    const counts = await prisma.tutorial.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { id: true },
    });

    const categoryMap: Record<TutorialCategory, string> = {
      TELEGRAM_ADS: '📢 Telegram Ads Tutorials',
      TIKTOK_ADS: '🎵 TikTok Ads Tutorials',
      ACCOUNT_TROUBLESHOOTING: '🛠️ Advertising Account Troubleshooting',
      CAMPAIGN_OPTIMIZATION: '📈 Campaign Optimization',
      DIGITAL_MARKETING_TIPS: '💡 Digital Marketing Tips',
    };

    const countDict = new Map(counts.map((c) => [c.category, c._count.id]));

    return Object.entries(categoryMap).map(([cat, label]) => ({
      category: cat as TutorialCategory,
      label,
      count: countDict.get(cat as TutorialCategory) || 0,
    }));
  }

  static async getByCategory(category: TutorialCategory): Promise<Tutorial[]> {
    return prisma.tutorial.findMany({
      where: { category, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string): Promise<Tutorial | null> {
    return prisma.tutorial.findUnique({
      where: { id },
    });
  }

  static async createTutorial(data: {
    category: TutorialCategory;
    title: string;
    description: string;
    videoUrl?: string;
    articleUrl?: string;
  }): Promise<Tutorial> {
    return prisma.tutorial.create({
      data: {
        category: data.category,
        title: data.title,
        description: data.description,
        videoUrl: data.videoUrl,
        articleUrl: data.articleUrl,
      },
    });
  }

  static async deleteTutorial(id: string): Promise<Tutorial> {
    return prisma.tutorial.update({
      where: { id },
      data: { isActive: false },
    });
  }

  static async seedDefaultTutorials(): Promise<void> {
    const existing = await prisma.tutorial.count();
    if (existing > 0) return;

    const defaults = [
      {
        category: TutorialCategory.TELEGRAM_ADS,
        title: 'How to Launch Your First Telegram Sponsored Message',
        description: 'Complete guide on setting up channels, targeting CPM audiences, and writing compliant ad copy on Telegram Ad Platform.',
        articleUrl: 'https://promote.telegram.org/',
      },
      {
        category: TutorialCategory.TIKTOK_ADS,
        title: 'TikTok Ads Manager Structure & Pixel Installation',
        description: 'Learn how to set up your TikTok Business Center, integrate Web Events Pixel, and launch high-converting spark ads.',
        articleUrl: 'https://ads.tiktok.com/help/',
      },
      {
        category: TutorialCategory.ACCOUNT_TROUBLESHOOTING,
        title: 'Recovering Rejected Ads and Policy Violations',
        description: 'Step-by-step checklist to identify why your ad was rejected, correct policy issues, and appeal account restrictions safely.',
      },
      {
        category: TutorialCategory.CAMPAIGN_OPTIMIZATION,
        title: 'Scaling Budget and Lowering CPA in 2026',
        description: 'Proven strategies for creative fatigue management, broad audience scaling, and ROAS improvements.',
      },
      {
        category: TutorialCategory.DIGITAL_MARKETING_TIPS,
        title: 'High-Converting Ad Hooks & Offer Crafting',
        description: 'How to craft irresistible offers, hooks, and call-to-actions tailored for direct Telegram and TikTok traffic.',
      },
    ];

    for (const item of defaults) {
      await prisma.tutorial.create({ data: item });
    }
  }
}
