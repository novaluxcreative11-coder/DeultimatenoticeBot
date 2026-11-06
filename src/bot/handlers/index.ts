import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../../types/context.js';
import { Keyboards } from '../keyboards/index.js';
import { SERVICES_CATALOG } from '../services_data.js';
import { ServiceRequestService } from '../../services/serviceRequestService.js';
import { TicketService } from '../../services/ticketService.js';
import { OrderService } from '../../services/orderService.js';
import { TutorialService } from '../../services/tutorialService.js';
import { UserService } from '../../services/userService.js';
import { escapeHtml, formatDate, formatStatus } from '../../utils/helpers.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { OrderStatus, Role } from '@prisma/client';

export function registerBotHandlers(bot: Bot<BotContext>): void {
  // /start command
  bot.command('start', async (ctx) => {
    const welcome =
      `👋 <b>Welcome to DEULTIMATEADSOLUTION Support!</b>\n\n` +
      `<i>Smart Advertising. Better Reach. Real Growth.</i>\n\n` +
      `Your dedicated assistant for TikTok Ads and Telegram Ads solutions.\n\n` +
      `Here you can explore our services, request advertising assistance, report account issues, track your orders and communicate directly with our support team.\n\n` +
      `How can we assist you today?`;

    await ctx.reply(welcome, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.mainMenu(ctx.isAdmin),
    });
  });

  // /help command
  bot.command('help', async (ctx) => {
    const text =
      `ℹ️ <b>DEULTIMATEADSOLUTION Help Center</b>\n\n` +
      `Use the interactive buttons below or commands:\n` +
      `• /start - Return to Main Menu\n` +
      `• /track &lt;order_id&gt; - Quick order lookup\n` +
      `• /support - Open direct support chat\n` +
      (ctx.isAdmin ? `• /admin - Administrator Dashboard\n` : '') +
      `\nFor urgent inquiries, select <b>💬 Contact Support</b>.`;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.backToHome(),
    });
  });

  // Navigation: Home
  bot.callbackQuery('nav_home', async (ctx) => {
    await ctx.answerCallbackQuery();
    const text =
      `👋 <b>DEULTIMATEADSOLUTION Main Menu</b>\n\n` +
      `Smart Advertising. Better Reach. Real Growth.\n\n` +
      `Please select an option below:`;

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.mainMenu(ctx.isAdmin),
    });
  });

  // Navigation: Services list
  bot.callbackQuery('menu_services', async (ctx) => {
    await ctx.answerCallbackQuery();
    const text =
      `📢 <b>DEULTIMATEADSOLUTION Advertising Services</b>\n\n` +
      `We provide specialized, high-performance media buying and account management solutions:\n\n` +
      `Select a service below to view details and submit a request:`;

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.servicesList(),
    });
  });

  // Individual service pages
  for (const [key, srv] of Object.entries(SERVICES_CATALOG)) {
    bot.callbackQuery(`srv_${key}`, async (ctx) => {
      await ctx.answerCallbackQuery();
      const includesList = srv.includes.map((inc) => `  ✅ ${escapeHtml(inc)}`).join('\n');
      const text =
        `📢 <b>${escapeHtml(srv.name)}</b>\n` +
        `<i>Platform: ${escapeHtml(srv.platform)}</i>\n\n` +
        `📝 <b>Description:</b>\n${escapeHtml(srv.description)}\n\n` +
        `💼 <b>What This Service Includes:</b>\n${includesList}\n\n` +
        `Ready to launch or need custom consultation? Tap <b>Request This Service</b> below.`;

      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: Keyboards.serviceDetails(key),
      });
    });

    // Request Service trigger
    bot.callbackQuery(`req_srv_${key}`, async (ctx) => {
      await ctx.answerCallbackQuery();
      ctx.session.step = `req_${key}_name`;
      ctx.session.tempData = {
        serviceKey: key,
        serviceTitle: srv.name,
        platform: srv.platform,
      };

      const prompt =
        `📝 <b>Service Request: ${escapeHtml(srv.name)}</b>\n\n` +
        `Step 1/5: Please enter your <b>Full Name</b> or company name:`;

      await ctx.reply(prompt, {
        parse_mode: 'HTML',
        reply_markup: Keyboards.backToServices(),
      });
    });
  }

  // Navigation: Fix Ad Account Issues
  bot.callbackQuery('menu_fix_issues', async (ctx) => {
    await ctx.answerCallbackQuery();
    const text =
      `🛠️ <b>Ad Account Troubleshooting &amp; Rejection Assistance</b>\n\n` +
      `Experiencing advertising account restrictions, rejected creatives, or billing errors?\n\n` +
      `<b>Important Security Notice:</b> We will <u>NEVER</u> ask for your account password, two-factor codes, or private credentials.\n\n` +
      `Which advertising platform is experiencing issues?`;

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.troubleshootPlatformMenu(),
    });
  });

  // Troubleshooting platform selected
  bot.callbackQuery(/^trouble_platform_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const platform = ctx.match[1];
    const platformName = platform === 'telegram' ? 'Telegram Ads' : platform === 'tiktok' ? 'TikTok Ads' : 'Other Platform';

    const text =
      `🛠️ <b>Report Issue for ${escapeHtml(platformName)}</b>\n\n` +
      `What type of issue are you encountering?`;

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.troubleshootIssueMenu(platform),
    });
  });

  // Troubleshooting issue selected -> start ticket workflow
  bot.callbackQuery(/^issue_([^_]+)_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const platform = ctx.match[1] === 'telegram' ? 'Telegram Ads' : ctx.match[1] === 'tiktok' ? 'TikTok Ads' : 'Other Platform';
    const issueCode = ctx.match[2];

    const issueMap: Record<string, string> = {
      banned: 'Account Suspended / Banned',
      rejected: 'Ad Creative / Copy Rejected',
      billing: 'Billing / Payment Failure',
      delivery: 'Delivery / Zero Impressions',
      other: 'Other Technical Problem',
    };

    const issueType = issueMap[issueCode] || 'General Issue';

    ctx.session.step = 'ticket_err_msg';
    ctx.session.tempData = {
      platform,
      issueType,
    };

    const text =
      `🛠️ <b>Reporting Issue: ${escapeHtml(issueType)}</b>\n` +
      `<i>Platform: ${escapeHtml(platform)}</i>\n\n` +
      `Step 1/3: What exact error message are you receiving? (Or type "None" if there is no specific error code)` ;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.backToHome(),
    });
  });

  // Navigation: Track My Order
  bot.callbackQuery('menu_track_order', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = 'awaiting_order_reference';

    const text =
      `📋 <b>Order &amp; Ticket Tracking System</b>\n\n` +
      `Please reply with your unique <b>Order Reference</b> (e.g. <code>ORD-123456</code>) or <b>Support Ticket Reference</b> (e.g. <code>TCK-123456</code>):\n\n` +
      `You can also enter your reference anytime by typing <code>/track &lt;reference&gt;</code>.`;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.backToHome(),
    });
  });

  // /track command handler
  bot.command('track', async (ctx) => {
    const ref = ctx.message?.text?.split(' ')[1]?.trim().toUpperCase();
    if (!ref) {
      ctx.session.step = 'awaiting_order_reference';
      await ctx.reply('📋 Please enter your Order or Ticket Reference (e.g., <code>ORD-123456</code> or <code>TCK-123456</code>):', {
        parse_mode: 'HTML',
        reply_markup: Keyboards.backToHome(),
      });
      return;
    }
    await handleTrackingLookup(ctx, ref);
  });

  // Navigation: Contact Support
  bot.callbackQuery('menu_contact_support', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = 'support_chat_active';

    const text =
      `💬 <b>Direct Support Desk</b>\n\n` +
      `Our team is ready to help you with ad setup, troubleshooting, or billing.\n\n` +
      `Please send your message or screenshot below. A support specialist will review and respond shortly directly through this chat.`;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.backToHome(),
    });
  });

  // /support command
  bot.command('support', async (ctx) => {
    ctx.session.step = 'support_chat_active';
    await ctx.reply('💬 <b>Support Desk</b>\n\nPlease send your question or message directly here:', {
      parse_mode: 'HTML',
      reply_markup: Keyboards.backToHome(),
    });
  });

  // Navigation: Tutorials
  bot.callbackQuery('menu_tutorials', async (ctx) => {
    await ctx.answerCallbackQuery();
    const categories = await TutorialService.getCategories();

    let text = `📚 <b>Guides &amp; Tutorials</b>\n\nSelect a knowledge category:\n\n`;
    const kb = new InlineKeyboard();

    for (const cat of categories) {
      text += `• <b>${escapeHtml(cat.label)}</b> (${cat.count} guides)\n`;
      kb.text(cat.label, `tut_cat_${cat.category}`).row();
    }
    kb.text('🏠 Back to Home', 'nav_home');

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: kb,
    });
  });

  // Tutorial Category View
  bot.callbackQuery(/^tut_cat_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const cat = ctx.match[1] as any;
    const tutorials = await TutorialService.getByCategory(cat);

    if (tutorials.length === 0) {
      await ctx.editMessageText(
        `📚 <b>No tutorials currently in this category.</b>\n\nOur team is drafting new materials. Check back soon or contact support for direct guidance!`,
        {
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard().text('⬅️ Back to Categories', 'menu_tutorials').text('🏠 Home', 'nav_home'),
        }
      );
      return;
    }

    let text = `📚 <b>Tutorials &amp; Guides</b>\n\n`;
    for (const tut of tutorials) {
      text += `📌 <b>${escapeHtml(tut.title)}</b>\n`;
      text += `${escapeHtml(tut.description)}\n`;
      if (tut.articleUrl) {
        text += `🔗 <a href="${tut.articleUrl}">Read Documentation / Article</a>\n`;
      }
      if (tut.videoUrl) {
        text += `▶️ <a href="${tut.videoUrl}">Watch Video Tutorial</a>\n`;
      }
      text += `\n`;
    }

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text('⬅️ Back to Categories', 'menu_tutorials').text('🏠 Home', 'nav_home'),
      link_preview_options: { is_disabled: true },
    });
  });

  // Navigation: Announcements & Updates
  bot.callbackQuery('menu_announcements', async (ctx) => {
    await ctx.answerCallbackQuery();
    const isSub = ctx.dbUser?.isSubscribed ?? true;

    const text =
      `🔔 <b>Updates &amp; Announcements</b>\n\n` +
      `Stay informed about:\n` +
      `• Telegram Ads platform policy shifts\n` +
      `• TikTok algorithm updates & creative trends\n` +
      `• Special service packages & performance tips\n\n` +
      `Current subscription status: <b>${isSub ? '✅ Subscribed' : '❌ Unsubscribed'}</b>`;

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.announcementsMenu(isSub),
    });
  });

  // Toggle subscription
  bot.callbackQuery('sub_toggle_off', async (ctx) => {
    await ctx.answerCallbackQuery({ text: 'You have been unsubscribed from announcements.' });
    if (ctx.from) {
      await UserService.setSubscription(BigInt(ctx.from.id), false);
    }
    await ctx.editMessageText(
      `🔕 <b>You have unsubscribed from announcements.</b>\n\nYou can re-subscribe at any time to receive crucial platform updates.`,
      {
        parse_mode: 'HTML',
        reply_markup: Keyboards.announcementsMenu(false),
      }
    );
  });

  bot.callbackQuery('sub_toggle_on', async (ctx) => {
    await ctx.answerCallbackQuery({ text: 'You are now subscribed to announcements!' });
    if (ctx.from) {
      await UserService.setSubscription(BigInt(ctx.from.id), true);
    }
    await ctx.editMessageText(
      `🔔 <b>You are subscribed to announcements!</b>\n\nYou will receive timely updates directly in this chat.`,
      {
        parse_mode: 'HTML',
        reply_markup: Keyboards.announcementsMenu(true),
      }
    );
  });

  // Handle textual inputs & step wizards
  bot.on('message:text', async (ctx, next) => {
    const text = ctx.message.text.trim();
    const step = ctx.session.step;

    // Check if user is looking up tracking reference directly
    if (step === 'awaiting_order_reference' || text.startsWith('ORD-') || text.startsWith('TCK-') || text.startsWith('REQ-')) {
      await handleTrackingLookup(ctx, text.toUpperCase());
      ctx.session.step = undefined;
      return;
    }

    // Service Request Wizard
    if (step && step.startsWith('req_')) {
      await handleServiceRequestStep(ctx, text, bot);
      return;
    }

    // Ad Account Troubleshooting Wizard
    if (step && step.startsWith('ticket_')) {
      await handleTicketStep(ctx, text, bot);
      return;
    }

    // Admin workflows (replies, order notes, broadcast, tutorials)
    if (step && (step.startsWith('adm_') || step.startsWith('admin_'))) {
      await handleAdminStep(ctx, text, bot);
      return;
    }

    // Contact Support Chat Message
    if (step === 'support_chat_active' || (!text.startsWith('/') && !ctx.isAdmin)) {
      await handleSupportMessage(ctx, text, bot);
      return;
    }

    return next();
  });

  // Handle Photo Messages (screenshots for troubleshooting / support / admin broadcast)
  bot.on('message:photo', async (ctx) => {
    const photos = ctx.message.photo;
    const largestPhoto = photos[photos.length - 1];
    const fileId = largestPhoto.file_id;
    const caption = ctx.message.caption?.trim();

    if (ctx.session.step === 'ticket_screenshot') {
      ctx.session.tempData = {
        ...ctx.session.tempData,
        screenshotFileId: fileId,
      };
      await finalizeTicketSubmission(ctx, bot);
      return;
    }

    if (ctx.session.step === 'admin_broadcast_text' && ctx.isAdmin) {
      ctx.session.step = undefined;
      const { BroadcastService } = await import('../../services/broadcastService.js');
      const progressMsg = await ctx.reply('⏳ Broadcasting announcement with photo to all subscribers...');
      const result = await BroadcastService.sendBroadcast(bot, {
        text: caption || '📢 <b>Announcement from DEULTIMATEADSOLUTION</b>',
        photoFileId: fileId,
        adminTelegramId: ctx.from ? BigInt(ctx.from.id) : 0n,
      });

      await ctx.api.editMessageText(
        ctx.chat!.id,
        progressMsg.message_id,
        `✅ <b>Broadcast Completed!</b>\n\n` +
        `• Successfully sent: <b>${result.sent}</b>\n` +
        `• Failed: <b>${result.failed}</b>`,
        { parse_mode: 'HTML', reply_markup: Keyboards.adminDashboard() }
      );
      return;
    }

    // Otherwise, treat as customer support attachment if not admin
    if (!ctx.isAdmin) {
      await handleSupportMedia(ctx, fileId, 'photo', caption, bot);
    }
  });
}

