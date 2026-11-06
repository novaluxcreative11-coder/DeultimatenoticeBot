import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../../types/context.js';
import { adminGuard } from '../middleware/index.js';
import { Keyboards } from '../keyboards/index.js';
import { UserService } from '../../services/userService.js';
import { ServiceRequestService } from '../../services/serviceRequestService.js';
import { TicketService } from '../../services/ticketService.js';
import { OrderService } from '../../services/orderService.js';
import { TutorialService } from '../../services/tutorialService.js';
import { BroadcastService } from '../../services/broadcastService.js';
import { escapeHtml, formatDate, formatStatus } from '../../utils/helpers.js';
import { OrderStatus, TicketStatus, TutorialCategory } from '@prisma/client';
import { logger } from '../../utils/logger.js';

export function registerAdminHandlers(bot: Bot<BotContext>): void {
  // Admin entry command
  bot.command('admin', adminGuard, async (ctx) => {
    await ctx.reply(
      `⚡ <b>DEULTIMATEADSOLUTION Administrator Console</b>\n\n` +
      `Manage incoming leads, customer tickets, ongoing orders, tutorials, and broadcasts.`,
      {
        parse_mode: 'HTML',
        reply_markup: Keyboards.adminDashboard(),
      }
    );
  });

  bot.callbackQuery('admin_dashboard', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `⚡ <b>DEULTIMATEADSOLUTION Administrator Console</b>\n\n` +
      `Select an administrative module:`,
      {
        parse_mode: 'HTML',
        reply_markup: Keyboards.adminDashboard(),
      }
    );
  });

  // Admin Stats
  bot.callbackQuery('admin_stats', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const stats = await UserService.getStatistics();

    const text =
      `📊 <b>Platform Statistics</b>\n\n` +
      `👥 <b>Total Users Registered:</b> ${stats.totalUsers}\n` +
      `🔔 <b>Broadcast Subscribers:</b> ${stats.totalSubscribers}\n` +
      `📥 <b>Service Requests:</b> ${stats.totalRequests}\n` +
      `🎫 <b>Total Tickets:</b> ${stats.totalTickets} (Active: <b>${stats.activeTickets}</b>)\n` +
      `📋 <b>Total Orders:</b> ${stats.totalOrders} (Active: <b>${stats.activeOrders}</b>)`;

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text('⬅️ Back to Admin', 'admin_dashboard'),
    });
  });

  // Admin Requests List
  bot.callbackQuery('admin_requests', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const requests = await ServiceRequestService.getRecent(10);

    if (requests.length === 0) {
      await ctx.editMessageText(`📥 No service requests received yet.`, {
        reply_markup: new InlineKeyboard().text('⬅️ Back to Admin', 'admin_dashboard'),
      });
      return;
    }

    let text = `📥 <b>Recent Service Requests (Last 10):</b>\n\n`;
    const kb = new InlineKeyboard();

    for (const req of requests) {
      text +=
        `• <b>${escapeHtml(req.reference)}</b> - ${escapeHtml(req.serviceTitle)}\n` +
        `  Customer: ${escapeHtml(req.customerName)} | Budget: ${escapeHtml(req.budgetRange)}\n` +
        `  Status: <code>${req.status}</code> (${formatDate(req.createdAt)})\n\n`;

      kb.text(`Convert ${req.reference} to Order`, `adm_convert_req_${req.reference}`).row();
    }

    kb.text('⬅️ Back to Admin', 'admin_dashboard');

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: kb,
    });
  });

  // Convert Service Request to Order
  bot.callbackQuery(/^adm_convert_req_(.+)$/, adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const reqRef = ctx.match[1];
    const req = await ServiceRequestService.getByReference(reqRef);

    if (!req) {
      await ctx.reply('Request not found.');
      return;
    }

    const order = await OrderService.createOrder({
      userId: req.userId,
      serviceRequestId: req.id,
      serviceTitle: req.serviceTitle,
      platform: req.platform,
      notes: `Order generated from service request ${req.reference}. Scope: ${req.objective}`,
    });

    await ServiceRequestService.updateStatus(req.id, 'CONVERTED_TO_ORDER' as any);

    await ctx.reply(
      `✅ Converted request <code>${escapeHtml(req.reference)}</code> to Order <code>${escapeHtml(order.reference)}</code>!`,
      {
        parse_mode: 'HTML',
        reply_markup: Keyboards.adminOrderAction(order.reference),
      }
    );

    // Notify Customer of newly created order
    const notifyMsg =
      `🎉 <b>Your Service Request has been converted to an active Order!</b>\n\n` +
      `Your Order Reference: <code>${escapeHtml(order.reference)}</code>\n` +
      `💼 <b>Service:</b> ${escapeHtml(order.serviceTitle)}\n` +
      `📊 <b>Initial Status:</b> Pending\n\n` +
      `You can track progress anytime using <b>📋 Track My Order</b> or by typing <code>/track ${escapeHtml(order.reference)}</code>.`;

    try {
      await bot.api.sendMessage(Number(req.user.telegramId), notifyMsg, { parse_mode: 'HTML' });
    } catch (e) {
      logger.warn({ err: e }, 'Could not notify customer about order conversion');
    }
  });

  // Admin Tickets List
  bot.callbackQuery('admin_tickets', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const tickets = await TicketService.getRecentTickets(10);

    if (tickets.length === 0) {
      await ctx.editMessageText(`🎫 No support tickets found.`, {
        reply_markup: new InlineKeyboard().text('⬅️ Back to Admin', 'admin_dashboard'),
      });
      return;
    }

    let text = `🎫 <b>Recent Support Tickets:</b>\n\n`;
    const kb = new InlineKeyboard();

    for (const tck of tickets) {
      text +=
        `• <b>${escapeHtml(tck.reference)}</b> [${formatStatus(tck.status)}]\n` +
        `  Platform: ${escapeHtml(tck.platform)} | Issue: ${escapeHtml(tck.issueType)}\n` +
        `  User: @${tck.user.username || tck.user.firstName || 'user'}\n\n`;

      kb.text(`View ${tck.reference}`, `adm_view_tck_${tck.reference}`).row();
    }

    kb.text('⬅️ Back to Admin', 'admin_dashboard');

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: kb,
    });
  });

  // Admin View Specific Ticket
  bot.callbackQuery(/^adm_view_tck_(.+)$/, adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const ref = ctx.match[1];
    const ticket = await TicketService.getByReference(ref);

    if (!ticket) {
      await ctx.reply('Ticket not found.');
      return;
    }

    const messagesHistory =
      ticket.messages && ticket.messages.length > 0
        ? ticket.messages
            .map((m) => `[${m.senderRole}] ${formatDate(m.createdAt)}:\n${escapeHtml(m.content || '(Media attachment)')}`)
            .join('\n\n')
        : 'No message history yet.';

    const text =
      `🎫 <b>Ticket: ${escapeHtml(ticket.reference)}</b>\n\n` +
      `👤 Customer: @${ticket.user.username || 'unknown'} (ID: <code>${ticket.user.telegramId}</code>)\n` +
      `🌐 Platform: ${escapeHtml(ticket.platform)}\n` +
      `⚠️ Issue: ${escapeHtml(ticket.issueType)}\n` +
      `📊 Status: <b>${formatStatus(ticket.status)}</b>\n` +
      `💬 Error Code/Msg: <code>${escapeHtml(ticket.errorMessage || 'N/A')}</code>\n` +
      `⏱️ Started At: ${escapeHtml(ticket.startedAt || 'N/A')}\n\n` +
      `📜 <b>Conversation History:</b>\n${messagesHistory}`;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.adminTicketAction(ticket.reference),
    });
  });

  // Admin Reply to Ticket Prompt
  bot.callbackQuery(/^adm_reply_tck_(.+)$/, adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const ref = ctx.match[1];
    ctx.session.step = `adm_reply_tck_${ref}`;

    await ctx.reply(`✍️ Please enter your reply for ticket <code>${escapeHtml(ref)}</code>:`, {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text('Cancel', 'admin_tickets'),
    });
  });

  // Admin Close Ticket
  bot.callbackQuery(/^adm_close_tck_(.+)$/, adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const ref = ctx.match[1];
    const ticket = await TicketService.getByReference(ref);
    if (!ticket) return;

    await TicketService.updateStatus(ticket.id, TicketStatus.CLOSED);
    await ctx.reply(`✅ Ticket <code>${escapeHtml(ref)}</code> marked as <b>CLOSED</b>.`, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.adminDashboard(),
    });

    try {
      await bot.api.sendMessage(
        Number(ticket.user.telegramId),
        `✅ Your support ticket <code>${escapeHtml(ref)}</code> has been marked as <b>Closed</b> by our team. If you need further help, feel free to contact us anytime!`,
        { parse_mode: 'HTML' }
      );
    } catch {}
  });

  // Admin Reopen Ticket
  bot.callbackQuery(/^adm_reopen_tck_(.+)$/, adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const ref = ctx.match[1];
    const ticket = await TicketService.getByReference(ref);
    if (!ticket) return;

    await TicketService.updateStatus(ticket.id, TicketStatus.IN_PROGRESS);
    await ctx.reply(`🔄 Ticket <code>${escapeHtml(ref)}</code> reopened (Status: <b>In Progress</b>).`, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.adminDashboard(),
    });

    try {
      await bot.api.sendMessage(
        Number(ticket.user.telegramId),
        `🔄 Your support ticket <code>${escapeHtml(ref)}</code> has been reopened by our team.`,
        { parse_mode: 'HTML' }
      );
    } catch {}
  });

  // Admin Orders List
  bot.callbackQuery('admin_orders', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orders = await OrderService.getRecentOrders(10);

    if (orders.length === 0) {
      await ctx.editMessageText(`📋 No orders found.`, {
        reply_markup: new InlineKeyboard().text('⬅️ Back to Admin', 'admin_dashboard'),
      });
      return;
    }

    let text = `📋 <b>Recent Orders:</b>\n\n`;
    const kb = new InlineKeyboard();

    for (const ord of orders) {
      text +=
        `• <b>${escapeHtml(ord.reference)}</b> [${formatStatus(ord.status)}]\n` +
        `  ${escapeHtml(ord.serviceTitle)} | User: @${ord.user.username || 'unknown'}\n` +
        `  Updated: ${formatDate(ord.updatedAt)}\n\n`;

      kb.text(`Manage ${ord.reference}`, `adm_view_ord_${ord.reference}`).row();
    }

    kb.text('⬅️ Back to Admin', 'admin_dashboard');

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: kb,
    });
  });

  // Admin View Specific Order
  bot.callbackQuery(/^adm_view_ord_(.+)$/, adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const ref = ctx.match[1];
    const order = await OrderService.getByReference(ref);
    if (!order) return;

    const text =
      `📋 <b>Order Management: ${escapeHtml(order.reference)}</b>\n\n` +
      `👤 Customer: @${order.user.username || 'unknown'} (ID: <code>${order.user.telegramId}</code>)\n` +
      `💼 Service: ${escapeHtml(order.serviceTitle)}\n` +
      `🌐 Platform: ${escapeHtml(order.platform)}\n` +
      `📊 Current Status: <b>${formatStatus(order.status)}</b>\n` +
      `📝 Latest Progress Note:\n<i>${escapeHtml(order.notes || 'None')}</i>`;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.adminOrderAction(order.reference),
    });
  });

  // Admin Change Status Menu
  bot.callbackQuery(/^adm_order_status_(.+)$/, adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const ref = ctx.match[1];

    const statuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.UNDER_REVIEW,
      OrderStatus.IN_PROGRESS,
      OrderStatus.AWAITING_CUSTOMER,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
    ];

    const kb = new InlineKeyboard();
    for (const st of statuses) {
      kb.text(formatStatus(st), `adm_set_status_${ref}_${st}`).row();
    }
    kb.text('Cancel', `adm_view_ord_${ref}`);

    await ctx.reply(`Select new status for order <code>${escapeHtml(ref)}</code>:`, {
      parse_mode: 'HTML',
      reply_markup: kb,
    });
  });

  // Admin Set Order Status
  bot.callbackQuery(/^adm_set_status_([^_]+)_(.+)$/, adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const ref = ctx.match[1];
    const newStatus = ctx.match[2] as OrderStatus;

    const order = await OrderService.getByReference(ref);
    if (!order) return;

    const { order: updated } = await OrderService.updateOrderStatus({
      orderId: order.id,
      newStatus,
      adminNotes: `Status changed to ${formatStatus(newStatus)} by administrator.`,
      adminTelegramId: ctx.from ? BigInt(ctx.from.id) : undefined,
    });

    await ctx.reply(`✅ Order <code>${escapeHtml(ref)}</code> status updated to <b>${formatStatus(newStatus)}</b>.`, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.adminOrderAction(ref),
    });

    // Notify Customer
    const notifyMsg =
      `🔔 <b>Order Status Update: ${escapeHtml(updated.reference)}</b>\n\n` +
      `Your order has been updated to: <b>${formatStatus(newStatus)}</b>\n\n` +
      `Track your full timeline using <code>/track ${escapeHtml(updated.reference)}</code>.`;

    try {
      await bot.api.sendMessage(Number(order.user.telegramId), notifyMsg, { parse_mode: 'HTML' });
    } catch (e) {
      logger.warn({ err: e }, 'Could not notify customer about order status change');
    }
  });

  // Admin Add Progress Note
  bot.callbackQuery(/^adm_order_note_(.+)$/, adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const ref = ctx.match[1];
    ctx.session.step = `adm_order_note_${ref}`;

    await ctx.reply(`📝 Enter progress note for order <code>${escapeHtml(ref)}</code>:`, {
      parse_mode: 'HTML',
    });
  });

  // Admin Broadcast Announcement
  bot.callbackQuery('admin_broadcast', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = 'admin_broadcast_text';

    await ctx.reply(
      `📢 <b>Create Broadcast Announcement</b>\n\n` +
      `Please send the announcement message text (HTML formatting allowed) or upload a photo with caption.\n\n` +
      `All registered subscribers will receive this notification.`,
      {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('Cancel', 'admin_dashboard'),
      }
    );
  });

  // Admin Manage Tutorials
  bot.callbackQuery('admin_tutorials', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = 'admin_tut_category';

    const kb = new InlineKeyboard()
      .text('📢 Telegram Ads', 'admin_add_tut_TELEGRAM_ADS')
      .row()
      .text('🎵 TikTok Ads', 'admin_add_tut_TIKTOK_ADS')
      .row()
      .text('🛠️ Troubleshooting', 'admin_add_tut_ACCOUNT_TROUBLESHOOTING')
      .row()
      .text('📈 Campaign Optimization', 'admin_add_tut_CAMPAIGN_OPTIMIZATION')
      .row()
      .text('💡 Marketing Tips', 'admin_add_tut_DIGITAL_MARKETING_TIPS')
      .row()
      .text('🗑️ Delete Tutorial', 'admin_del_tut_list')
      .row()
      .text('⬅️ Back to Admin', 'admin_dashboard');

    await ctx.editMessageText(
      `📚 <b>Tutorial Manager</b>\n\nSelect a category to publish a new tutorial, or delete an existing one:`,
      {
        parse_mode: 'HTML',
        reply_markup: kb,
      }
    );
  });

  // Admin Delete Tutorial List
  bot.callbackQuery('admin_del_tut_list', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const categories = await TutorialService.getCategories();
    const kb = new InlineKeyboard();

    for (const cat of categories) {
      const tuts = await TutorialService.getByCategory(cat.category);
      for (const t of tuts) {
        kb.text(`🗑️ ${t.title.slice(0, 25)}...`, `adm_del_tut_${t.id}`).row();
      }
    }
    kb.text('⬅️ Back to Tutorials', 'admin_tutorials');

    await ctx.editMessageText(`Select a tutorial to deactivate/delete:`, {
      reply_markup: kb,
    });
  });

  // Admin Perform Delete Tutorial
  bot.callbackQuery(/^adm_del_tut_(.+)$/, adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const id = ctx.match[1];
    await TutorialService.deleteTutorial(id);
    await ctx.reply(`✅ Tutorial deactivated successfully!`, {
      reply_markup: Keyboards.adminDashboard(),
    });
  });

  bot.callbackQuery(/^admin_add_tut_(.+)$/, adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const cat = ctx.match[1] as TutorialCategory;
    ctx.session.step = 'admin_tut_title';
    ctx.session.tempData = { category: cat };

    await ctx.reply(`📚 Enter Tutorial Title:`);
  });

  // Admin Customer List
  bot.callbackQuery('admin_customers', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const customers = await UserService.getAllUsers(15);

    let text = `👥 <b>Recent Users (Last 15):</b>\n\n`;
    for (const u of customers) {
      text +=
        `• <b>${escapeHtml(u.firstName || 'User')}</b> (@${u.username || 'no_user'}) - ID: <code>${u.telegramId}</code>\n` +
        `  Role: ${u.role} | Subscribed: ${u.isSubscribed ? 'Yes' : 'No'} | Joined: ${formatDate(u.createdAt)}\n\n`;
    }

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text('⬅️ Back to Admin', 'admin_dashboard'),
    });
  });

  // Admin Bot Info
  bot.callbackQuery('admin_settings', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    const text =
      `⚙️ <b>Bot System Environment</b>\n\n` +
      `• <b>Bot Identity:</b> DEULTIMATE NoticeBoard\n` +
      `• <b>Node Runtime:</b> ${process.version}\n` +
      `• <b>Environment:</b> ${process.env.NODE_ENV || 'production'}\n` +
      `• <b>Port:</b> ${process.env.PORT || '3000'}\n` +
      `• <b>External URL:</b> ${process.env.RENDER_EXTERNAL_URL || 'Local / Polling mode'}\n` +
      `• <b>Database:</b> PostgreSQL (Managed on Render)\n` +
      `• <b>Active Admins:</b> ${ctx.isAdmin ? 'Authorized' : 'Unauthorized'}`;

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text('⬅️ Back to Admin', 'admin_dashboard'),
    });
  });
}
