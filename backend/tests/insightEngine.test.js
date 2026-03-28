const assert = require('assert');
const path = require('path');

// Wrap in async IIFE to use dynamic import for frontend ES module
(async () => {
  try {
    const modulePath = path.resolve(__dirname, '../../frontend/src/utils/insightEngine.js');
    console.log('Running insightEngine tests...');
    
    // Dynamic import to handle ES module
    const { generateInsights } = await import(`file://${modulePath}`);

    // Test A: MCQ question where one option has 80% share → insight type 'majority' generated
    const mockSurveyA = {
      total_responses: 10,
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          label: 'Favorite Color',
          total_answers: 10,
          options: ['Red', 'Blue', 'Green'],
          results: { Red: 8, Blue: 1, Green: 1 } // Red is 80%
        }
      ]
    };
    const resultA = generateInsights(mockSurveyA);
    assert.ok(resultA.some(i => i.type === 'majority'), "Test A Failed: Should generate 'majority' insight");

    // Test B: rating question with average 4.5 → insight with 'excellent' in text generated
    const mockSurveyB = {
      total_responses: 10,
      questions: [
        {
          id: 'q2',
          type: 'rating',
          label: 'Service Quality',
          total_answers: 10,
          results: { average: 4.5, count: 10 }
        }
      ]
    };
    const resultB = generateInsights(mockSurveyB);
    const hasExcellent = resultB.some(i => i.type === 'rating' && i.text.toLowerCase().includes('excellent'));
    assert.ok(hasExcellent, "Test B Failed: Rating 4.5 should generate insight containing 'excellent'");

    // Test C: null or empty results → returns empty array, does NOT throw
    // 1. null survey data
    const resultC1 = generateInsights(null);
    assert.deepStrictEqual(resultC1, [], "Test C Failed: null surveyData should return empty array");
    
    // 2. empty questions
    const resultC2 = generateInsights({ total_responses: 0, questions: [] });
    assert.deepStrictEqual(resultC2, [], "Test C Failed: empty questions should return empty array");
    
    // 3. question with missing/empty results
    const mockSurveyC3 = {
      total_responses: 2,
      questions: [
        { id: 'q3', type: 'text_short', label: 'Empty', results: null },
        { id: 'q4', type: 'mcq', label: 'Empty MCQ', options: ['A','B'], results: {} }
      ]
    };
    const resultC3 = generateInsights(mockSurveyC3);
    assert.deepStrictEqual(resultC3, [], "Test C Failed: questions with null/empty results should return empty array");

    // Test D: text answers with repeated words → insight type 'keywords' generated
    const mockSurveyD = {
      total_responses: 5,
      questions: [
        {
          id: 'q5',
          type: 'text_short',
          label: 'Feedback',
          total_answers: 5,
          results: [
            'The speed is great but UI is slow',
            'great speed and amazing dashboard',
            'dashboard and speed could be better',
            'dashboard is perfect',
            'love the dashboard'
          ] // 'dashboard' and 'speed' are repeated
        }
      ]
    };
    const resultD = generateInsights(mockSurveyD);
    assert.ok(resultD.some(i => i.type === 'keywords'), "Test D Failed: repeated words should generate 'keywords' insight");

    console.log('✓ All insightEngine tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
})();