/**
 * Handle Order or Ticket Lookup
 */
async function handleTrackingLookup(ctx: BotContext, rawRef: string): Promise<void> {
  const ref = rawRef.trim().toUpperCase();
  const telegramId = ctx.from ? BigInt(ctx.from.id) : 0n;

  if (ref.startsWith('ORD-')) {
    const order = await OrderService.getByReference(ref);
    if (!order) {
      await ctx.reply(`❌ Order <code>${escapeHtml(ref)}</code> not found. Please verify the code and try again.`, {
        parse_mode: 'HTML',
        reply_markup: Keyboards.backToHome(),
      });
      return;
    }

    // Ownership check: Customer can only access their own order unless Admin
    if (!ctx.isAdmin && order.user.telegramId !== telegramId) {
      await ctx.reply(`🔒 <b>Access Restricted</b>\n\nThis order belongs to another customer account.`, {
        parse_mode: 'HTML',
      });
      return;
    }

    const updatesText =
      order.updates && order.updates.length > 0
        ? order.updates
            .map(
              (u) =>
                `• <b>${formatStatus(u.newStatus)}</b> (${formatDate(u.createdAt)})\n  <i>${escapeHtml(u.adminNotes || 'Status updated')}</i>`
            )
            .join('\n')
        : '• <i>Initial order recorded</i>';

    const text =
      `📋 <b>Order Status: ${escapeHtml(order.reference)}</b>\n\n` +
      `💼 <b>Service:</b> ${escapeHtml(order.serviceTitle)}\n` +
      `🌐 <b>Platform:</b> ${escapeHtml(order.platform)}\n` +
      `📅 <b>Submitted Date:</b> ${formatDate(order.createdAt)}\n` +
      `📊 <b>Current Status:</b> <b>${formatStatus(order.status)}</b>\n\n` +
      `📝 <b>Latest Progress Note:</b>\n${escapeHtml(order.notes || 'Under processing')}\n\n` +
      `🕒 <b>Status Timeline:</b>\n${updatesText}`;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.backToHome(),
    });
    return;
  }

  if (ref.startsWith('TCK-')) {
    const ticket = await TicketService.getByReference(ref);
    if (!ticket) {
      await ctx.reply(`❌ Ticket <code>${escapeHtml(ref)}</code> not found.`, {
        parse_mode: 'HTML',
        reply_markup: Keyboards.backToHome(),
      });
      return;
    }

    if (!ctx.isAdmin && ticket.user.telegramId !== telegramId) {
      await ctx.reply(`🔒 <b>Access Restricted</b>\n\nThis support ticket belongs to another customer account.`, {
        parse_mode: 'HTML',
      });
      return;
    }

    const text =
      `🎫 <b>Support Ticket: ${escapeHtml(ticket.reference)}</b>\n\n` +
      `🌐 <b>Platform:</b> ${escapeHtml(ticket.platform)}\n` +
      `⚠️ <b>Issue:</b> ${escapeHtml(ticket.issueType)}\n` +
      `📊 <b>Status:</b> <b>${formatStatus(ticket.status)}</b>\n` +
      `📅 <b>Opened:</b> ${formatDate(ticket.createdAt)}\n` +
      (ticket.errorMessage ? `💬 <b>Error Message:</b> <code>${escapeHtml(ticket.errorMessage)}</code>\n` : '') +
      `\nTo send an update or reply to this ticket, simply select <b>💬 Contact Support</b>.`;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.backToHome(),
    });
    return;
  }

  await ctx.reply(
    `⚠️ Unrecognized reference format. References start with <code>ORD-</code> for orders or <code>TCK-</code> for support tickets.`,
    {
      parse_mode: 'HTML',
      reply_markup: Keyboards.backToHome(),
    }
  );
}

