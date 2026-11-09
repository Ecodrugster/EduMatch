// matching/scoreCandidate.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { scoreCandidate } = require('./scoreCandidate');

describe('scoreCandidate', () => {
  const baseRole = {
    id: 1,
    title: 'Frontend Developer',
    hoursPerWeek: 20,
    requirements: [
      { skillId: 10, skillName: 'React', minLevel: 4, weight: 2 },
      { skillId: 20, skillName: 'TypeScript', minLevel: 3, weight: 1 },
    ],
  };

  it('1. Подтверждённый навык даёт больший score, чем такой же неподтверждённый', () => {
    const verifiedUser = {
      id: 101,
      hoursPerWeek: 20,
      avgPeerScore: null,
      skills: [
        { skillId: 10, level: 4, verified: true },
        { skillId: 20, level: 3, verified: true },
      ],
    };

    const unverifiedUser = {
      id: 102,
      hoursPerWeek: 20,
      avgPeerScore: null,
      skills: [
        { skillId: 10, level: 4, verified: false },
        { skillId: 20, level: 3, verified: false },
      ],
    };

    const verifiedResult = scoreCandidate(baseRole, verifiedUser);
    const unverifiedResult = scoreCandidate(baseRole, unverifiedUser);

    assert(
      verifiedResult.score > unverifiedResult.score,
      `Expected verified score (${verifiedResult.score}) > unverified score (${unverifiedResult.score})`
    );
    assert(verifiedResult.reasons.some(r => r.includes('+ React 4/5, подтверждён')));
    assert(unverifiedResult.reasons.some(r => r.includes('~ React 4/5, не подтверждён')));
  });

  it('2. Нехватка времени снижает S_time и добавляет причину с минусом', () => {
    const fullTimeUser = {
      id: 103,
      hoursPerWeek: 20,
      avgPeerScore: 4.5,
      skills: [{ skillId: 10, level: 4, verified: true }],
    };

    const partTimeUser = {
      id: 104,
      hoursPerWeek: 10,
      avgPeerScore: 4.5,
      skills: [{ skillId: 10, level: 4, verified: true }],
    };

    const fullResult = scoreCandidate(baseRole, fullTimeUser);
    const partResult = scoreCandidate(baseRole, partTimeUser);

    assert(partResult.parts.sTime === 0.5, 'S_time should be 10/20 = 0.5');
    assert(fullResult.parts.sTime === 1.0, 'S_time should be 20/20 = 1.0');
    assert(fullResult.score > partResult.score, 'Full time candidate should have higher score');
    assert(partResult.reasons.some(r => r.includes('− готов 10 ч/нед из 20')));
  });

  it('3. Новичок без отзывов получает S_rel = 0.6, а опытный — avgPeerScore / 5', () => {
    const newbie = {
      id: 105,
      hoursPerWeek: 20,
      avgPeerScore: null,
      skills: [{ skillId: 10, level: 4, verified: true }],
    };

    const veteran = {
      id: 106,
      hoursPerWeek: 20,
      avgPeerScore: 5.0,
      skills: [{ skillId: 10, level: 4, verified: true }],
    };

    const newbieResult = scoreCandidate(baseRole, newbie);
    const veteranResult = scoreCandidate(baseRole, veteran);

    assert.strictEqual(newbieResult.parts.sRel, 0.6);
    assert.strictEqual(veteranResult.parts.sRel, 1.0);
    assert(newbieResult.reasons.some(r => r.includes('~ пока нет отзывов')));
    assert(veteranResult.reasons.some(r => r.includes('+ надёжность 5.0/5')));
  });

  it('4. Кандидат со score < 40 или в 2+ активных проектах отсекается (eligible = false)', () => {
    const busyUser = {
      id: 107,
      hoursPerWeek: 20,
      activeProjectsCount: 2,
      skills: [{ skillId: 10, level: 4, verified: true }],
    };

    const weakUser = {
      id: 108,
      hoursPerWeek: 5,
      avgPeerScore: 1.0,
      skills: [],
    };

    const busyResult = scoreCandidate(baseRole, busyUser);
    const weakResult = scoreCandidate(baseRole, weakUser);

    assert.strictEqual(busyResult.eligible, false, 'Busy user in 2 projects should be ineligible');
    assert.strictEqual(weakResult.eligible, false, 'Weak user with score < 40 should be ineligible');
    assert(weakResult.score < 40);
  });

  it('5. [Доп. задание] Автор проекта может настраивать веса формулы (например, приоритет времени)', () => {
    const expertBusyUser = {
      id: 109,
      hoursPerWeek: 10, // мало времени
      avgPeerScore: 5.0,
      skills: [
        { skillId: 10, level: 5, verified: true },
        { skillId: 20, level: 5, verified: true },
      ],
    };

    const midFreeUser = {
      id: 110,
      hoursPerWeek: 20, // много времени
      avgPeerScore: 4.0,
      skills: [
        { skillId: 10, level: 3, verified: true },
        { skillId: 20, level: 3, verified: true },
      ],
    };

    // При стандартных весах (skills: 0.6, time: 0.2) эксперт побеждает
    const standardExpert = scoreCandidate(baseRole, expertBusyUser);
    const standardMid = scoreCandidate(baseRole, midFreeUser);
    assert(standardExpert.score > standardMid.score, 'Expert wins on standard weights');

    // При дедлайновых весах (skills: 0.2, time: 0.6, reliability: 0.2) свободный побеждает
    const deadlineWeights = { skills: 0.2, time: 0.6, reliability: 0.2 };
    const deadlineExpert = scoreCandidate(baseRole, expertBusyUser, deadlineWeights);
    const deadlineMid = scoreCandidate(baseRole, midFreeUser, deadlineWeights);
    assert(
      deadlineMid.score > deadlineExpert.score,
      `Mid with time (${deadlineMid.score}) should win over busy expert (${deadlineExpert.score}) with custom weights`
    );
  });
});
