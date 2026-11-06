import { InlineKeyboard } from 'grammy';

export const Keyboards = {
  mainMenu(isAdmin = false): InlineKeyboard {
    const kb = new InlineKeyboard()
      .text('📢 Advertising Services', 'menu_services')
      .text('🛠️ Fix Ad Account Issues', 'menu_fix_issues')
      .row()
      .text('📋 Track My Order', 'menu_track_order')
      .text('💬 Contact Support', 'menu_contact_support')
      .row()
      .text('📚 Guides & Tutorials', 'menu_tutorials')
      .text('🔔 Updates & Announcements', 'menu_announcements');

    if (isAdmin) {
      kb.row().text('⚡ Administrator Dashboard', 'admin_dashboard');
    }

    return kb;
  },

  servicesList(): InlineKeyboard {
    return new InlineKeyboard()
      .text('🚀 Telegram Ads Campaign Setup', 'srv_tg_setup')
      .row()
      .text('🛡️ Telegram Ads Account Support', 'srv_tg_support')
      .row()
      .text('🔄 Telegram Ads Rejection Solutions', 'srv_tg_rejection')
      .row()
      .text('🎵 TikTok Ads Campaign Setup', 'srv_tt_setup')
      .row()
      .text('📈 TikTok Ads Optimization', 'srv_tt_opt')
      .row()
      .text('🎯 Targeted Audience & Lead Generation', 'srv_leads')
      .row()
      .text('💡 Advertising Consultation', 'srv_consult')
      .row()
      .text('🔙 Back to Main Menu', 'nav_home');
  },

  serviceDetails(serviceCode: string): InlineKeyboard {
    return new InlineKeyboard()
      .text('📝 Request This Service', `req_srv_${serviceCode}`)
      .text('💬 Contact Support', 'menu_contact_support')
      .row()
      .text('⬅️ Back to Services', 'menu_services')
      .text('🏠 Home', 'nav_home');
  },

  backToHome(): InlineKeyboard {
    return new InlineKeyboard().text('🏠 Back to Home', 'nav_home');
  },

  backToServices(): InlineKeyboard {
    return new InlineKeyboard()
      .text('⬅️ Back to Services', 'menu_services')
      .text('🏠 Home', 'nav_home');
  },

  troubleshootPlatformMenu(): InlineKeyboard {
    return new InlineKeyboard()
      .text('✈️ Telegram Ads', 'trouble_platform_telegram')
      .text('🎵 TikTok Ads', 'trouble_platform_tiktok')
      .row()
      .text('🌐 Other / Multiple Platforms', 'trouble_platform_other')
      .row()
      .text('🏠 Back to Home', 'nav_home');
  },

  troubleshootIssueMenu(platform: string): InlineKeyboard {
    return new InlineKeyboard()
      .text('🚫 Account Suspended / Banned', `issue_${platform}_banned`)
      .row()
      .text('❌ Ad Creative / Copy Rejected', `issue_${platform}_rejected`)
      .row()
      .text('💳 Billing / Payment Failure', `issue_${platform}_billing`)
      .row()
      .text('📉 Delivery / Zero Impressions', `issue_${platform}_delivery`)
      .row()
      .text('❓ Other Technical Problem', `issue_${platform}_other`)
      .row()
      .text('⬅️ Change Platform', 'menu_fix_issues')
      .text('🏠 Home', 'nav_home');
  },

  announcementsMenu(isSubscribed: boolean): InlineKeyboard {
    return new InlineKeyboard()
      .text(
        isSubscribed ? '🔕 Unsubscribe from Updates' : '🔔 Subscribe to Updates',
        isSubscribed ? 'sub_toggle_off' : 'sub_toggle_on'
      )
      .row()
      .text('💬 Inquire with Support', 'menu_contact_support')
      .text('🏠 Home', 'nav_home');
  },

  adminDashboard(): InlineKeyboard {
    return new InlineKeyboard()
      .text('📊 Statistics', 'admin_stats')
      .text('📥 New Service Requests', 'admin_requests')
      .row()
      .text('🎫 Support Tickets', 'admin_tickets')
      .text('📋 Manage Orders', 'admin_orders')
      .row()
      .text('📢 Broadcast Message', 'admin_broadcast')
      .text('📚 Manage Tutorials', 'admin_tutorials')
      .row()
      .text('👥 Customers List', 'admin_customers')
      .text('⚙️ Bot Info', 'admin_settings')
      .row()
      .text('🏠 Exit to User Menu', 'nav_home');
  },

  adminTicketAction(ticketReference: string): InlineKeyboard {
    return new InlineKeyboard()
      .text('💬 Reply to Customer', `adm_reply_tck_${ticketReference}`)
      .row()
      .text('✅ Close Ticket', `adm_close_tck_${ticketReference}`)
      .text('🔄 Reopen Ticket', `adm_reopen_tck_${ticketReference}`)
      .row()
      .text('⬅️ Back to Admin', 'admin_dashboard');
  },

  adminOrderAction(orderReference: string): InlineKeyboard {
    return new InlineKeyboard()
      .text('✏️ Change Status', `adm_order_status_${orderReference}`)
      .text('📝 Add Progress Note', `adm_order_note_${orderReference}`)
      .row()
      .text('⬅️ Back to Admin', 'admin_dashboard');
  },
};