/**
 * Handle Service Request Multi-Step Wizard
 */
async function handleServiceRequestStep(ctx: BotContext, text: string, bot: Bot<BotContext>): Promise<void> {
  const step = ctx.session.step!;
  const data = ctx.session.tempData || {};

  if (step.endsWith('_name')) {
    data.customerName = text;
    ctx.session.step = step.replace('_name', '_objective');
    ctx.session.tempData = data;
    await ctx.reply(`🎯 <b>Step 2/5: Campaign Objective</b>\n\nWhat is your primary goal? (e.g., "Channel Subscribers", "Lead Gen", "Sales Conversions", "App Installs")`, {
      parse_mode: 'HTML',
    });
    return;
  }

  if (step.endsWith('_objective')) {
    data.objective = text;
    ctx.session.step = step.replace('_objective', '_budget');
    ctx.session.tempData = data;
    await ctx.reply(`💰 <b>Step 3/5: Estimated Budget Range</b>\n\nWhat is your monthly or total campaign budget? (e.g., "$500 - $1,500", "$3,000+", "Flexible")`, {
      parse_mode: 'HTML',
    });
    return;
  }

  if (step.endsWith('_budget')) {
    data.budgetRange = text;
    ctx.session.step = step.replace('_budget', '_details');
    ctx.session.tempData = data;
    await ctx.reply(`📝 <b>Step 4/5: Additional Project Details</b>\n\nPlease share your channel/website link, target audience, or any specific requirements (or type "None"):`, {
      parse_mode: 'HTML',
    });
    return;
  }

  if (step.endsWith('_details')) {
    data.details = text;
    ctx.session.step = undefined;

    if (!ctx.dbUser) {
      await ctx.reply('Error saving request. Please restart with /start.');
      return;
    }

    const req = await ServiceRequestService.create({
      userId: ctx.dbUser.id,
      customerName: data.customerName,
      platform: data.platform,
      serviceTitle: data.serviceTitle,
      objective: data.objective,
      budgetRange: data.budgetRange,
      details: data.details,
    });

    // Notify Customer
    const confirmMsg =
      `🎉 <b>Service Request Received!</b>\n\n` +
      `Thank you, <b>${escapeHtml(data.customerName)}</b>. Your request has been assigned reference:\n` +
      `👉 <code>${escapeHtml(req.reference)}</code>\n\n` +
      `💼 <b>Service:</b> ${escapeHtml(data.serviceTitle)}\n` +
      `🌐 <b>Platform:</b> ${escapeHtml(data.platform)}\n` +
      `🎯 <b>Objective:</b> ${escapeHtml(data.objective)}\n` +
      `💰 <b>Budget:</b> ${escapeHtml(data.budgetRange)}\n\n` +
      `Our specialist team will review your specifications and contact you shortly.`;

    await ctx.reply(confirmMsg, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.backToHome(),
    });

    // Notify Admins
    const adminAlert =
      `🚨 <b>NEW SERVICE REQUEST: ${escapeHtml(req.reference)}</b>\n\n` +
      `👤 <b>Customer:</b> ${escapeHtml(data.customerName)} (@${ctx.from?.username || 'no_username'})\n` +
      `🆔 <b>Telegram ID:</b> <code>${ctx.from?.id}</code>\n` +
      `💼 <b>Service:</b> ${escapeHtml(data.serviceTitle)}\n` +
      `🌐 <b>Platform:</b> ${escapeHtml(data.platform)}\n` +
      `🎯 <b>Objective:</b> ${escapeHtml(data.objective)}\n` +
      `💰 <b>Budget:</b> ${escapeHtml(data.budgetRange)}\n` +
      `📝 <b>Details:</b> ${escapeHtml(data.details || 'None')}\n\n` +
      `📅 <i>${formatDate(new Date())}</i>`;

    for (const adminId of config.adminIds) {
      try {
        await bot.api.sendMessage(Number(adminId), adminAlert, { parse_mode: 'HTML' });
      } catch (err) {
        logger.warn({ adminId: adminId.toString(), err }, 'Failed to send admin notification for service request');
      }
    }
  }
}

