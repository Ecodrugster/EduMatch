// matching/buildTeams.js

function buildTeams(rolesWithCandidates, topN = 4, variants = 3) {
  // Проверяем, есть ли роли без кандидатов
  for (const r of rolesWithCandidates) {
    const roleTitle = r.roleTitle || r.title || `ID ${r.roleId}`;
    if (!r.candidates || r.candidates.length === 0) {
      return {
        error: `Роль ${roleTitle} не закрыта`,
        variants: [],
      };
    }
  }

  const pools = rolesWithCandidates.map(r => ({
    roleId: r.roleId,
    roleTitle: r.roleTitle || r.title || `Роль #${r.roleId}`,
    candidates: [...r.candidates].sort((a, b) => b.score - a.score).slice(0, topN),
  }));

  const results = [];

  function walk(i, picked, used) {
    if (i === pools.length) {
      const scores = picked.map(p => p.score);
      const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
      const min = Math.min(...scores);
      const teamScore = Math.round(0.7 * avg + 0.3 * min);
      results.push({
        teamScore,
        avgScore: Math.round(avg),
        minScore: min,
        members: [...picked],
      });
      return;
    }

    for (const c of pools[i].candidates) {
      if (used.has(c.userId)) continue;
      used.add(c.userId);
      picked.push({
        roleId: pools[i].roleId,
        roleTitle: pools[i].roleTitle,
        ...c,
      });
      walk(i + 1, picked, used);
      picked.pop();
      used.delete(c.userId);
    }
  }

  walk(0, [], new Set());

  const sorted = results.sort((a, b) => b.teamScore - a.teamScore).slice(0, variants);

  if (sorted.length === 0) {
    return {
      error: 'Не удалось сформировать варианты команды без повторяющихся участников',
      variants: [],
    };
  }

  return {
    error: null,
    variants: sorted,
  };
}

module.exports = { buildTeams };
