const assert = require('assert');
const path = require('path');

// Wrap in async IIFE to use dynamic import for frontend ES module
(async () => {
  try {
    const modulePath = path.resolve(__dirname, '../../frontend/src/utils/insightEngine.js');
    console.log('Running insightEngine tests...');
    
    // Dynamic import to handle ES module
    const { generateInsights } = await import(`file://${modulePath}`);

    // Test A: MCQ question where one option has > 60% share → insight type 'consensus'
    const mockSurveyA = {
      questions: [
        { id: 'q1', type: 'mcq', label: 'Favorite Color', options: ['Red', 'Blue', 'Green'] }
      ]
    };
    const responsesA = [
      { answers: [{ question_id: 'q1', answer_value: 'Red' }] },
      { answers: [{ question_id: 'q1', answer_value: 'Red' }] },
      { answers: [{ question_id: 'q1', answer_value: 'Red' }] },
      { answers: [{ question_id: 'q1', answer_value: 'Red' }] },
      { answers: [{ question_id: 'q1', answer_value: 'Red' }] },
      { answers: [{ question_id: 'q1', answer_value: 'Red' }] },
      { answers: [{ question_id: 'q1', answer_value: 'Red' }] },
      { answers: [{ question_id: 'q1', answer_value: 'Red' }] },
      { answers: [{ question_id: 'q1', answer_value: 'Blue' }] },
      { answers: [{ question_id: 'q1', answer_value: 'Green' }] },
    ];
    const resultA = generateInsights(mockSurveyA, responsesA);
    assert.ok(resultA.some(i => i.type === 'consensus'), "Test A Failed: Should generate 'consensus' insight");

    // Test B: rating question with average 4.5 → insight with 'Positive'
    const mockSurveyB = {
      questions: [{ id: 'q2', type: 'rating', label: 'Service Quality' }]
    };
    const responsesB = [
      { answers: [{ question_id: 'q2', answer_value: '5' }] },
      { answers: [{ question_id: 'q2', answer_value: '4' }] }
    ];
    const resultB = generateInsights(mockSurveyB, responsesB);
    const hasPositive = resultB.some(i => i.type === 'rating' && i.text.includes('Positive'));
    assert.ok(hasPositive, "Test B Failed: Rating 4.5 should generate insight containing 'Positive'");

    // Test C: null or empty results → returns empty array, does NOT throw
    // 1. null survey data
    const resultC1 = generateInsights(null, []);
    assert.deepStrictEqual(resultC1, [], "Test C Failed: null surveyData should return empty array");
    
    // 2. empty questions
    const resultC2 = generateInsights({ questions: [] }, [{ answers: [] }]);
    assert.deepStrictEqual(resultC2, [], "Test C Failed: empty questions should return empty array");
    
    // 3. no responses
    const mockSurveyC3 = {
      questions: [{ id: 'q3', type: 'text_short', label: 'Empty' }]
    };
    const resultC3 = generateInsights(mockSurveyC3, []);
    assert.deepStrictEqual(resultC3, [], "Test C Failed: empty responses should return empty array");

    // Test D: text answers with repeated words → insight type 'keywords' generated
    const mockSurveyD = {
      questions: [{ id: 'q5', type: 'text_short', label: 'Feedback' }]
    };
    const responsesD = [
      { answers: [{ question_id: 'q5', answer_value: 'The speed is great but UI is slow' }] },
      { answers: [{ question_id: 'q5', answer_value: 'great speed and amazing dashboard' }] },
      { answers: [{ question_id: 'q5', answer_value: 'dashboard and speed could be better' }] },
      { answers: [{ question_id: 'q5', answer_value: 'dashboard is perfect' }] },
      { answers: [{ question_id: 'q5', answer_value: 'love the dashboard' }] },
    ];
    const resultD = generateInsights(mockSurveyD, responsesD);
    assert.ok(resultD.some(i => i.type === 'keywords'), "Test D Failed: repeated words should generate 'keywords' insight");

    console.log('✓ All insightEngine tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
})();
