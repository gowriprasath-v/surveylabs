const db = require('../../database');

exports.getGlobalAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const range = req.query.range || '12M';

    // 1. Total Surveys owned by this user (column is created_by, NOT user_id)
    const surveys = db
      .prepare('SELECT id, title, is_active FROM surveys WHERE created_by = ?')
      .all(userId);

    const surveyIds = surveys.map(s => s.id);
    const activeSurveys = surveys.filter((s) => Number(s.is_active) === 1).length;

    if (surveyIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalSurveys: 0,
          activeSurveys: 0,
          totalResponses: 0,
          responsesChange: '—', responsesTrend: 'neutral',
          activeSurveysChange: '—', activeSurveysTrend: 'neutral',
          completionChange: '—', completionTrend: 'neutral',
          timeChange: '—', timeTrend: 'neutral',
          avgCompletionRate: '0%',
          avgTime: '0s',
          qualityDistribution: [],
          responseTrend: { hour: [], day: [], month: [], year: [] },
          topSurveys: [],
          completionByDay: [],
          recentResponses: [],
        }
      });
    }

    const placeholders = surveyIds.map(() => '?').join(',');

    const now = new Date();
    let windowStart = new Date(now);
    switch (range) {
      case '7D': windowStart.setDate(now.getDate() - 7); break;
      case '30D': windowStart.setDate(now.getDate() - 30); break;
      case '3M': windowStart.setMonth(now.getMonth() - 3); break;
      case 'YTD': windowStart = new Date(now.getFullYear(), 0, 1); break;
      case '12M':
      default: windowStart.setMonth(now.getMonth() - 12); break;
    }
    // Split the window in half: older half = prior, newer half = current
    const midPoint = new Date((windowStart.getTime() + now.getTime()) / 2);

    const responsesAll = db
      .prepare(`SELECT * FROM responses WHERE survey_id IN (${placeholders})`)
      .all(...surveyIds);

    // All responses within the window
    const responsesInWindow = responsesAll.filter(r => new Date(r.submitted_at) >= windowStart);
    // Recent half
    const responses = responsesInWindow.filter(r => new Date(r.submitted_at) >= midPoint);
    // Older half
    const responsesPrior = responsesInWindow.filter(r => new Date(r.submitted_at) < midPoint);

    // Question counts per survey (for completion rate)
    const questionCounts = db
      .prepare(`SELECT survey_id, COUNT(*) as count FROM questions WHERE survey_id IN (${placeholders}) GROUP BY survey_id`)
      .all(...surveyIds).reduce((acc, row) => { acc[row.survey_id] = row.count; return acc; }, {});

    // Answer counts per response (for completion rate)
    const responseIdsAll = responsesAll.map((r) => r.id);
    const answerCounts = responseIdsAll.length === 0 ? {} : db
      .prepare(`SELECT response_id, COUNT(*) as count FROM answers WHERE response_id IN (${responseIdsAll.map(() => '?').join(',')}) GROUP BY response_id`)
      .all(...responseIdsAll).reduce((acc, row) => { acc[row.response_id] = row.count; return acc; }, {});

    const computeKPIs = (respArray) => {
      let rCount = respArray.length;
      let sumRates = 0;
      let validAvgCount = 0;
      let sumTime = 0;
      respArray.forEach(r => {
        const qTotal = questionCounts[r.survey_id] || 0;
        if (qTotal > 0) {
          const aCount = answerCounts[r.id] || 0;
          sumRates += Math.min(1, aCount / qTotal);
        }
        if (r.completion_time_ms > 0) {
          sumTime += r.completion_time_ms;
          validAvgCount++;
        }
      });
      return { total: rCount, rate: rCount > 0 ? (sumRates / rCount) : 0, avgMs: validAvgCount > 0 ? (sumTime / validAvgCount) : 0 };
    };

    const currStats = computeKPIs(responses);
    const priorStats = computeKPIs(responsesPrior);

    // Use total window responses for display values (not just recent half)
    const allWindowStats = computeKPIs(responsesInWindow);
    const totalResponses = responsesInWindow.length;
    const avgSec = Math.round(allWindowStats.avgMs / 1000);
    const avgTimeStr = avgSec >= 60 ? `${Math.floor(avgSec / 60)}m ${avgSec % 60}s` : `${avgSec}s`;
    const avgCompletionRate = `${Math.round(allWindowStats.rate * 100)}%`;

    const formatDiff = (curr, prior, suffix = '') => {
      const diff = curr - prior;
      if (diff === 0) return { change: `—`, trend: 'neutral' };
      return { change: diff > 0 ? `+${diff}${suffix}` : `${diff}${suffix}`, trend: diff > 0 ? 'up' : 'down' };
    };

    // All trends now compare recent half vs older half of the window
    let responsesKPI = formatDiff(currStats.total, priorStats.total, '');
    let completionKPI = formatDiff(Math.round(currStats.rate * 100), Math.round(priorStats.rate * 100), '%');
    // For time: INCREASING avg time is BAD (respondents slower) → invert trend direction
    const rawTimeDiff = Math.round(currStats.avgMs / 1000) - Math.round(priorStats.avgMs / 1000);
    let timeKPI = rawTimeDiff === 0
      ? { change: '—', trend: 'neutral' }
      : { change: rawTimeDiff > 0 ? `+${rawTimeDiff}s` : `${rawTimeDiff}s`, trend: rawTimeDiff > 0 ? 'down' : 'up' };
    // Active surveys: count surveys that received responses in each half
    const activeCurr = new Set(responses.map(r => r.survey_id)).size;
    const activePrior = new Set(responsesPrior.map(r => r.survey_id)).size;
    let activeSurveysKPI = formatDiff(activeCurr, activePrior, '');

    // 3. Quality Distribution (real data using quality_label)
    let good = 0, suspect = 0, spam = 0;
    responsesInWindow.forEach(r => {
      const q = r.quality_label || 'good';
      if (q === 'good') good++;
      else if (q === 'suspect') suspect++;
      else spam++;
    });

    const qualityDistribution = totalResponses === 0 ? [] : [
      { name: 'Valid', value: Math.round((good / totalResponses) * 100), fill: '#10B981' },
      { name: 'Suspect', value: Math.round((suspect / totalResponses) * 100), fill: '#F59E0B' },
      { name: 'Spam', value: Math.round((spam / totalResponses) * 100), fill: '#EF4444' },
    ];

    // 4. Response Trend — aggregated cleanly across multiple granularities
    const sortedForTrend = [...responsesInWindow].sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
    const trendsObj = { hour: new Map(), day: new Map(), month: new Map(), year: new Map() };

    sortedForTrend.forEach(r => {
      const d = new Date(r.submitted_at);
      if (isNaN(d)) return;

      const yr = d.getFullYear().toString();
      const mo = d.toLocaleDateString('en-US', { month: 'short' });
      const dy = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const hr = `${dy} ${d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}`;

      trendsObj.year.set(yr, (trendsObj.year.get(yr) || 0) + 1);
      trendsObj.month.set(mo, (trendsObj.month.get(mo) || 0) + 1);
      trendsObj.day.set(dy, (trendsObj.day.get(dy) || 0) + 1);
      trendsObj.hour.set(hr, (trendsObj.hour.get(hr) || 0) + 1);
    });

    const mapToArray = (map) => Array.from(map, ([date, responses]) => ({ date, responses }));
    const responseTrend = {
      hour: mapToArray(trendsObj.hour),
      day: mapToArray(trendsObj.day),
      month: mapToArray(trendsObj.month),
      year: mapToArray(trendsObj.year)
    };

    // 4.5 Response Trend (daily + weekly) for Dashboard (derived from full response set)
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    // Daily: last 14 days
    const responseTrendDaily = Array.from({ length: 14 }).map((_, idx) => {
      const day = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (13 - idx)));
      const label = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const count = responsesAll.filter((r) => {
        const t = new Date(r.submitted_at);
        return t >= day && t <= endOfDay(day);
      }).length;
      return { date: label, responses: count };
    });

    // Weekly: last 6 weeks, week starts Monday
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const thisMonday = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday));
    const responseTrendWeekly = Array.from({ length: 6 }).map((_, idx) => {
      const start = new Date(thisMonday);
      start.setDate(thisMonday.getDate() - (7 * (5 - idx)));
      const end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
      const label = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const count = responsesAll.filter((r) => {
        const t = new Date(r.submitted_at);
        return t >= start && t <= end;
      }).length;
      return { date: label, responses: count };
    });

    // 5. Top Surveys (real completion rate & trends)
    const topSurveys = surveys.map(s => {
      const sResp = responses.filter(r => r.survey_id === s.id);
      const sPrior = responsesPrior.filter(r => r.survey_id === s.id);

      const qTotal = questionCounts[s.id] || 0;
      let totalAnswers = 0;
      sResp.forEach(r => { totalAnswers += (answerCounts[r.id] || 0); });

      const maxPossibleAnswers = sResp.length * qTotal;
      let rate = 0;
      if (maxPossibleAnswers > 0) rate = Math.round((totalAnswers / maxPossibleAnswers) * 100);

      const trend = sResp.length > sPrior.length ? 'up' : sResp.length < sPrior.length ? 'down' : 'neutral';

      return {
        id: s.id,
        title: s.title.length > 28 ? s.title.slice(0, 25) + '...' : s.title,
        responses: sResp.length,
        rate,
        trend,
        is_active: s.is_active,
      };
    }).sort((a, b) => b.responses - a.responses).slice(0, 5);

    // 6. Completion By Day (real data using submitted_at)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayMap = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    responses.forEach(r => {
      const d = new Date(r.submitted_at);
      if (!isNaN(d.getDay())) dayMap[dayNames[d.getDay()]] += 1;
    });
    const completionByDay = dayNames.map(day => ({
      day,
      rate: totalResponses > 0 ? Math.round((dayMap[day] / totalResponses) * 100) : 0
    }));

    // 8. Recent Responses Feed (for Dashboard Live Feed)
    const recentResponses = [...responsesAll]
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
      .slice(0, 15)
      .map(r => {
        const matchingSurvey = surveys.find(s => s.id === r.survey_id);
        return {
          id: r.id,
          surveyId: r.survey_id,
          surveyTitle: matchingSurvey ? matchingSurvey.title : 'Unknown Survey',
          time: r.submitted_at,
          valid: (r.quality_label || 'good') !== 'spam',
          quality_label: r.quality_label || 'good',
          respondent_ip: r.respondent_ip || 'Anonymous'
        };
      });

    res.json({
      success: true,
      data: {
        totalSurveys: surveys.length,
        activeSurveys,
        totalResponses,
        avgCompletionRate,
        avgTime: avgTimeStr,
        responsesChange: responsesKPI.change,
        responsesTrend: responsesKPI.trend,
        activeSurveysChange: activeSurveysKPI.change,
        activeSurveysTrend: activeSurveysKPI.trend,
        completionChange: completionKPI.change,
        completionTrend: completionKPI.trend,
        timeChange: timeKPI.change,
        timeTrend: timeKPI.trend,
        qualityDistribution,
        responseTrend,
        responseTrendDaily,
        responseTrendWeekly,
        topSurveys,
        completionByDay,
        recentResponses,
      }
    });

  } catch (err) {
    next(err);
  }
};

