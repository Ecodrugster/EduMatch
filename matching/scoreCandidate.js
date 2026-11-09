// matching/scoreCandidate.js
const DEFAULT_W = { skills: 0.6, time: 0.2, reliability: 0.2 };
const UNVERIFIED_FACTOR = 0.6;
const NEWBIE_RELIABILITY = 0.6;

function scoreCandidate(role, user, customWeights = DEFAULT_W) {
  const W = {
    skills: customWeights?.skills ?? DEFAULT_W.skills,
    time: customWeights?.time ?? DEFAULT_W.time,
    reliability: customWeights?.reliability ?? DEFAULT_W.reliability,
  };

  const reasons = [];
  let weighted = 0, totalWeight = 0;

  const roleReqs = role.requirements || [];
  for (const req of roleReqs) {
    const reqSkillId = req.skillId !== undefined ? req.skillId : req.skill_id;
    const reqSkillName = req.skillName || req.skill_name || `Навык #${reqSkillId}`;
    const reqMinLevel = req.minLevel !== undefined ? req.minLevel : req.min_level;
    const reqWeight = req.weight !== undefined ? req.weight : 1;

    const userSkills = user.skills || [];
    const us = userSkills.find(s => (s.skillId !== undefined ? s.skillId : s.skill_id) === reqSkillId);
    totalWeight += reqWeight;

    if (!us) {
      reasons.push(`− нет навыка ${reqSkillName}`);
      continue;
    }

    const userLevel = us.level || 0;
    const isVerified = Boolean(us.verified);

    const levelFit = Math.min(userLevel / reqMinLevel, 1);
    const factor = isVerified ? 1 : UNVERIFIED_FACTOR;
    weighted += reqWeight * levelFit * factor;

    if (levelFit >= 1 && isVerified) {
      reasons.push(`+ ${reqSkillName} ${userLevel}/5, подтверждён`);
    } else if (levelFit >= 1) {
      reasons.push(`~ ${reqSkillName} ${userLevel}/5, не подтверждён`);
    } else {
      reasons.push(`− ${reqSkillName}: ${userLevel} из нужных ${reqMinLevel}`);
    }
  }

  const sSkills = totalWeight ? weighted / totalWeight : 0;
  const userHours = user.hoursPerWeek !== undefined ? user.hoursPerWeek : (user.hours_per_week || 0);
  const roleHours = role.hoursPerWeek !== undefined ? role.hoursPerWeek : (role.hours_per_week || 1);

  const sTime = Math.min(userHours / roleHours, 1);
  if (sTime < 1) {
    reasons.push(`− готов ${userHours} ч/нед из ${roleHours}`);
  }

  const avgPeerScore = user.avgPeerScore !== undefined ? user.avgPeerScore : user.avg_peer_score;
  const sRel = (avgPeerScore !== null && avgPeerScore !== undefined && avgPeerScore > 0)
    ? avgPeerScore / 5
    : NEWBIE_RELIABILITY;

  if (avgPeerScore !== null && avgPeerScore !== undefined && avgPeerScore > 0) {
    reasons.push(`+ надёжность ${Number(avgPeerScore).toFixed(1)}/5`);
  } else {
    reasons.push('~ пока нет отзывов');
  }

  const score = W.skills * sSkills + W.time * sTime + W.reliability * sRel;
  const activeProjectsCount = user.activeProjectsCount !== undefined ? user.activeProjectsCount : (user.active_projects_count || 0);

  const roundedScore = Math.round(score * 100);
  const eligible = roundedScore >= 40 && activeProjectsCount < 2;

  return {
    userId: user.id,
    score: roundedScore,
    parts: { sSkills, sTime, sRel },
    weights: W,
    reasons,
    eligible,
  };
}

module.exports = { scoreCandidate, DEFAULT_W, W: DEFAULT_W, UNVERIFIED_FACTOR, NEWBIE_RELIABILITY };
