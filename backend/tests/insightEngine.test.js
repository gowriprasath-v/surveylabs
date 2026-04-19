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

    // Test B: rating question with average 4.5 → insight with 'positive'
    const mockSurveyB = {
      questions: [{ id: 'q2', type: 'rating', label: 'Service Quality' }]
    };
    const responsesB = [
      { answers: [{ question_id: 'q2', answer_value: '5' }] },
      { answers: [{ question_id: 'q2', answer_value: '4' }] },
      { answers: [{ question_id: 'q2', answer_value: '5' }] },
    ];
    const resultB = generateInsights(mockSurveyB, responsesB);
    const hasPositive = resultB.some(i => i.type === 'rating' && i.text.toLowerCase().includes('positive'));
    assert.ok(hasPositive, "Test B Failed: Rating 4.7 should generate insight containing 'positive'");

    // Test C: null or empty results → returns empty array, does NOT throw
    // 1. null survey data
    const resultC1 = generateInsights(null, []);
    assert.deepStrictEqual(resultC1, [], "Test C Failed: null surveyData should return empty array");
    
    // 2. empty questions array with 1 response → empty (no questions to analyse)
    const resultC2 = generateInsights({ questions: [] }, [{ answers: [] }]);
    assert.deepStrictEqual(resultC2, [], "Test C Failed: empty questions should return empty array");
    
    // 3. no responses → returns empty array
    const mockSurveyC3 = {
      questions: [{ id: 'q3', type: 'text_short', label: 'Empty' }]
    };
    const resultC3 = generateInsights(mockSurveyC3, []);
    assert.deepStrictEqual(resultC3, [], "Test C Failed: empty responses should return empty array");

    // 4. < 3 responses with questions → returns confidence warning, not empty
    const resultC4 = generateInsights(
      { questions: [{ id: 'q4', type: 'mcq', label: 'Pick', options: ['A'] }] },
      [{ answers: [{ question_id: 'q4', answer_value: 'A' }] }]
    );
    assert.ok(resultC4.some(i => i.type === 'confidence'), "Test C Failed: < 3 responses should return confidence warning");

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