/**
 * Handle Ad Account Troubleshooting Wizard
 */
async function handleTicketStep(ctx: BotContext, text: string, bot: Bot<BotContext>): Promise<void> {
  const step = ctx.session.step;
  const data = ctx.session.tempData || {};

  if (step === 'ticket_err_msg') {
    data.errorMessage = text;
    ctx.session.step = 'ticket_started_at';
    ctx.session.tempData = data;
    await ctx.reply(`⏱️ <b>Step 2/3: When did this issue start?</b>\n\n(e.g., "Today", "2 days ago after updating ad copy", "Last week")`, {
      parse_mode: 'HTML',
    });
    return;
  }

  if (step === 'ticket_started_at') {
    data.startedAt = text;
    ctx.session.step = 'ticket_screenshot';
    ctx.session.tempData = data;
    await ctx.reply(`📸 <b>Step 3/3: Screenshot upload (Optional)</b>\n\nPlease upload a screenshot of the error, restriction notice, or dashboard.\n\n<i>If you don't have a screenshot, reply with <b>Skip</b>.</i>`, {
      parse_mode: 'HTML',
    });
    return;
  }

  if (step === 'ticket_screenshot') {
    // User skipped screenshot by sending text
    await finalizeTicketSubmission(ctx, bot);
  }
}

