import { describe, expect, it } from 'vitest';
import { gameItemFormSchema } from '@/routes/_authenticated/admin/game-items/-lib/game-items-form-schema';

describe('gameItemFormSchema', () => {
  it('trims text fields', () => {
    expect(
      gameItemFormSchema.parse({
        name: ' 上品玄晶 ',
        gameItemId: ' 123 ',
        type: 'special',
        quality: 'orange',
        description: ' 描述 ',
        icon: ' /icon.png ',
        aliasText: '大铁',
        dungeons: [],
      }),
    ).toEqual({
      name: '上品玄晶',
      gameItemId: '123',
      type: 'special',
      quality: 'orange',
      description: '描述',
      icon: '/icon.png',
      aliasText: '大铁',
      dungeons: [],
    });
  });

  it('rejects a blank name', () => {
    const result = gameItemFormSchema.safeParse({
      name: '  ',
      gameItemId: '',
      type: 'equipment',
      quality: 'white',
      description: '',
      icon: '',
      aliasText: '',
      dungeons: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects overly long optional fields', () => {
    const result = gameItemFormSchema.safeParse({
      name: '上品玄晶',
      gameItemId: 'x'.repeat(65),
      type: 'special',
      quality: 'orange',
      description: 'x'.repeat(513),
      icon: 'x'.repeat(513),
      aliasText: 'x'.repeat(201),
      dungeons: [],
    });
    expect(result.success).toBe(false);
  });
});
