/**
 * Local-First AI Chat Intelligence Engine
 * 100% on-device processing - Zero cloud API calls, zero data egress.
 */

class LocalChatIntelligenceEngine {
  constructor() {
    this.criticalKeywords = [
      'critical', 'blocker', 'outage', 'p0', 'down', 'emergency',
      'broken', 'rollback', 'incident', '502', 'breach', 'vulnerability',
      'crash', 'fatal', 'failing', 'hotfix', 'sev1', 'sev0', 'alert'
    ];

    this.urgentKeywords = [
      'asap', 'urgently', 'urgent', 'immediately', 'deadline', 'today',
      'eod', 'freeze', 'cutoff', 'holding off', 'blocked', 'eta',
      'now', 'needs attention', 'quick turnaround', 'time-sensitive', 'due'
    ];

    this.actionVerbs = [
      'deploy', 'fix', 'rollback', 'investigate', 'check', 'verify',
      'inspect', 'review', 'update', 'flush', 'restart', 'monitor',
      'write', 'draft', 'send', 'merge', 'test', 'benchmark', 'configure',
      'enable', 'disable', 'prepare', 'coordinate', 'terminate', 'restore'
    ];

    this.decisionPatterns = [
      /decision:\s*(.+)/i,
      /decided\s+(?:to|that)\s+(.+)/i,
      /we\s+agreed\s+(?:to|on|that)\s+(.+)/i,
      /approved:\s*(.+)/i,
      /consensus\s+(?:is|reached:)\s*(.+)/i,
      /final\s+call:\s*(.+)/i,
      /we\s+will\s+officially\s+(?:adopt|use|proceed with)\s+(.+)/i,
      /going\s+with\s+(?:option\s+)?([A-Z0-9\s]+for\s+.+)/i
    ];

    this.actionPatterns = [
      /action\s+item:\s*(.+)/i,
      /todo:\s*(.+)/i,
      /(?:@?([\w\s]+?)[,:]?\s+)?please\s+([\w\s]+?(?:by\s+[\w\s:]+|asap|today|tomorrow|eod)?)/i,
      /need\s+(?:someone|@?([\w]+))\s+to\s+([\w\s]+)/i,
      /make\s+sure\s+to\s+([\w\s]+)/i,
      /assigning\s+@?([\w]+)\s+to\s+([\w\s]+)/i,
      /i\s*['’]ll\s+([\w\s]+)/i,
      /i\s+will\s+([\w\s]+)/i
    ];

    this.deadlinePatterns = [
      /(?:by|before|until|due)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|est|pst|utc)?)/i,
      /(?:by|before)\s+(eod(?:\s+today|\s+tomorrow)?)/i,
      /(?:by|before)\s+(today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(?:eta|in)\s+(\d+\s*(?:minutes|mins|hours|hrs|days))/i,
      /(asap|immediately|right\s+now)/i
    ];

    this.announcementPatterns = [
      /announcement:\s*(.+)/i,
      /notice:\s*(.+)/i,
      /(?:@channel|@everyone|@here)\s*(.+)/i,
      /official update:\s*(.+)/i
    ];

    this.changedPlanPatterns = [
      /(?:rescheduled|moved|pushed back|delayed|shifted|extended)\s+(?:from\s+([^,]+?)\s+)?to\s+([^,.\n]+)/i,
      /(?:venue|location|room|link)\s+(?:changed|switched|moved)\s+(?:from\s+([^,]+?)\s+)?to\s+([^,.\n]+)/i,
      /correction:\s*(.+)/i,
      /update:\s*(.+)/i
    ];

    this.tentativeKeywords = [
      'tentative', 'might', 'maybe', 'possibly', 'pending approval',
      'unconfirmed', 'not finalized', 'tentatively', 'thinking about'
    ];

    this.stats = {
      bytesProcessed: 0,
      bytesTransmitted: 0, // strictly 0
      executionTimeMs: 0,
      messagesAnalyzed: 0
    };
  }