async function finalizeTicketSubmission(ctx: BotContext, bot: Bot<BotContext>): Promise<void> {
  const data = ctx.session.tempData || {};
  ctx.session.step = undefined;

  if (!ctx.dbUser) {
    await ctx.reply('Error creating ticket. Please restart with /start.');
    return;
  }

  const ticket = await TicketService.createTicket({
    userId: ctx.dbUser.id,
    platform: data.platform || 'General',
    issueType: data.issueType || 'Ad Issue',
    errorMessage: data.errorMessage,
    startedAt: data.startedAt,
    screenshotFileId: data.screenshotFileId,
  });

  const confirmMsg =
    `✅ <b>Support Ticket Created!</b>\n\n` +
    `Your ticket reference is:\n` +
    `👉 <code>${escapeHtml(ticket.reference)}</code>\n\n` +
    `🌐 <b>Platform:</b> ${escapeHtml(ticket.platform)}\n` +
    `⚠️ <b>Issue:</b> ${escapeHtml(ticket.issueType)}\n` +
    `📊 <b>Status:</b> <b>Open</b>\n\n` +
    `Our engineering and policy specialists have been notified and will examine your issue immediately.`;

  await ctx.reply(confirmMsg, {
    parse_mode: 'HTML',
    reply_markup: Keyboards.backToHome(),
  });

  // Notify Administrators
  const adminMsg =
    `🎫 <b>NEW TROUBLESHOOTING TICKET: ${escapeHtml(ticket.reference)}</b>\n\n` +
    `👤 <b>Customer:</b> @${ctx.from?.username || 'no_username'} (<code>${ctx.from?.id}</code>)\n` +
    `🌐 <b>Platform:</b> ${escapeHtml(ticket.platform)}\n` +
    `⚠️ <b>Issue:</b> ${escapeHtml(ticket.issueType)}\n` +
    `💬 <b>Error Message:</b> ${escapeHtml(ticket.errorMessage || 'N/A')}\n` +
    `⏱️ <b>Started:</b> ${escapeHtml(ticket.startedAt || 'N/A')}\n` +
    `📸 <b>Screenshot attached:</b> ${ticket.screenshotFileId ? 'Yes' : 'No'}`;

  for (const adminId of config.adminIds) {
    try {
      if (ticket.screenshotFileId) {
        await bot.api.sendPhoto(Number(adminId), ticket.screenshotFileId, {
          caption: adminMsg,
          parse_mode: 'HTML',
          reply_markup: Keyboards.adminTicketAction(ticket.reference),
        });
      } else {
        await bot.api.sendMessage(Number(adminId), adminMsg, {
          parse_mode: 'HTML',
          reply_markup: Keyboards.adminTicketAction(ticket.reference),
        });
      }
    } catch (err) {
      logger.warn({ adminId: adminId.toString(), err }, 'Failed to alert admin of ticket');
    }
  }
}

