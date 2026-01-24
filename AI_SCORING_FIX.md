# AI Scoring Issue - Root Cause Analysis and Fix

## Problem Summary
Reports were receiving artificially low scores despite having good individual criterion scores. The AI was evaluating reports correctly, but the overall score calculation was flawed.

## Root Causes Identified

### Issue #1: Missing Context in AI Evaluation
**Location:** `pages/SubmitReportPage.tsx` (line 133)

**Problem:**
The `evaluateReport()` function was being called with only 2 out of 5 possible parameters:
```typescript
// OLD CODE - Missing critical context
const evaluation = await evaluateReport(plainText, goalToEvaluate.criteria);
```

**Impact:**
- ❌ Goal instructions were NOT passed to the AI
- ❌ Project knowledge base (aiContext) was NOT passed to the AI
- ❌ Organizational metrics were NOT passed to the AI

This meant the AI was evaluating reports in a vacuum, without:
- Specific goal context and instructions
- Project-specific terminology and priorities
- Organizational performance metrics

**Fix:**
```typescript
// NEW CODE - Full context provided
const projectKnowledgeBase = selectedProject?.aiContext;
const organizationMetrics = settings?.selectedMetrics;

const evaluation = await evaluateReport(
  plainText, 
  goalToEvaluate.criteria,
  goalToEvaluate.instructions,      // Goal-specific context
  projectKnowledgeBase,              // Project domain knowledge
  organizationMetrics                // Org-wide metrics
);
```

---

### Issue #2: Organizational Metrics Ignored in Score Calculation
**Location:** `pages/SubmitReportPage.tsx` (lines 145-152)

**Problem:**
The overall score calculation only considered goal criteria weights, completely ignoring organizational metric scores:

```typescript
// OLD CODE - Only goal criteria counted
const totalWeight = goalToEvaluate.criteria.reduce((sum, c) => sum + c.weight, 0);
const overallScore = evaluation.criteriaScores.reduce((weightedSum, scoreItem) => {
  const criterion = goalToEvaluate.criteria.find(c => c.name === scoreItem.criterionName);
  if (criterion) {
    return weightedSum + (scoreItem.score * (criterion.weight / totalWeight));
  }
  return weightedSum; // Organizational metrics were silently discarded here!
}, 0);
```

**Impact:**
- The AI would evaluate organizational metrics (e.g., "Communication", "Problem Solving")
- These scores were returned in `evaluation.criteriaScores`
- But they were **completely ignored** in the final score calculation
- Only goal-specific criteria were weighted and summed

**Fix:**
Implemented a 70/30 weighting system as per requirements:
- **70% of score** comes from goal criteria (weighted by their importance)
- **30% of score** comes from organizational metrics (averaged equally)

```typescript
// NEW CODE - Proper weighting of both criteria types
const goalCriteriaWeight = 0.7;
const orgMetricsWeight = 0.3;

// Separate goal criteria from organizational metrics
const goalCriteriaScores = evaluation.criteriaScores.filter(scoreItem =>
  goalToEvaluate.criteria.some(c => c.name === scoreItem.criterionName)
);

const orgMetricScores = evaluation.criteriaScores.filter(scoreItem =>
  !goalToEvaluate.criteria.some(c => c.name === scoreItem.criterionName)
);

// Calculate weighted average for goal criteria
const goalCriteriaScore = goalCriteriaScores.reduce((weightedSum, scoreItem) => {
  const criterion = goalToEvaluate.criteria.find(c => c.name === scoreItem.criterionName);
  if (criterion) {
    return weightedSum + (scoreItem.score * (criterion.weight / totalCriteriaWeight));
  }
  return weightedSum;
}, 0);

// Calculate simple average for organizational metrics
const orgMetricsScore = orgMetricScores.length > 0
  ? orgMetricScores.reduce((sum, scoreItem) => sum + scoreItem.score, 0) / orgMetricScores.length
  : 0;

// Combine with proper weighting
const overallScore = orgMetricScores.length > 0
  ? (goalCriteriaScore * goalCriteriaWeight) + (orgMetricsScore * orgMetricsWeight)
  : goalCriteriaScore; // Fallback to 100% goal criteria if no org metrics
```

---

## Expected Improvements

After these fixes, reports should receive more accurate scores because:

1. ✅ **Better AI Understanding**: The AI now has full context (goal instructions, project knowledge, org metrics)
2. ✅ **Holistic Scoring**: Both goal-specific criteria AND organizational metrics contribute to the final score
3. ✅ **Proper Weighting**: 70% goal-focused, 30% organization-focused (as per requirements)

## Testing Recommendations

1. Submit a new report with good content
2. Verify that:
   - Individual criterion scores are appropriate (1-10 scale)
   - Organizational metric scores appear in the evaluation
   - Overall score reflects both goal criteria (70%) and org metrics (30%)
   - The AI reasoning references the goal instructions and project context

## Example Score Calculation

**Before Fix:**
- Goal Criterion 1: 8/10 (weight: 50%) → contributes 4.0
- Goal Criterion 2: 7/10 (weight: 50%) → contributes 3.5
- Org Metric 1: 9/10 → **IGNORED**
- Org Metric 2: 8/10 → **IGNORED**
- **Final Score: 7.5/10** ❌ (Too low!)

**After Fix:**
- Goal Criterion 1: 8/10 (weight: 50%) → 4.0
- Goal Criterion 2: 7/10 (weight: 50%) → 3.5
- Goal Score: 7.5/10 × 70% = **5.25**
- Org Metric 1: 9/10
- Org Metric 2: 8/10
- Org Score: 8.5/10 × 30% = **2.55**
- **Final Score: 7.8/10** ✅ (More accurate!)

---

## Files Modified

1. **`pages/SubmitReportPage.tsx`**
   - Added goal instructions, knowledge base, and org metrics to AI evaluation call
   - Implemented 70/30 weighted scoring system
   - Separated goal criteria from organizational metrics in score calculation
