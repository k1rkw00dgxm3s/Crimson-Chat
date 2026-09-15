import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';

const BLOCKED_WORDS = [
  'nsfw', 'porn', 'xxx', 'nude', 'naked', 'explicit', 'hentai',
  'onlyfans', 'sex', 'dick', 'pussy', 'fuck', 'shit', 'ass',
  'bitch', 'nigger', 'nigga', 'faggot', 'retard',
];

function isExplicit(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some(w => lower.includes(w));
}

function isExplicitImage(url: string): boolean {
  const lower = url.toLowerCase();
  return BLOCKED_WORDS.some(w => lower.includes(w));
}

export default createEndpoint({
  description: 'Sends a message to a channel with content moderation',
  authenticated: true,
  inputSchema: z.object({
    channelId: z.string(),
    content: z.string().max(2000),
    replyToId: z.string().optional(),
    replyPreview: z.string().optional(),
    replyAuthorName: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
  outputSchema: z.object({
    message: z.object({
      id: z.string(),
      content: z.string(),
      sentAt: z.string(),
    }),
  }),
  execute: async ({ input, context }) => {
    // Check channel isn't read-only
    const channel = await zite.channels.findOne({ id: input.channelId });
    if (!channel) throw new ZiteError({ code: 'NOT_FOUND', message: 'Channel not found' });
    if (channel.readOnly) {
      throw new ZiteError({ code: 'FORBIDDEN', message: 'This channel is read-only', userFacingMessage: 'You cannot send messages in this channel.' });
    }

    // Content moderation
    if (input.content && isExplicit(input.content)) {
      throw new ZiteError({ code: 'BAD_REQUEST', message: 'Message contains inappropriate content', userFacingMessage: 'Your message was blocked for containing inappropriate content.' });
    }
    if (input.imageUrl && isExplicitImage(input.imageUrl)) {
      throw new ZiteError({ code: 'BAD_REQUEST', message: 'Image URL contains inappropriate content', userFacingMessage: 'That image was blocked.' });
    }

    // Must have content or image
    if (!input.content?.trim() && !input.imageUrl) {
      throw new ZiteError({ code: 'BAD_REQUEST', message: 'Message must have content or image' });
    }

    const msg = await zite.messages.create({
      record: {
        content: input.content?.trim() || null,
        channel: input.channelId,
        author: context.user.id,
        replyToId: input.replyToId ?? null,
        replyPreview: input.replyPreview ?? null,
        replyAuthorName: input.replyAuthorName ?? null,
        imageUrl: input.imageUrl ?? null,
      },
    });

    return {
      message: {
        id: msg.id,
        content: msg.content ?? '',
        sentAt: msg.sentAt ?? new Date().toISOString(),
      },
    };
  },
});
