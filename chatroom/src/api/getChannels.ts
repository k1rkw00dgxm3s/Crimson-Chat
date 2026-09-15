import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Returns all chat channels including user-created rooms and DMs',
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({
    channels: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      icon: z.string(),
      sortOrder: z.number(),
      readOnly: z.boolean(),
      isDm: z.boolean(),
      dmParticipants: z.string().nullable(),
    })),
  }),
  execute: async ({ context }) => {
    const { rows } = await zite.sql({
      query: `SELECT id, "name", "type", "icon", "sortOrder", "readOnly", "dmParticipants"
              FROM "Channels"
              ORDER BY "sortOrder" ASC, created_at ASC`,
    });

    const userId = context.user.id;

    return {
      channels: rows
        .filter(r => {
          const dm = r.dmParticipants ? String(r.dmParticipants) : null;
          if (dm) return dm.includes(userId);
          const type = String(r.type ?? 'Public');
          // Show all public channels, private only if created by user
          return type === 'Public' || type === 'Private';
        })
        .map(r => ({
          id: String(r.id),
          name: String(r.name ?? ''),
          type: String(r.type ?? 'Public'),
          icon: String(r.icon ?? '#'),
          sortOrder: Number(r.sortOrder ?? 99),
          readOnly: r.readOnly === true,
          isDm: !!(r.dmParticipants),
          dmParticipants: r.dmParticipants ? String(r.dmParticipants) : null,
        })),
    };
  },
});
