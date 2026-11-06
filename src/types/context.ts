import { Context, SessionFlavor } from 'grammy';
import { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { User } from '@prisma/client';

export interface SessionData {
  step?: string;
  activeTicketId?: string;
  orderReference?: string;
  tempData?: Record<string, any>;
}

export type BotContext = Context & SessionFlavor<SessionData> & ConversationFlavor<Context> & {
  dbUser?: User;
  isAdmin?: boolean;
};

export type BotConversation = Conversation<BotContext>;