exports.getConversationalSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const qualityFilter = req.query.quality;
    const statusFilter = req.query.status;

    // 1) Load conversational surveys for this user
    const surveys = db
      .prepare("SELECT id, title FROM surveys WHERE created_by = ? AND mode = 'conversational'")
      .all(userId);

    const surveyIds = surveys.map(s => s.id);
    const placeholders = surveyIds.map(() => '?').join(',');

    // 2) In-memory live sessions (WS) — includes in-progress sessions not yet stored as responses
    const now = Date.now();
    const abandonAfterMs = 10 * 60 * 1000;
    const store = req.app.get('conversationSessions');
    const liveSessionsRaw = [];
    if (store && typeof store.values === 'function') {
      for (const s of store.values()) {
        if (!s || Number(s.ownerId) !== Number(userId)) continue;
        if (!s.surveyId || (surveyIds.length > 0 && !surveyIds.includes(String(s.surveyId)))) continue;

        const lastTs = new Date(s.lastMessageAt || s.startedAt || 0).getTime();
        const isCompleted = s.status === 'completed';
        const isAbandoned = !isCompleted && lastTs && now - lastTs > abandonAfterMs;
        const status = isCompleted ? 'completed' : (isAbandoned ? 'abandoned' : 'in-progress');
        const messages = Array.isArray(s.messages) ? s.messages : [];
        const answersCount = messages.filter((m) => m?.from === 'user').length;

        liveSessionsRaw.push({
          id: String(s.sessionId || s.id),
          surveyId: String(s.surveyId),
          survey: String(s.surveyTitle || 'Conversational Survey'),
          respondent: String(s.respondent || 'Live Active User'),
          started: s.startedAt || s.lastMessageAt || new Date().toISOString(),
          duration: s.duration || '0s',
          progress: Number.isFinite(Number(s.progress)) ? Number(s.progress) : 0,
          status,
          quality_label: s.quality_label || 'good',
          questions_count: 0,
          answers_count: answersCount,
          last_message_at: s.lastMessageAt || s.startedAt || new Date().toISOString(),
          messages,
        });
      }
    }

    // Fill question counts for live sessions (single query)
    if (liveSessionsRaw.length > 0) {
      const idsToCount = [...new Set(liveSessionsRaw.map((s) => s.surveyId).filter(Boolean))];
      if (idsToCount.length > 0) {
        const qCounts = db
          .prepare(`SELECT survey_id, COUNT(*) as count FROM questions WHERE survey_id IN (${idsToCount.map(() => '?').join(',')}) GROUP BY survey_id`)
          .all(...idsToCount)
          .reduce((acc, row) => { acc[row.survey_id] = row.count; return acc; }, {});
        liveSessionsRaw.forEach((sess) => {
          sess.questions_count = qCounts[sess.surveyId] || 0;
        });
      }
    }

    // 3) DB-backed sessions (completed / partially answered)
    const dbSessions = [];
    if (surveyIds.length > 0) {
      const maxFetch = Math.min(Math.max(limit + offset, 50), 500);
      const qualityClause = qualityFilter ? 'AND quality_label = ?' : '';
      const responses = db
        .prepare(`SELECT * FROM responses WHERE survey_id IN (${placeholders}) ${qualityClause} ORDER BY submitted_at DESC LIMIT ?`)
        .all(...(qualityFilter ? [...surveyIds, qualityFilter, maxFetch] : [...surveyIds, maxFetch]));

      if (responses.length > 0) {
        const responseIds = responses.map(r => r.id);
        const rPlaceholders = responseIds.map(() => '?').join(',');

        const answersQuery = `
          SELECT a.response_id, a.answer_value, q.label, q.order_index
          FROM answers a
          JOIN questions q ON a.question_id = q.id
          WHERE a.response_id IN (${rPlaceholders})
          ORDER BY q.order_index ASC
        `;
        const answers = db.prepare(answersQuery).all(...responseIds);

        const questionCounts = db
          .prepare(`SELECT survey_id, COUNT(*) as count FROM questions WHERE survey_id IN (${placeholders}) GROUP BY survey_id`)
          .all(...surveyIds)
          .reduce((acc, row) => {
            acc[row.survey_id] = row.count;
            return acc;
          }, {});

        responses.forEach((r) => {
          const survey = surveys.find(s => s.id === r.survey_id);
          const rAnswers = answers.filter(a => a.response_id === r.id);
          const questionsTotal = questionCounts[r.survey_id] || 0;
          const progress = questionsTotal > 0 ? Math.min(100, Math.round((rAnswers.length / questionsTotal) * 100)) : 0;

          const lastTs = new Date(r.submitted_at || 0).getTime();
          const isCompleted = progress >= 100;
          const isAbandoned = !isCompleted && lastTs && now - lastTs > abandonAfterMs;
          const status = isCompleted ? 'completed' : (isAbandoned ? 'abandoned' : 'in-progress');

          const messages = [];
          rAnswers.forEach((ans) => {
            messages.push({ from: 'bot', text: ans.label });
            messages.push({ from: 'user', text: ans.answer_value });
          });
          if (messages.length > 0) {
            messages.push({ from: 'bot', text: 'Thank you for taking the time to complete our survey!' });
          }

          const completionSecs = r.completion_time_ms ? Math.round(r.completion_time_ms / 1000) : 0;
          const duration = completionSecs >= 60 ? `${Math.floor(completionSecs / 60)}m ${completionSecs % 60}s` : `${completionSecs}s`;

          dbSessions.push({
            id: r.id,
            survey: survey ? survey.title : 'Unknown Survey',
            respondent: r.respondent_ip ? `User ${r.respondent_ip.substring(0, 6)}...` : `Anonymous ${r.id.substring(0, 4)}`,
            started: r.submitted_at,
            duration,
            progress,
            status,
            quality_label: r.quality_label || 'good',
            questions_count: questionsTotal,
            answers_count: rAnswers.length,
            last_message_at: r.submitted_at,
            messages,
          });
        });
      }
    }

    // 4) Merge + filter + paginate
    const merged = [...liveSessionsRaw, ...dbSessions]
      .filter((s) => {
        if (qualityFilter && s.quality_label !== qualityFilter) return false;
        if (statusFilter && s.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.last_message_at || b.started) - new Date(a.last_message_at || a.started));

    const page = merged.slice(offset, offset + limit);
    return res.json({ success: true, data: page });

  } catch (err) {
    next(err);
  }
};

