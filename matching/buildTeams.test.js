// matching/buildTeams.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildTeams } = require('./buildTeams');

describe('buildTeams', () => {
  const dummyPools = [
    {
      roleId: 1,
      roleTitle: 'Frontend',
      candidates: [
        { userId: 1, score: 90 },
        { userId: 2, score: 85 },
        { userId: 3, score: 70 },
      ],
    },
    {
      roleId: 2,
      roleTitle: 'Backend',
      candidates: [
        { userId: 1, score: 88 }, // пользователь 1 подходит и на бэкенд
        { userId: 4, score: 80 },
        { userId: 5, score: 75 },
      ],
    },
    {
      roleId: 3,
      roleTitle: 'Design',
      candidates: [
        { userId: 6, score: 95 },
        { userId: 2, score: 75 }, // пользователь 2 подходит и на дизайн
        { userId: 7, score: 70 },
      ],
    },
  ];

  it('1. В вариантах команды один человек никогда не занимает две роли', () => {
    const result = buildTeams(dummyPools, 4, 3);
    assert.strictEqual(result.error, null);
    assert(result.variants.length > 0);

    for (const variant of result.variants) {
      const userIds = variant.members.map(m => m.userId);
      const uniqueIds = new Set(userIds);
      assert.strictEqual(
        userIds.length,
        uniqueIds.size,
        `Duplicate candidate found in team variant: ${userIds.join(', ')}`
      );
    }
  });

  it('2. Если для роли нет ни одного кандидата, возвращается сообщение «Роль X не закрыта»', () => {
    const brokenPools = [
      {
        roleId: 1,
        roleTitle: 'Frontend',
        candidates: [{ userId: 1, score: 85 }],
      },
      {
        roleId: 2,
        roleTitle: 'QA Engineer',
        candidates: [], // нет кандидатов!
      },
    ];

    const result = buildTeams(brokenPools);
    assert(result.error !== null, 'Expected error for uncovered role');
    assert.strictEqual(result.error, 'Роль QA Engineer не закрыта');
    assert.strictEqual(result.variants.length, 0);
  });

  it('3. Команды ранжируются с учётом штрафа за слабое звено (0.7*avg + 0.3*min)', () => {
    // Команда A: 90 и 50 => avg = 70, min = 50 => 0.7*70 + 0.3*50 = 49 + 15 = 64
    // Команда B: 70 и 70 => avg = 70, min = 70 => 0.7*70 + 0.3*70 = 49 + 21 = 70
    // Хотя средний балл одинаковый, команда B должна быть выше команды A!
    const testPools = [
      {
        roleId: 1,
        roleTitle: 'Role 1',
        candidates: [
          { userId: 10, score: 90 },
          { userId: 20, score: 70 },
        ],
      },
      {
        roleId: 2,
        roleTitle: 'Role 2',
        candidates: [
          { userId: 30, score: 70 },
          { userId: 40, score: 50 },
        ],
      },
    ];

    const result = buildTeams(testPools, 4, 5);
    assert.strictEqual(result.error, null);
    assert(result.variants.length >= 2);

    const first = result.variants[0];
    const second = result.variants[1];

    assert(first.teamScore >= second.teamScore);

    // Проверяем, что комбинация (20, 30) со score 70/70 даёт teamScore 70,
    // а комбинация (10, 40) со score 90/50 даёт teamScore 64.
    const balancedVariant = result.variants.find(v =>
      v.members.some(m => m.userId === 20) && v.members.some(m => m.userId === 30)
    );
    const starPassengerVariant = result.variants.find(v =>
      v.members.some(m => m.userId === 10) && v.members.some(m => m.userId === 40)
    );

    assert(balancedVariant, 'Balanced variant should exist');
    assert(starPassengerVariant, 'Star+passenger variant should exist');
    assert(
      balancedVariant.teamScore > starPassengerVariant.teamScore,
      `Balanced teamScore (${balancedVariant.teamScore}) must be greater than star+passenger (${starPassengerVariant.teamScore})`
    );
  });

  it('4. Возвращает не более N лучших вариантов (по умолчанию 3)', () => {
    const result = buildTeams(dummyPools, 4, 3);
    assert.strictEqual(result.error, null);
    assert(result.variants.length <= 3);
  });
});