/**
 * Handle Contact Support Direct Messages
 */
async function handleSupportMessage(ctx: BotContext, text: string, bot: Bot<BotContext>): Promise<void> {
  if (!ctx.dbUser) return;

  // Find or create active support ticket
  let ticket = await TicketService.getActiveTicketForUser(ctx.dbUser.id);
  if (!ticket) {
    ticket = await TicketService.createTicket({
      userId: ctx.dbUser.id,
      platform: 'Support Desk',
      issueType: 'Direct Support Inquiry',
      errorMessage: text.slice(0, 100),
    });
  }

  await TicketService.addMessage({
    ticketId: ticket.id,
    senderId: ctx.dbUser.id,
    senderRole: Role.CUSTOMER,
    content: text,
  });

  await ctx.reply(
    `💬 Message received for ticket <code>${escapeHtml(ticket.reference)}</code>.\n\nOur support team has been notified.`,
    {
      parse_mode: 'HTML',
      reply_markup: Keyboards.backToHome(),
    }
  );

  // Notify Admins
  const adminMsg =
    `💬 <b>Customer Support Message [${escapeHtml(ticket.reference)}]</b>\n\n` +
    `From: @${ctx.from?.username || 'unknown'} (ID: <code>${ctx.from?.id}</code>)\n\n` +
    `"${escapeHtml(text)}"`;

  for (const adminId of config.adminIds) {
    try {
      await bot.api.sendMessage(Number(adminId), adminMsg, {
        parse_mode: 'HTML',
        reply_markup: Keyboards.adminTicketAction(ticket.reference),
      });
    } catch (e) {
      logger.warn({ err: e }, 'Failed to deliver support alert to admin');
    }
  }
}

