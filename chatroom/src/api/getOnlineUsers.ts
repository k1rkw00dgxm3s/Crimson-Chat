import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Returns all registered users for the online sidebar',
  inputSchema: z.object({}),
  outputSchema: z.object({
    users: z.array(z.object({
      id: z.string(),
      name: z.string(),
      image: z.string().nullable(),
    })),
  }),
  execute: async () => {
    const result = await zite.auth.findAllUsers({ limit: 100 });
    return {
      users: result.records.map(u => ({
        id: u.id,
        name: u.name || u.email,
        image: u.image,
      })),
    };
  },
});
