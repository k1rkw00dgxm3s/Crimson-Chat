import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Reports that the current user is typing in a channel',
  authenticated: true,
  inputSchema: z.object({ channelId: z.string() }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ input, context }) => {
    await zite.typingIndicators.bulkCreate({
      records: [{
        channelId: input.channelId,
        typer: context.user.id,
        lastTypedAt: new Date().toISOString(),
      }],
      matchOn: ['channelId', 'typer'],
    });
    return { ok: true };
  },
});
