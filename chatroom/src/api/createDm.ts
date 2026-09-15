import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Creates or finds a DM channel between two users',
  authenticated: true,
  inputSchema: z.object({ targetUserId: z.string() }),
  outputSchema: z.object({
    channel: z.object({ id: z.string(), name: z.string() }),
  }),
  execute: async ({ input, context }) => {
    const myId = context.user.id;
    const otherId = input.targetUserId;
    const key = [myId, otherId].sort().join(',');

    // Check if DM already exists
    const existing = await zite.channels.findOne({ filters: { dmParticipants: key } });
    if (existing) {
      return { channel: { id: existing.id, name: existing.name ?? 'DM' } };
    }

    // Get other user's name
    const { rows } = await zite.sql({
      query: `SELECT COALESCE("name", "email") AS "name" FROM "ziteUsers" WHERE id = $1`,
      params: [otherId],
    });
    const otherName = rows[0] ? String(rows[0].name) : 'User';

    const ch = await zite.channels.create({
      record: {
        name: otherName,
        type: 'Private',
        icon: '💬',
        sortOrder: 100,
        readOnly: false,
        createdBy: myId,
        dmParticipants: key,
      },
    });

    return { channel: { id: ch.id, name: ch.name ?? otherName } };
  },
});