async function handleSupportMedia(
  ctx: BotContext,
  fileId: string,
  mediaType: string,
  caption: string | undefined,
  bot: Bot<BotContext>
): Promise<void> {
  if (!ctx.dbUser) return;

  let ticket = await TicketService.getActiveTicketForUser(ctx.dbUser.id);
  if (!ticket) {
    ticket = await TicketService.createTicket({
      userId: ctx.dbUser.id,
      platform: 'Support Desk',
      issueType: 'Direct Media Support Inquiry',
      screenshotFileId: fileId,
    });
  }

  await TicketService.addMessage({
    ticketId: ticket.id,
    senderId: ctx.dbUser.id,
    senderRole: Role.CUSTOMER,
    content: caption || 'Screenshot attached',
    mediaFileId: fileId,
    mediaType,
  });

  await ctx.reply(`📸 Attachment received for ticket <code>${escapeHtml(ticket.reference)}</code>.`, {
    parse_mode: 'HTML',
    reply_markup: Keyboards.backToHome(),
  });

  const adminMsg =
    `📸 <b>Customer Media Attachment [${escapeHtml(ticket.reference)}]</b>\n\n` +
    `From: @${ctx.from?.username || 'unknown'} (ID: <code>${ctx.from?.id}</code>)\n` +
    (caption ? `Caption: "${escapeHtml(caption)}"` : '');

  for (const adminId of config.adminIds) {
    try {
      await bot.api.sendPhoto(Number(adminId), fileId, {
        caption: adminMsg,
        parse_mode: 'HTML',
        reply_markup: Keyboards.adminTicketAction(ticket.reference),
      });
    } catch (e) {
      logger.warn({ err: e }, 'Failed to forward screenshot to admin');
    }
  }
}

/**
 * Handle Admin Interactive Inputs
 */
