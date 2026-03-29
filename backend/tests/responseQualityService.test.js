const assert = require('assert');
const { scoreResponse } = require('../src/services/responseQualityService.js');

// Mock data
const mockQuestions = [
  { id: 'q1', type: 'mcq', label: 'Color' },
  { id: 'q2', type: 'mcq', label: 'Animal' },
  { id: 'q3', type: 'mcq', label: 'Fruit' },
  { id: 'q4', type: 'text_short', label: 'Feedback' },
  { id: 'q5', type: 'text_short', label: 'More Feedback' }
];

console.log('Running responseQualityService tests...');

// Test A: completionTimeMs = 3000 (under 8s) → quality must be 'suspect' or 'spam'
const testA_ans = [{ question_id: 'q1', answer_value: 'Blue' }];
const testA_result = scoreResponse(testA_ans, 3000, mockQuestions);
assert.ok(testA_result.quality === 'suspect' || testA_result.quality === 'spam', 'Test A Failed: Fast submit (3000ms) should be suspect or spam');

// Test B: all same MCQ answers across 3+ questions → flags must include 'straight_line'
const testB_ans = [
  { question_id: 'q1', answer_value: 'Option A' },
  { question_id: 'q2', answer_value: 'Option A' },
  { question_id: 'q3', answer_value: 'Option A' }
];
const testB_result = scoreResponse(testB_ans, 15000, mockQuestions);
assert.ok(testB_result.flags.some(f => f.type === 'straight_line'), 'Test B Failed: Straight-lining MCQ should flag "straight_line"');

// Test C: completionTimeMs = 20000, varied answers, real text → quality must be 'good', score >= 70
const testC_ans = [
  { question_id: 'q1', answer_value: 'Blue' },
  { question_id: 'q2', answer_value: 'Dog' },
  { question_id: 'q3', answer_value: 'Apple' },
  { question_id: 'q4', answer_value: 'I really enjoyed using this platform. The interface is clean.' }
];
const testC_result = scoreResponse(testC_ans, 20000, mockQuestions);
assert.strictEqual(testC_result.quality, 'good', "Test C Failed: High quality response should be 'good'");
assert.ok(testC_result.score >= 70, "Test C Failed: Score should be >= 70");

// Test D: text answer "asdfgh" (no vowels) → flags must include 'gibberish'
const testD_ans = [
  { question_id: 'q4', answer_value: 'asdfgh' }
];
const testD_result = scoreResponse(testD_ans, 30000, mockQuestions);
assert.ok(testD_result.flags.some(f => f.type === 'gibberish'), 'Test D Failed: "asdfgh" should flag "gibberish"');

// Test E: 80% answers skipped (empty strings) → flags must include 'mostly_skipped'
const testE_ans = [
  { question_id: 'q1', answer_value: '' },
  { question_id: 'q2', answer_value: '' },
  { question_id: 'q3', answer_value: '' },
  { question_id: 'q4', answer_value: '' },
  { question_id: 'q5', answer_value: 'Valid answer here' }
];
// 4 out of 5 skipped = 80%.
const testE_result = scoreResponse(testE_ans, 45000, mockQuestions);
assert.ok(testE_result.flags.some(f => f.type === 'mostly_skipped'), 'Test E Failed: 80% skipped should flag "mostly_skipped"');

console.log('✓ All responseQualityService tests passed!');
