import { t } from 'elysia';

export const cookUserSpacesResponseSchema = t.Object({
  userId: t.String(),
  spaces: t.Array(
    t.Object({
      spaceId: t.String(),
      role: t.Union([
        t.Literal('owner'),
        t.Literal('admin'),
        t.Literal('member'),
      ]),
      joinedAt: t.String(),
      type: t.Union([t.Literal('personal'), t.Literal('family')]),
      name: t.String(),
      isActive: t.Boolean(),
    }),
  ),
});
