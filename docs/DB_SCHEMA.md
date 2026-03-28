# SurveyLabs — Database Schema

## Tables

### users
| Column       | Type    | Constraints              |
|-------------|---------|--------------------------|
| id          | TEXT    | PRIMARY KEY (UUID)       |
| username    | TEXT    | UNIQUE, NOT NULL         |
| password    | TEXT    | NOT NULL (bcrypt hash)   |
| created_at  | TEXT    | DEFAULT datetime('now')  |

### surveys
| Column       | Type    | Constraints              |
|-------------|---------|--------------------------|
| id          | TEXT    | PRIMARY KEY (UUID)       |
| user_id     | TEXT    | FK → users.id            |
| title       | TEXT    | NOT NULL                 |
| description | TEXT    |                          |
| status      | TEXT    | DEFAULT 'active'         |
| mode        | TEXT    | DEFAULT 'standard'       |
| created_at  | TEXT    | DEFAULT datetime('now')  |
| updated_at  | TEXT    | DEFAULT datetime('now')  |

### questions
| Column       | Type    | Constraints              |
|-------------|---------|--------------------------|
| id          | TEXT    | PRIMARY KEY (UUID)       |
| survey_id   | TEXT    | FK → surveys.id          |
| text        | TEXT    | NOT NULL                 |
| type        | TEXT    | NOT NULL (mcq/rating/text)|
| options     | TEXT    | JSON array for MCQ       |
| required    | INTEGER | DEFAULT 1 (boolean)      |
| order_index | INTEGER | NOT NULL                 |
| logic_rules | TEXT    | JSON conditional rules   |

### responses
| Column            | Type    | Constraints              |
|------------------|---------|--------------------------|
| id               | TEXT    | PRIMARY KEY (UUID)       |
| survey_id        | TEXT    | FK → surveys.id          |
| submitted_at     | TEXT    | DEFAULT datetime('now')  |
| quality_score    | INTEGER | DEFAULT 100              |
| quality_flags    | TEXT    | JSON array               |
| quality_label    | TEXT    | DEFAULT 'good'           |
| completion_time_ms | INTEGER |                        |

### answers
| Column       | Type    | Constraints              |
|-------------|---------|--------------------------|
| id          | TEXT    | PRIMARY KEY (UUID)       |
| response_id | TEXT    | FK → responses.id        |
| question_id | TEXT    | FK → questions.id        |
| answer_value| TEXT    |                          |

## Relationships
- users 1—∞ surveys
- surveys 1—∞ questions
- surveys 1—∞ responses
- responses 1—∞ answers
- questions 1—∞ answers

## ER Diagram
[See docs/diagrams/er-diagram.html]
