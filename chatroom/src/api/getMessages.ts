import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Fetches messages for a channel with deduplication',
  inputSchema: z.object({
    channelId: z.string(),
    after: z.string().optional(),
    limit: z.number().optional(),
  }),
  outputSchema: z.object({
    messages: z.array(z.object({
      id: z.string(),
      content: z.string(),
      authorId: z.string(),
      authorName: z.string(),
      authorImage: z.string().nullable(),
      replyToId: z.string().nullable(),
      replyPreview: z.string().nullable(),
      replyAuthorName: z.string().nullable(),
      imageUrl: z.string().nullable(),
      sentAt: z.string(),
    })),
    typingUsers: z.array(z.string()),
  }),
  execute: async ({ input }) => {
    const limit = input.limit ?? 50;
    let query: string;
    let params: unknown[];

    if (input.after) {
      query = `
        SELECT m.id, m."content", m."author"->>0 AS "authorId",
               m."replyToId", m."replyPreview", m."replyAuthorName",
               m."imageUrl", m.created_at AS "sentAt"
        FROM "Messages" m
        JOIN "ChannelsMessages" l ON l."messagesId" = m.id
        WHERE l."channelsId" = $1 AND m.created_at > $2
        ORDER BY m.created_at ASC
        LIMIT $3
      `;
      params = [input.channelId, input.after, limit];
    } else {
      query = `
        SELECT m.id, m."content", m."author"->>0 AS "authorId",
               m."replyToId", m."replyPreview", m."replyAuthorName",
               m."imageUrl", m.created_at AS "sentAt"
        FROM "Messages" m
        JOIN "ChannelsMessages" l ON l."messagesId" = m.id
        WHERE l."channelsId" = $1
        ORDER BY m.created_at DESC
        LIMIT $2
      `;
      params = [input.channelId, limit];
    }

    const { rows } = await zite.sql({ query, params });

    const authorIds = [...new Set(rows.map(r => String(r.authorId)).filter(Boolean))];
    const userMap: Record<string, { name: string; image: string | null }> = {};

    if (authorIds.length > 0) {
      const { rows: users } = await zite.sql({
        query: `SELECT id, COALESCE("name", "email") AS "name", "image" FROM "ziteUsers" WHERE id = ANY($1)`,
        params: [authorIds],
      });
      for (const u of users) {
        userMap[String(u.id)] = { name: String(u.name), image: u.image ? String(u.image) : null };
      }
    }

    const messages = rows.map(r => ({
      id: String(r.id),
      content: String(r.content ?? ''),
      authorId: String(r.authorId ?? ''),
      authorName: userMap[String(r.authorId)]?.name ?? 'Unknown',
      authorImage: userMap[String(r.authorId)]?.image ?? null,
      replyToId: r.replyToId ? String(r.replyToId) : null,
      replyPreview: r.replyPreview ? String(r.replyPreview) : null,
      replyAuthorName: r.replyAuthorName ? String(r.replyAuthorName) : null,
      imageUrl: r.imageUrl ? String(r.imageUrl) : null,
      sentAt: String(r.sentAt),
    }));

    if (!input.after) messages.reverse();

    // Get typing users (active in last 5 seconds)
    const fiveSecsAgo = new Date(Date.now() - 5000).toISOString();
    const { rows: typers } = await zite.sql({
      query: `SELECT t."typer"->>0 AS "typerId", u."name" AS "typerName"
              FROM "TypingIndicators" t
              LEFT JOIN "ziteUsers" u ON u.id = t."typer"->>0
              WHERE t."channelId" = $1 AND t."lastTypedAt" > $2`,
      params: [input.channelId, fiveSecsAgo],
    });

    return {
      messages,
      typingUsers: typers.map(t => String(t.typerName ?? 'Someone')),
    };
  },
});
