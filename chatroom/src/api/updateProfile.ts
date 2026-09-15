import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Updates the current user profile (name, avatar)',
  authenticated: true,
  inputSchema: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().max(50).optional(),
    image: z.string().optional(),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    const update: { firstName?: string; lastName?: string; image?: string } = {};
    if (input.firstName !== undefined) update.firstName = input.firstName;
    if (input.lastName !== undefined) update.lastName = input.lastName;
    if (input.image !== undefined) update.image = input.image;
    await zite.auth.updateUserProfile(context.user.id, update);
    return { success: true };
  },
});