async function handleAdminStep(ctx: BotContext, text: string, bot: Bot<BotContext>): Promise<void> {
  const step = ctx.session.step!;
  const target = step.replace('adm_reply_tck_', '');

  if (step.startsWith('adm_reply_tck_')) {
    const ticket = await TicketService.getByReference(target);
    if (!ticket) {
      await ctx.reply('Ticket not found.');
      ctx.session.step = undefined;
      return;
    }

    if (!ctx.dbUser) return;

    await TicketService.addMessage({
      ticketId: ticket.id,
      senderId: ctx.dbUser.id,
      senderRole: Role.ADMIN,
      content: text,
    });

    ctx.session.step = undefined;
    await ctx.reply(`✅ Response delivered to customer for ticket <code>${escapeHtml(ticket.reference)}</code>.`, {
      parse_mode: 'HTML',
    });

    // Send to Customer
    const customerMsg =
      `💬 <b>Support Team Response [${escapeHtml(ticket.reference)}]</b>\n\n` +
      `${escapeHtml(text)}\n\n` +
      `<i>You can reply to this message directly at any time.</i>`;

    try {
      await bot.api.sendMessage(Number(ticket.user.telegramId), customerMsg, {
        parse_mode: 'HTML',
      });
    } catch (err) {
      await ctx.reply(`⚠️ Could not reach customer on Telegram (bot may be blocked).`);
    }
    return;
  }

  if (step.startsWith('adm_order_note_')) {
    const orderRef = step.replace('adm_order_note_', '');
    const order = await OrderService.getByReference(orderRef);
    if (!order) {
      await ctx.reply('Order not found.');
      ctx.session.step = undefined;
      return;
    }

    const { order: updatedOrder } = await OrderService.updateOrderStatus({
      orderId: order.id,
      newStatus: order.status,
      adminNotes: text,
      adminTelegramId: ctx.from ? BigInt(ctx.from.id) : undefined,
    });

    ctx.session.step = undefined;
    await ctx.reply(`✅ Progress note recorded for order <code>${escapeHtml(updatedOrder.reference)}</code>.`, {
      parse_mode: 'HTML',
    });

    // Notify Customer of note update
    const noteMsg =
      `🔔 <b>Order Progress Update: ${escapeHtml(updatedOrder.reference)}</b>\n\n` +
      `💼 <b>Service:</b> ${escapeHtml(updatedOrder.serviceTitle)}\n` +
      `📊 <b>Status:</b> ${formatStatus(updatedOrder.status)}\n\n` +
      `📝 <b>Latest Update from Team:</b>\n${escapeHtml(text)}`;

    try {
      await bot.api.sendMessage(Number(order.user.telegramId), noteMsg, { parse_mode: 'HTML' });
    } catch (e) {
      logger.warn({ err: e }, 'Could not notify customer of order note');
    }
    return;
  }

  // Admin Broadcast Text
  if (step === 'admin_broadcast_text') {
    ctx.session.step = undefined;
    const { BroadcastService } = await import('../../services/broadcastService.js');
    const progressMsg = await ctx.reply('⏳ Broadcasting announcement to all subscribers...');
    const result = await BroadcastService.sendBroadcast(bot, {
      text,
      adminTelegramId: ctx.from ? BigInt(ctx.from.id) : 0n,
    });

    await ctx.api.editMessageText(
      ctx.chat!.id,
      progressMsg.message_id,
      `✅ <b>Broadcast Completed!</b>\n\n` +
      `• Successfully sent: <b>${result.sent}</b>\n` +
      `• Failed: <b>${result.failed}</b>`,
      { parse_mode: 'HTML', reply_markup: Keyboards.adminDashboard() }
    );
    return;
  }

  // Admin Tutorial Creation Wizard
  if (step === 'admin_tut_title') {
    ctx.session.tempData = { ...ctx.session.tempData, title: text };
    ctx.session.step = 'admin_tut_desc';
    await ctx.reply('📝 Enter Tutorial Description:');
    return;
  }

  if (step === 'admin_tut_desc') {
    ctx.session.tempData = { ...ctx.session.tempData, description: text };
    ctx.session.step = 'admin_tut_links';
    await ctx.reply('🔗 Enter External Documentation/Article Link (or type "None"):');
    return;
  }

  if (step === 'admin_tut_links') {
    const data = ctx.session.tempData || {};
    ctx.session.step = undefined;
    const articleUrl = text.toLowerCase() === 'none' ? undefined : text;

    const tut = await TutorialService.createTutorial({
      category: data.category,
      title: data.title,
      description: data.description,
      articleUrl,
    });

    await ctx.reply(
      `✅ <b>Tutorial Published Successfully!</b>\n\n` +
      `📌 <b>${escapeHtml(tut.title)}</b>\n` +
      `Category: <code>${tut.category}</code>\n\n` +
      `This tutorial is now live in the <b>Guides & Tutorials</b> catalog.`,
      {
        parse_mode: 'HTML',
        reply_markup: Keyboards.adminDashboard(),
      }
    );
    return;
  }
}