  /**
   * Main entry point to analyze a conversation
   * @param {Array} messages - List of raw messages
   * @param {string} currentPersona - Current active user name/handle (e.g. 'Alex')
   * @returns {Object} Comprehensive intelligence report
   */
  analyze(messages, currentPersona = 'Alex') {
    const startTime = performance.now();
    const personaLower = currentPersona.toLowerCase().trim();

    const normalizedMessages = messages.map((m, idx) => {
      const text = m.text || '';
      return {
        id: m.id || `msg_${idx}`,
        author: m.author || 'Anonymous',
        time: m.time || 'N/A',
        text: text,
        rawIndex: idx,
        isFromMe: (m.author || '').toLowerCase().includes(personaLower)
      };
    });

    const analyzedMessages = normalizedMessages.map(msg => {
      return this.analyzeMessage(msg, personaLower);
    });

    // Extract all structured insights
    const actionItems = this.extractActionItems(analyzedMessages, personaLower);
    const decisions = this.extractDecisions(analyzedMessages);
    const changedPlans = this.extractChangedPlans(analyzedMessages);
    const announcements = this.extractAnnouncements(analyzedMessages);
    const deadlinesRadar = this.extractDeadlinesRadar(analyzedMessages, actionItems, personaLower);
    const mentionsAndQuestions = this.extractMentionsAndQuestions(analyzedMessages, personaLower);
    const topicClusters = this.clusterTopics(analyzedMessages);
    const criticalUpdatesMissed = this.extractCriticalUpdatesMissed(analyzedMessages, personaLower);
    const chronologicalTimeline = this.extractChronologicalTimeline(analyzedMessages, actionItems, decisions, changedPlans, deadlinesRadar);
    const executiveDigest = this.generateExecutiveDigest(analyzedMessages, actionItems, decisions, mentionsAndQuestions, changedPlans, announcements, currentPersona);

    const endTime = performance.now();
    const totalBytes = normalizedMessages.reduce((acc, m) => acc + (m.text ? m.text.length : 0), 0);

    this.stats = {
      bytesProcessed: totalBytes,
      bytesTransmitted: 0, // 100% offline verification
      executionTimeMs: Math.round((endTime - startTime) * 10) / 10,
      messagesAnalyzed: normalizedMessages.length
    };

    return {
      messages: analyzedMessages,
      summary: executiveDigest,
      actionItems: actionItems,
      decisions: decisions,
      changedPlans: changedPlans,
      announcements: announcements,
      deadlinesRadar: deadlinesRadar,
      mentionsAndQuestions: mentionsAndQuestions,
      criticalUpdatesMissed: criticalUpdatesMissed,
      chronologicalTimeline: chronologicalTimeline,
      topicClusters: topicClusters,
      metrics: {
        totalUnread: normalizedMessages.length,
        importantCount: analyzedMessages.filter(m => m.priorityTier === 'critical' || m.priorityTier === 'high').length,
        criticalCount: analyzedMessages.filter(m => m.priorityTier === 'critical').length,
        highCount: analyzedMessages.filter(m => m.priorityTier === 'high').length,
        mediumCount: analyzedMessages.filter(m => m.priorityTier === 'medium').length,
        lowCount: analyzedMessages.filter(m => m.priorityTier === 'low').length,
        forMeCount: analyzedMessages.filter(m => m.isRelevantToMe).length,
        pendingTasksCount: actionItems.filter(a => !a.completed).length,
        pendingActionsForMe: actionItems.filter(a => a.isAssignedToMe && !a.completed).length,
        upcomingDeadlinesCount: deadlinesRadar.length,
        criticalMissedCount: criticalUpdatesMissed.length,
        decisionsCount: decisions.length,
        changedPlansCount: changedPlans.length,
        announcementsCount: announcements.length,
        deadlinesCount: deadlinesRadar.length,
        timelineEventsCount: chronologicalTimeline.length
      },
      stats: this.stats
    };
  }

  /**
   * Analyze an individual message for score, intent, and priority
   */
  analyzeMessage(msg, personaLower) {
    const textLower = msg.text.toLowerCase();
    let score = 10; // Baseline
    const flags = [];

    // Check if bot alert (PagerDuty, Datadog, Sentry, AWS)
    const isBot = /bot|alert|pagerduty|datadog|sentry|cloudwatch/i.test(msg.author);
    if (isBot) {
      score += 15;
      flags.push('system_bot');
    }

    // 1. Direct Persona Mention
    const mentionsMe = textLower.includes(`@${personaLower}`) || 
                       (personaLower.length > 2 && textLower.includes(personaLower) && !msg.isFromMe);
    const mentionsBroadcast = textLower.includes('@channel') || 
                              textLower.includes('@here') || 
                              textLower.includes('@everyone') || 
                              textLower.includes('@team');

    if (mentionsMe) {
      score += 35;
      flags.push('mentions_me');
    } else if (mentionsBroadcast) {
      score += 15;
      flags.push('broadcast_mention');
    }

    // 2. Question directed at persona or general question
    const hasQuestionMark = msg.text.includes('?');
    const isInterrogative = /^(can|could|would|will|what|when|where|why|how|is|are|do|did|have|has)\s/i.test(msg.text.trim()) ||
                            /(?:can you|could you|what is|let me know|are you|do we have)/i.test(msg.text);

    let isQuestionForMe = false;
    if (hasQuestionMark || isInterrogative) {
      if (mentionsMe) {
        score += 25;
        isQuestionForMe = true;
        flags.push('question_for_me');
      } else {
        score += 10;
        flags.push('general_question');
      }
    }

    // 3. Critical Blockers / Severity
    let criticalMatches = 0;
    for (const kw of this.criticalKeywords) {
      if (textLower.includes(kw)) {
        criticalMatches++;
        flags.push(`critical_${kw}`);
      }
    }
    if (criticalMatches > 0) {
      score += Math.min(45, 30 + (criticalMatches - 1) * 10);
    }

    // 4. Urgent timing keywords
    let urgentMatches = 0;
    for (const kw of this.urgentKeywords) {
      if (textLower.includes(kw)) {
        urgentMatches++;
        flags.push(`urgent_${kw}`);
      }
    }
    if (urgentMatches > 0) {
      score += Math.min(30, 20 + (urgentMatches - 1) * 5);
    }

    // 5. Decision indicators
    let isDecision = false;
    for (const pattern of this.decisionPatterns) {
      if (pattern.test(msg.text)) {
        isDecision = true;
        score += 20;
        flags.push('decision');
        break;
      }
    }

    // 6. Action item indicators
    let hasActionItem = false;
    for (const pattern of this.actionPatterns) {
      if (pattern.test(msg.text)) {
        hasActionItem = true;
        score += 20;
        flags.push('action_item');
        break;
      }
    }

    // 7. Deadline detection
    let deadlineMatch = null;
    for (const pattern of this.deadlinePatterns) {
      const match = msg.text.match(pattern);
      if (match) {
        deadlineMatch = match[1] || match[0];
        score += 15;
        flags.push('has_deadline');
        break;
      }
    }

    // Cap score at 100
    score = Math.min(100, Math.max(0, score));

    // Determine Priority Tier
    const hasCriticalKeyword = criticalMatches > 0;
    const hasUrgentKeyword = urgentMatches > 0;

    let priorityTier = 'low';
    if (score >= 65 || (hasCriticalKeyword && mentionsMe)) {
      priorityTier = 'critical';
    } else if (score >= 45) {
      priorityTier = 'high';
    } else if (score >= 25) {
      priorityTier = 'medium';
    }

    const isRelevantToMe = mentionsMe || isQuestionForMe || (hasActionItem && textLower.includes(personaLower));

    return {
      ...msg,
      score,
      priorityTier,
      isRelevantToMe,
      mentionsMe,
      isQuestionForMe,
      isDecision,
      hasActionItem,
      hasCriticalKeyword,
      hasUrgentKeyword,
      deadlineMatch,
      flags
    };
  }

