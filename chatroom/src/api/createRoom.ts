import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Creates a new channel (room) - public or private',
  authenticated: true,
  inputSchema: z.object({
    name: z.string().min(1).max(50),
    type: z.enum(['Public', 'Private']),
  }),
  outputSchema: z.object({
    channel: z.object({ id: z.string(), name: z.string() }),
  }),
  execute: async ({ input, context }) => {
    const ch = await zite.channels.create({
      record: {
        name: input.name,
        type: input.type,
        icon: '#',
        sortOrder: 99,
        readOnly: false,
        createdBy: context.user.id,
        dmParticipants: null,
      },
    });
    return { channel: { id: ch.id, name: ch.name ?? input.name } };
  },
});
