# SurveyLabs — UI Wireframes & User Journey

## Color Palette
- Primary: #3D3FE8 (deep indigo)
- Background: #FAFAF8 (warm white)  
- Surface: #FFFFFF
- Text primary: #1A1916
- Text muted: #6B6A66
- Border: #E8E7E3
- Success: #1A7A4A
- Warning: #A05C00

## Font: DM Sans (Google Fonts)

## User Journey
Login → Dashboard → Create Survey → Add Questions + Logic → 
Share Link → Respondent takes survey → Admin views live results + insights

## Screen 1: Login Page
┌──────────────────────────────────────────────┐
│                                              │
│           ◆ SurveyLabs                       │
│                                              │
│    ┌────────────────────────────────────┐    │
│    │  Welcome back                      │    │
│    │  Sign in to your account           │    │
│    │                                    │    │
│    │  Username                          │    │
│    │  ┌──────────────────────────────┐  │    │
│    │  │                              │  │    │
│    │  └──────────────────────────────┘  │    │
│    │                                    │    │
│    │  Password                          │    │
│    │  ┌──────────────────────────────┐  │    │
│    │  │                              │  │    │
│    │  └──────────────────────────────┘  │    │
│    │                                    │    │
│    │  [        Sign in        ]         │    │
│    └────────────────────────────────────┘    │
│                                              │
└──────────────────────────────────────────────┘

## Screen 2: Dashboard
┌─────────┬────────────────────────────────────┐
│ ◆ Labs  │  My Surveys            [+ New]      │
│         │                                    │
│ Surveys │  ┌──────────────────────────────┐  │
│ Results │  │ Customer Feedback Q1         │  │
│         │  │ Active · 47 responses        │  │
│ [admin] │  │ [Results] [Share] [Edit]     │  │
│ Sign out│  └──────────────────────────────┘  │
│         │                                    │
│         │  ┌──────────────────────────────┐  │
│         │  │ Product Survey 2025          │  │
│         │  │ Active · 12 responses        │  │
│         │  │ [Results] [Share] [Edit]     │  │
│         │  └──────────────────────────────┘  │
└─────────┴────────────────────────────────────┘

## Screen 3: Create Survey / Question Builder
┌─────────┬────────────────────────────────────┐
│ ◆ Labs  │  New Survey                        │
│         │  ┌──────────────────────────────┐  │
│         │  │ Survey Title                 │  │
│         │  │ [                          ] │  │
│         │  │ Description (optional)       │  │
│         │  │ [                          ] │  │
│         │  │ Mode: [Standard] [Convo]     │  │
│         │  └──────────────────────────────┘  │
│         │                                    │
│         │  Questions                         │
│         │  ┌──────────────────────────────┐  │
│         │  │ Q1: [Question text...]       │  │
│         │  │ Type: [MCQ ▾]  [Required ✓] │  │
│         │  │ Options: ○ A  ○ B  [+ Add]  │  │
│         │  │ [Details] [Logic] [Delete]   │  │
│         │  └──────────────────────────────┘  │
│         │  [+ Add Question]                  │
│         │  [Save Survey]                     │
└─────────┴────────────────────────────────────┘

## Screen 4: Logic Rule Editor (modal/panel on Q)
┌───────────────────────────────────────────┐
│  Conditional Logic for Q1                 │
│  ─────────────────────────────────────    │
│  IF answer [equals    ▾] ["No"          ] │
│  THEN      [Skip to   ▾] [Q5: Pricing.. ▾]│
│                                           │
│  [+ Add Rule]                             │
│  [Save Logic]  [Cancel]                   │
└───────────────────────────────────────────┘

## Screen 5: Conversational Survey (respondent)
┌──────────────────────────────────────────────┐
│  ◆ SurveyLabs          ██████░░░░  2 of 5   │
│                                              │
│  ╭──────────────────────────────────────╮    │
│  │  How satisfied are you with          │    │
│  │  our onboarding experience?          │    │
│  ╰──────────────────────────────────────╯    │
│                                              │
│  ◉ Very satisfied                            │
│  ○ Satisfied                                 │
│  ○ Neutral                                   │
│  ○ Dissatisfied                              │
│                                              │
│                  [Next →]                    │
└──────────────────────────────────────────────┘

## Screen 6: Results Page
┌─────────┬────────────────────────────────────┐
│ ◆ Labs  │  Customer Feedback Q1  [Export CSV]│
│         │                                    │
│         │  AUTO-INSIGHTS                     │
│         │  ┌──────────────────────────────┐  │
│         │  │ ◆ 78% chose Pricing concern  │  │
│         │  │ ▲ Support rated 4.6/5        │  │
│         │  │ ◉ Keywords: slow, UI, onboard│  │
│         │  └──────────────────────────────┘  │
│         │                                    │
│         │  ● LIVE  47 total  ↑ accelerating  │
│         │  [All] [Good 38] [Suspect 7][Spam2]│
│         │                                    │
│         │  Q1: How satisfied?    MCQ · 47    │
│         │  ████████████████████ Pricing  78% │
│         │  ████████           Support    34% │
└─────────┴────────────────────────────────────┘