  /**
   * Extract and parse actionable tasks (who needs to do what and by when)
   */
  extractActionItems(analyzedMessages, personaLower) {
    const actionItems = [];

    analyzedMessages.forEach(msg => {
      let matched = false;

      // Direct explicit format: "Action Item: @User do something by 5 PM"
      const explicitMatch = msg.text.match(/(?:action\s*item|todo):\s*(.+)/i);
      if (explicitMatch) {
        const content = explicitMatch[1].trim();
        const assignee = this.extractAssignee(content, msg.author, personaLower);
        const deadline = this.extractDeadline(content);
        const cleanTask = this.cleanTaskDescription(content, assignee);
        const priority = this.calculateTaskPriority(msg, assignee, deadline);

        actionItems.push({
          id: `act_${msg.id}`,
          messageId: msg.id,
          author: msg.author,
          assignee: assignee.name,
          isAssignedToMe: assignee.isMe,
          task: cleanTask,
          priority: priority,
          deadline: deadline,
          time: msg.time,
          status: 'pending',
          completed: false,
          evidence: {
            quote: msg.text,
            author: msg.author,
            time: msg.time,
            reasoning: `Explicit action item assigned to @${assignee.name} with priority ${priority.toUpperCase()}.${deadline ? ` Due: ${deadline}` : ''}`
          },
          sourceMessage: msg
        });
        matched = true;
      }

      // Pattern: "@User please do X by Y" or "please do X"
      if (!matched) {
        const pleaseMatch = msg.text.match(/(?:@?([\w\s]+?)[,:]?\s+)?please\s+([\w\s,.'"-]+)/i);
        if (pleaseMatch) {
          const rawAssignee = pleaseMatch[1];
          const taskContent = pleaseMatch[2].trim();
          if (taskContent.length > 5) {
            const assignee = rawAssignee 
              ? this.extractAssignee(rawAssignee, msg.author, personaLower)
              : (msg.mentionsMe ? { name: personaLower, isMe: true } : { name: 'Team', isMe: false });
            const deadline = this.extractDeadline(msg.text);
            const hasActionVerb = this.actionVerbs.some(v => taskContent.toLowerCase().includes(v));
            const hasDeadline = !!deadline;

            // Only treat as action item if directed to someone, has deadline, or contains an action verb
            if (rawAssignee || hasDeadline || hasActionVerb || msg.mentionsMe) {
              const cleanTask = this.cleanTaskDescription(taskContent, assignee);
              const priority = this.calculateTaskPriority(msg, assignee, deadline);
              actionItems.push({
                id: `act_${msg.id}`,
                messageId: msg.id,
                author: msg.author,
                assignee: assignee.name,
                isAssignedToMe: assignee.isMe,
                task: `Please ${cleanTask}`,
                priority: priority,
                deadline: deadline,
                time: msg.time,
                status: 'pending',
                completed: false,
                evidence: {
                  quote: msg.text,
                  author: msg.author,
                  time: msg.time,
                  reasoning: `Task request directed to @${assignee.name}. Priority: ${priority.toUpperCase()}.${deadline ? ` Due: ${deadline}` : ''}`
                },
                sourceMessage: msg
              });
              matched = true;
            }
          }
        }
      }

      // Pattern: "I'll do X" or "I will do X"
      if (!matched) {
        const commitMatch = msg.text.match(/(?:i\s*['’]ll|i\s+will)\s+([\w\s,.'"-]+)/i);
        if (commitMatch && (msg.priorityTier === 'critical' || msg.priorityTier === 'high')) {
          const taskContent = commitMatch[1].trim();
          if (taskContent.length > 8 && !taskContent.startsWith('be') && !taskContent.startsWith('see')) {
            const deadline = this.extractDeadline(msg.text);
            const isMe = msg.author.toLowerCase().includes(personaLower);
            const priority = this.calculateTaskPriority(msg, { name: msg.author, isMe: isMe }, deadline);
            actionItems.push({
              id: `act_${msg.id}`,
              messageId: msg.id,
              author: msg.author,
              assignee: msg.author,
              isAssignedToMe: isMe,
              task: `Will ${taskContent.split('.')[0]}`,
              priority: priority,
              deadline: deadline,
              time: msg.time,
              status: 'pending',
              completed: false,
              evidence: {
                quote: msg.text,
                author: msg.author,
                time: msg.time,
                reasoning: `Self-commitment made by ${msg.author}. Priority: ${priority.toUpperCase()}.${deadline ? ` Due: ${deadline}` : ''}`
              },
              sourceMessage: msg
            });
          }
        }
      }
    });

    return actionItems;
  }

  calculateTaskPriority(msg, assignee, deadline) {
    const dLower = (deadline || '').toLowerCase();
    const isUrgentDeadline = dLower.includes('asap') || dLower.includes('today') || dLower.includes('pm') || dLower.includes('now') || dLower.includes('immediately');
    if (msg.priorityTier === 'critical' || (assignee.isMe && isUrgentDeadline)) {
      return 'critical';
    }
    if (msg.priorityTier === 'high' || isUrgentDeadline || assignee.isMe) {
      return 'high';
    }
    if (deadline) {
      return 'medium';
    }
    return msg.priorityTier === 'low' ? 'low' : 'medium';
  }

  /**
   * Extract team decisions
   */
  extractDecisions(analyzedMessages) {
    const decisions = [];

    analyzedMessages.forEach(msg => {
      for (const pattern of this.decisionPatterns) {
        const match = msg.text.match(pattern);
        if (match) {
          let decisionText = match[1] || match[0];
          // Clean trailing periods or exclamation points
          decisionText = decisionText.trim().replace(/[.!\s]+$/, '');
          // Capitalize first letter
          decisionText = decisionText.charAt(0).toUpperCase() + decisionText.slice(1);

          decisions.push({
            id: `dec_${msg.id}`,
            messageId: msg.id,
            author: msg.author,
            time: msg.time,
            decision: decisionText,
            rawText: msg.text,
            sourceMessage: msg
          });
          break;
        }
      }
    });

    return decisions;
  }

  /**
   * Extract mentions and direct queries for the persona
   */
  extractMentionsAndQuestions(analyzedMessages, personaLower) {
    return analyzedMessages
      .filter(m => m.mentionsMe || m.isQuestionForMe)
      .map(m => {
        let type = 'mention';
        if (m.isQuestionForMe) type = 'question';
        else if (m.hasCriticalKeyword) type = 'urgent_mention';

        return {
          id: `mq_${m.id}`,
          messageId: m.id,
          author: m.author,
          time: m.time,
          text: m.text,
          type: type,
          needsReply: m.isQuestionForMe || m.hasUrgentKeyword,
          sourceMessage: m
        };
      });
  }

  /**
   * Topic clustering based on keywords and temporal flow
   */
  clusterTopics(analyzedMessages) {
    if (!analyzedMessages.length) return [];

    // Simple, efficient centroid topic grouping for local device
    const clusters = [];
    const windowSize = Math.max(3, Math.ceil(analyzedMessages.length / 3));

    for (let i = 0; i < analyzedMessages.length; i += windowSize) {
      const chunk = analyzedMessages.slice(i, i + windowSize);
      if (chunk.length === 0) continue;

      const criticalInChunk = chunk.filter(m => m.priorityTier === 'critical');
      const decisionsInChunk = chunk.filter(m => m.isDecision);
      const startTime = chunk[0].time;
      const endTime = chunk[chunk.length - 1].time;

      // Extract highest scoring message as topic representative
      const sortedByScore = [...chunk].sort((a, b) => b.score - a.score);
      const headlineMsg = sortedByScore[0];

      let topicTitle = "Team Discussion & Updates";
      if (criticalInChunk.length > 0) {
        topicTitle = `Critical Incident & Mitigation (${criticalInChunk[0].flags.find(f => f.startsWith('critical_'))?.replace('critical_', '').toUpperCase() || 'Alert'})`;
      } else if (decisionsInChunk.length > 0) {
        topicTitle = `Strategic Decision Alignment`;
      } else if (chunk.some(m => m.text.toLowerCase().includes('pr') || m.text.toLowerCase().includes('code'))) {
        topicTitle = `Code Review & Deployment Coordination`;
      } else if (chunk.some(m => m.text.toLowerCase().includes('launch') || m.text.toLowerCase().includes('marketing'))) {
        topicTitle = `Launch Preparation & Marketing Sync`;
      }

      clusters.push({
        id: `topic_${i}`,
        title: topicTitle,
        timeRange: `${startTime} - ${endTime}`,
        messageCount: chunk.length,
        headline: headlineMsg.text,
        headlineAuthor: headlineMsg.author,
        messages: chunk
      });
    }

    return clusters;
  }

  /**
   * Generate 30-Second Executive TL;DR Digest
   */
  generateExecutiveDigest(messages, actionItems, decisions, mentionsAndQuestions, changedPlans, announcements, currentPersona) {
    const criticalMessages = [...messages]
      .filter(m => m.priorityTier === 'critical')
      .sort((a, b) => b.score - a.score);
    const actionsForMe = actionItems.filter(a => a.isAssignedToMe);
    const questionsForMe = mentionsAndQuestions.filter(q => q.needsReply);

    let situationStatus = "Normal operations. Team is discussing ongoing initiatives.";
    let statusBadge = "normal";

    if (criticalMessages.length > 0) {
      situationStatus = `🚨 Active or resolved critical events detected (${criticalMessages.length} urgent alerts). Focus on rollbacks, stability, and blockers.`;
      statusBadge = "critical";
    } else if (changedPlans && changedPlans.length > 0) {
      situationStatus = `Schedule or venue changes detected (${changedPlans.length} updated plans). Review new timelines.`;
      statusBadge = "decision";
    } else if (decisions.length > 0) {
      situationStatus = `Key decisions finalized across ${decisions.length} core items. Alignment reached on roadmap.`;
      statusBadge = "decision";
    }

    // Build concise bullets
    const bullets = [];
    const usedMessageIds = new Set();

    // 1. Immediate blockers / Critical alerts
    if (criticalMessages.length > 0) {
      const topCritical = criticalMessages.find(m => !m.mentionsMe) || criticalMessages[0];
      bullets.push({
        type: 'critical',
        text: `Urgent Event: ${topCritical.author}: "${this.truncate(topCritical.text, 90)}"`,
        targetId: topCritical.id
      });
      usedMessageIds.add(topCritical.id);
    }

    // 2. Urgent items for you
    const availableQuestions = questionsForMe.filter(q => !usedMessageIds.has(q.messageId));
    if (availableQuestions.length > 0) {
      const topQ = availableQuestions[0];
      bullets.push({
        type: 'question',
        text: `Waiting on you: ${topQ.author} asked: "${this.truncate(topQ.text, 80)}"`,
        targetId: topQ.messageId
      });
      usedMessageIds.add(topQ.messageId);
    }

    // 3. Changed Plans / Updated announcements
    if (changedPlans && changedPlans.length > 0) {
      const topPlan = changedPlans[0];
      bullets.push({
        type: 'plan_change',
        text: `Changed Plan: ${topPlan.summary}`,
        targetId: topPlan.messageId
      });
      usedMessageIds.add(topPlan.messageId);
    }

    // 4. Action items assigned to you
    const availableActions = actionsForMe.filter(a => !usedMessageIds.has(a.messageId));
    if (availableActions.length > 0) {
      const topAction = availableActions[0];
      const deadlineSuffix = topAction.deadline ? ` (Due: ${topAction.deadline})` : '';
      bullets.push({
        type: 'action',
        text: `Your Task: ${topAction.task}${deadlineSuffix}`,
        targetId: topAction.messageId
      });
      usedMessageIds.add(topAction.messageId);
    } else if (actionsForMe.length > 0) {
      const topAction = actionsForMe[0];
      const deadlineSuffix = topAction.deadline ? ` (Due: ${topAction.deadline})` : '';
      bullets.push({
        type: 'action',
        text: `Your Task: ${topAction.task}${deadlineSuffix}`,
        targetId: topAction.messageId
      });
    }

    // 5. Team Decision
    if (decisions.length > 0) {
      const topDec = decisions[0];
      bullets.push({
        type: 'decision',
        text: `Key Decision: ${topDec.decision} (${topDec.author})`,
        targetId: topDec.messageId
      });
    }

    // Fallback if low activity
    if (bullets.length === 0 && messages.length > 0) {
      bullets.push({
        type: 'info',
        text: `Catch-up: ${messages.length} messages reviewed. No urgent blockers or direct mentions for @${currentPersona}.`,
        targetId: messages[0].id
      });
    }

    return {
      situationStatus,
      statusBadge,
      bullets,
      summaryParagraph: this.synthesizeSummaryParagraph(messages, decisions, actionItems, currentPersona)
    };
  }

  extractChangedPlans(analyzedMessages) {
    const changedPlans = [];

    analyzedMessages.forEach(msg => {
      const text = msg.text;
      const textLower = text.toLowerCase();
      const isTentative = this.tentativeKeywords.some(kw => textLower.includes(kw));

      // 1. Explicit Update or Correction
      const updateMatch = text.match(/(?:update|correction):\s*(.+)/i);
      if (updateMatch) {
        const details = updateMatch[1].trim();
        const shiftMatch = details.match(/(?:rescheduled|moved|extended|shifted|changed)\s+(?:from\s+([^,]+?)\s+)?to\s+([^,.]+)/i);

        let originalPlan = "Previous plan";
        let updatedPlan = details;
        let changeType = "update";

        if (shiftMatch) {
          if (shiftMatch[1]) originalPlan = shiftMatch[1].trim();
          updatedPlan = shiftMatch[2].trim();
          changeType = "schedule";
        }

        if (details.toLowerCase().includes('venue') || details.toLowerCase().includes('room') || details.toLowerCase().includes('meet') || details.toLowerCase().includes('zoom')) {
          changeType = "venue";
        }

        changedPlans.push({
          id: `cp_${msg.id}`,
          messageId: msg.id,
          author: msg.author,
          time: msg.time,
          changeType: changeType,
          summary: details,
          originalPlan: originalPlan,
          updatedPlan: updatedPlan,
          isTentative: isTentative,
          confidence: isTentative ? 0.65 : 0.95,
          verificationStatus: isTentative ? "Needs Verification (Tentative language detected)" : "Verified Announcement",
          evidence: {
            quote: text,
            author: msg.author,
            time: msg.time,
            reasoning: `Detected plan modification with explicit update prefix. Confirmed change from previous schedule/venue.`
          },
          sourceMessage: msg
        });
        return;
      }

      // 2. Pattern: "rescheduled from X to Y"
      const shiftMatch = text.match(/(?:meeting|sync|freeze|release|deadline|call|event|embargo|launch)?\s*(?:rescheduled|moved|pushed back|delayed|shifted|extended)\s+(?:from\s+([^,]+?)\s+)?to\s+([^,.]+)/i);
      if (shiftMatch) {
        const original = shiftMatch[1] ? shiftMatch[1].trim() : "Previous plan";
        const updated = shiftMatch[2].trim();
        changedPlans.push({
          id: `cp_${msg.id}`,
          messageId: msg.id,
          author: msg.author,
          time: msg.time,
          changeType: "schedule",
          summary: text,
          originalPlan: original,
          updatedPlan: updated,
          isTentative: isTentative,
          confidence: isTentative ? 0.60 : 0.90,
          verificationStatus: isTentative ? "Needs Verification" : "Verified Schedule Update",
          evidence: {
            quote: text,
            author: msg.author,
            time: msg.time,
            reasoning: `Detected schedule change verb ('rescheduled' / 'moved' / 'extended') indicating updated timeline.`
          },
          sourceMessage: msg
        });
      }
    });

    return changedPlans;
  }

  extractAnnouncements(analyzedMessages) {
    const announcements = [];
    analyzedMessages.forEach(msg => {
      for (const pattern of this.announcementPatterns) {
        const m = msg.text.match(pattern);
        if (m) {
          const textClean = (m[1] || msg.text).trim();
          announcements.push({
            id: `ann_${msg.id}`,
            messageId: msg.id,
            author: msg.author,
            time: msg.time,
            announcement: textClean,
            evidence: {
              quote: msg.text,
              author: msg.author,
              time: msg.time,
              reasoning: `Official team broadcast / announcement pattern identified.`
            },
            sourceMessage: msg
          });
          break;
        }
      }
    });
    return announcements;
  }

  extractDeadlinesRadar(analyzedMessages, actionItems, personaLower) {
    const radar = [];
    const seen = new Set();

    actionItems.filter(a => a.deadline).forEach(a => {
      const key = `${a.task}_${a.deadline}`;
      if (!seen.has(key)) {
        seen.add(key);
        const isMe = a.isAssignedToMe;
        const dLower = a.deadline.toLowerCase();
        const isUrgent = isMe || dLower.includes('asap') || dLower.includes('today') || dLower.includes('pm');

        let reason = "Standard timeline milestone";
        if (isMe && (dLower.includes('pm') || dLower.includes('today'))) {
          reason = "Urgent: Direct task for you due today with specific hour cutoff";
        } else if (isMe) {
          reason = "Action item assigned directly to you";
        } else if (dLower.includes('asap')) {
          reason = "Critical: ASAP timeline requires immediate resolution";
        }

        radar.push({
          id: `dl_${a.id}`,
          messageId: a.messageId,
          task: a.task,
          assignee: a.assignee,
          isForMe: isMe,
          deadline: a.deadline,
          time: a.time,
          urgencyReason: reason,
          priority: isUrgent ? (isMe ? 'critical' : 'high') : 'medium',
          author: a.author,
          evidence: {
            quote: a.sourceMessage ? a.sourceMessage.text : a.task,
            author: a.author,
            time: a.time,
            reasoning: `Extracted explicit deadline constraint '${a.deadline}'. ${reason}.`
          },
          sourceMessage: a.sourceMessage
        });
      }
    });

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    radar.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));
    return radar;
  }

  synthesizeSummaryParagraph(messages, decisions, actionItems, persona) {
    if (!messages.length) return "No unread messages.";
    
    let text = `In this conversation across ${messages.length} messages, `;
    
    const hasOutage = messages.some(m => m.flags.some(f => f.includes('outage') || f.includes('rollback') || f.includes('502')));
    if (hasOutage) {
      text += `the team resolved an urgent production incident involving service health and traffic mitigation. `;
    } else {
      text += `the team coordinated on sprint milestones, deliverables, and architecture. `;
    }

    if (decisions.length > 0) {
      text += `${decisions.length} official team decision${decisions.length > 1 ? 's were' : ' was'} established. `;
    }

    if (actionItems.length > 0) {
      text += `A total of ${actionItems.length} action item${actionItems.length > 1 ? 's were' : ' was'} assigned, with ${actionItems.filter(a => a.isAssignedToMe).length} assigned directly to you (@${persona}).`;
    }

    return text;
  }

  /**
   * Extract critical updates and urgent alerts the user missed while away
   */
  extractCriticalUpdatesMissed(analyzedMessages, personaLower) {
    return analyzedMessages
      .filter(m => (m.priorityTier === 'critical' || m.flags.some(f => f.startsWith('critical_') || f.includes('rollback') || f.includes('outage') || f.includes('sev1') || f.includes('p0'))) && !m.isFromMe)
      .map(m => {
        let title = "Critical Incident Alert";
        if (m.text.toLowerCase().includes('rollback')) title = "Production Rollback Alert";
        else if (m.text.toLowerCase().includes('database') || m.text.toLowerCase().includes('502')) title = "Service Health Outage";
        else if (m.mentionsMe) title = "Urgent Request For You";

        return {
          id: `crit_${m.id}`,
          messageId: m.id,
          author: m.author,
          time: m.time,
          title: title,
          text: m.text,
          priority: m.priorityTier || 'critical',
          score: m.score,
          isRelevantToMe: m.isRelevantToMe,
          flags: m.flags,
          evidence: {
            quote: m.text,
            author: m.author,
            time: m.time,
            reasoning: `Critical severity update triggered while you were away. Requires immediate awareness.`
          },
          sourceMessage: m
        };
      });
  }

  /**
   * Extract chronological timeline of important conversation milestones
   */
  extractChronologicalTimeline(analyzedMessages, actionItems, decisions, changedPlans, deadlinesRadar) {
    const events = [];
    const seenMsgIds = new Set();

    // 1. Critical alerts & incident triggers
    analyzedMessages.forEach((msg, idx) => {
      if (msg.priorityTier === 'critical' || msg.hasCriticalKeyword) {
        if (!seenMsgIds.has(msg.id)) {
          seenMsgIds.add(msg.id);
          events.push({
            id: `tl_crit_${msg.id}`,
            messageId: msg.id,
            order: idx,
            time: msg.time,
            author: msg.author,
            type: 'critical',
            badge: '🚨 Critical Blocker',
            title: `Alert from ${msg.author}`,
            description: msg.text,
            sourceMessage: msg
          });
        }
      }
    });

    // 2. Decisions made
    decisions.forEach(dec => {
      const rawIdx = analyzedMessages.findIndex(m => m.id === dec.messageId);
      events.push({
        id: `tl_dec_${dec.id}`,
        messageId: dec.messageId,
        order: rawIdx !== -1 ? rawIdx : 999,
        time: dec.time,
        author: dec.author,
        type: 'decision',
        badge: '⚖️ Team Decision',
        title: `Decision: ${dec.decision}`,
        description: dec.rawText,
        sourceMessage: dec.sourceMessage || analyzedMessages[rawIdx]
      });
    });

    // 3. Changed plans
    changedPlans.forEach(plan => {
      const rawIdx = analyzedMessages.findIndex(m => m.id === plan.messageId);
      events.push({
        id: `tl_plan_${plan.id}`,
        messageId: plan.messageId,
        order: rawIdx !== -1 ? rawIdx : 999,
        time: plan.time,
        author: plan.author,
        type: 'plan_change',
        badge: plan.isTentative ? '⚠️ Tentative Change' : '🔄 Plan Changed',
        title: `Plan Shift (${plan.changeType})`,
        description: `${plan.summary} (Before: ${plan.originalPlan} ➔ Updated: ${plan.updatedPlan})`,
        sourceMessage: plan.sourceMessage || analyzedMessages[rawIdx]
      });
    });

    // 4. Action items assigned
    actionItems.forEach(act => {
      const rawIdx = analyzedMessages.findIndex(m => m.id === act.messageId);
      events.push({
        id: `tl_act_${act.id}`,
        messageId: act.messageId,
        order: rawIdx !== -1 ? rawIdx : 999,
        time: act.time,
        author: act.author,
        type: 'action',
        badge: act.isAssignedToMe ? '👉 Task For You' : '📋 Task Assigned',
        title: `Task for @${act.assignee} (${act.priority.toUpperCase()})`,
        description: `${act.task}${act.deadline ? ` (Due: ${act.deadline})` : ''}`,
        sourceMessage: act.sourceMessage || analyzedMessages[rawIdx]
      });
    });

    // Sort strictly by original message chronological order
    events.sort((a, b) => a.order - b.order);
    return events;
  }

  // --- Helper methods ---

  extractAssignee(text, author, personaLower) {
    if (!text) return { name: 'Unassigned', isMe: false };
    const mentionMatch = text.match(/@([\w]+)/i);
    let name = mentionMatch ? mentionMatch[1] : text.replace(/[@,:]/g, '').trim();
    if (name.length > 0 && name.length < 30) {
      const isMe = name.toLowerCase().includes(personaLower) || personaLower.includes(name.toLowerCase());
      return {
        name: name,
        isMe: isMe
      };
    }
    return {
      name: 'Unassigned',
      isMe: false
    };
  }

  extractDeadline(text) {
    for (const pattern of this.deadlinePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    return null;
  }

  cleanTaskDescription(text, assignee) {
    let clean = text
      .replace(new RegExp(`@?${assignee.name}[,:]?`, 'gi'), '')
      .replace(/(?:by|before|until|due)\s+[\w\s:]+$/i, '')
      .trim();
    if (clean.length > 120) {
      clean = clean.substring(0, 117) + '...';
    }
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  truncate(str, length) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length - 3) + '...' : str;
  }

  /**
   * Multi-format chat text parser
   * Accepts raw text from Slack, Discord, WhatsApp, or standard logs
   */
  parseRawText(rawText) {
    if (!rawText || !rawText.trim()) return [];

    // Try parsing as JSON first
    try {
      const parsedJson = JSON.parse(rawText);
      if (Array.isArray(parsedJson)) {
        return parsedJson.map((item, idx) => ({
          id: item.id || `custom_${idx}`,
          author: item.user || item.author || item.sender || 'Participant',
          time: item.timestamp || item.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: item.text || item.message || item.body || ''
        }));
      } else if (parsedJson.messages && Array.isArray(parsedJson.messages)) {
        return parsedJson.messages.map((item, idx) => ({
          id: item.id || `custom_${idx}`,
          author: item.user || item.author || item.sender || 'Participant',
          time: item.timestamp || item.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: item.text || item.message || item.body || ''
        }));
      }
    } catch (e) {
      // Not JSON, continue with line-by-line regex parsing
    }

    const lines = rawText.split('\n').filter(l => l.trim().length > 0);
    const messages = [];

    // Formats supported:
    // 1. [10:15 AM] Alex: Hello world
    // 2. [12/04/24, 10:15:30] Alex: Hello world
    // 3. 12/04/2024, 10:15 - Alex: Hello world
    // 4. Alex: Hello world
    // 5. Alex [10:15 AM]: Hello world

    const formatRegexes = [
      /^\[([\d/,\s:]+(?:am|pm)?)\]\s*([^:]+):\s*(.+)$/i,
      /^([\d/,\s:]+(?:am|pm)?)\s*-\s*([^:]+):\s*(.+)$/i,
      /^([^:]+)\s*\[([\d/,\s:]+(?:am|pm)?)\]:\s*(.+)$/i,
      /^([A-Za-z0-9_.\s]+):\s*(.+)$/i
    ];

    let currentMsg = null;

    lines.forEach((line, idx) => {
      line = line.trim();
      let matched = false;

      // Try format 1 & 2
      let m = line.match(/^\[([^\]]+)\]\s*([^:]+):\s*(.+)$/);
      if (m) {
        currentMsg = {
          id: `custom_${idx}`,
          time: m[1].trim(),
          author: m[2].trim(),
          text: m[3].trim()
        };
        messages.push(currentMsg);
        matched = true;
      }

      // Try format: 12/04/24, 10:15 - Name: text
      if (!matched) {
        m = line.match(/^([\d/,\s:]+(?:[ap]m)?)\s*-\s*([^:]+):\s*(.+)$/i);
        if (m) {
          currentMsg = {
            id: `custom_${idx}`,
            time: m[1].trim(),
            author: m[2].trim(),
            text: m[3].trim()
          };
          messages.push(currentMsg);
          matched = true;
        }
      }

      // Try format: Name: text
      if (!matched) {
        m = line.match(/^([A-Za-z0-9_.\s@]{2,25}):\s*(.+)$/);
        if (m && !m[1].includes('http')) {
          currentMsg = {
            id: `custom_${idx}`,
            time: `${10 + Math.floor(idx / 3)}:${(idx * 7) % 60 < 10 ? '0' : ''}${(idx * 7) % 60} AM`,
            author: m[1].trim(),
            text: m[2].trim()
          };
          messages.push(currentMsg);
          matched = true;
        }
      }

      // If multiline continuation of previous message
      if (!matched && currentMsg) {
        currentMsg.text += ` ${line}`;
      }
    });

    return messages;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LocalChatIntelligenceEngine };
}