exports.exportDatabase = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const format = (req.params.format || 'csv').toLowerCase();
    const range = req.query.range || '12M';

    const surveys = db.prepare('SELECT id, title FROM surveys WHERE created_by = ?').all(userId);
    const surveyIds = surveys.map(s => s.id);

    if (surveyIds.length === 0) {
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=surveylabs_export.json');
        return res.send(JSON.stringify([], null, 2));
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=surveylabs_export.csv');
        return res.send('response_id,survey_title,submitted_at,time_taken_seconds,quality,respondent_ip,answers\n');
      }
    }

    const now = new Date();
    let currentPeriodStart = new Date(now);
    switch (range) {
      case '7D': currentPeriodStart.setDate(now.getDate() - 7); break;
      case '30D': currentPeriodStart.setDate(now.getDate() - 30); break;
      case '3M': currentPeriodStart.setMonth(now.getMonth() - 3); break;
      case 'YTD': currentPeriodStart = new Date(now.getFullYear(), 0, 1); break;
      case '12M':
      default: currentPeriodStart.setMonth(now.getMonth() - 12); break;
    }

    const placeholders = surveyIds.map(() => '?').join(',');
    const responsesAll = db
      .prepare(`SELECT * FROM responses WHERE survey_id IN (${placeholders}) ORDER BY submitted_at DESC`)
      .all(...surveyIds);

    const responses = responsesAll.filter(r => new Date(r.submitted_at) >= currentPeriodStart);

    if (responses.length === 0) {
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=surveylabs_export.json');
        return res.send(JSON.stringify([], null, 2));
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=surveylabs_export.csv');
        return res.send('response_id,survey_title,submitted_at,time_taken_seconds,quality,respondent_ip,answers\n');
      }
    }

    const responseIds = responses.map(r => r.id);
    const rPlaceholders = responseIds.map(() => '?').join(',');
    const answerRows = db
      .prepare(`SELECT a.*, q.label as question_label FROM answers a LEFT JOIN questions q ON a.question_id = q.id WHERE a.response_id IN (${rPlaceholders})`)
      .all(...responseIds);

    const exportData = responses.map(r => {
      const survey = surveys.find(s => s.id === r.survey_id);
      const rAnswers = answerRows.filter(a => a.response_id === r.id);
      const answerSummary = rAnswers
        .map(a => `${a.question_label || a.question_id}: ${a.answer_value}`)
        .join(' | ');

      return {
        response_id: r.id,
        survey_title: survey ? survey.title : 'Unknown',
        submitted_at: r.submitted_at,
        time_taken_seconds: r.completion_time_ms ? Math.round(r.completion_time_ms / 1000) : 0,
        quality: r.quality_label || 'good',
        respondent_ip: r.respondent_ip || 'Anonymous',
        answers: answerSummary,
      };
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=surveylabs_export_${Date.now()}.json`);
      return res.send(JSON.stringify(exportData, null, 2));
    }

    // CSV
    const csvHeaders = ['response_id', 'survey_title', 'submitted_at', 'time_taken_seconds', 'quality', 'respondent_ip', 'answers'];
    const csvRows = exportData.map(row =>
      csvHeaders.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [csvHeaders.join(','), ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=surveylabs_export_${Date.now()}.csv`);
    return res.send(csv);

  } catch (err) {
    next(err);
  }
};
