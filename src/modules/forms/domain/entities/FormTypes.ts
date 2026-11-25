export type FormStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";

export type QuestionType =
  | "SHORT_TEXT"
  | "PARAGRAPH"
  | "MULTIPLE_CHOICE"
  | "CHECKBOXES"
  | "DROPDOWN"
  | "LINEAR_SCALE"
  | "DATE"
  | "EMAIL"
  | "PHONE";

export interface FormQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  allowOther?: boolean;
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}

export interface FormSettings {
  limitOnePerDevice: boolean;
  maxResponses: number | null;
  closesAt: string | null;
  thankYouMessage: string;
}

export type AnswerValue = string | string[] | number | null;
export type FormAnswersMap = Record<string, AnswerValue>;

export interface FormResponseRecord {
  id: string;
  formId: string;
  answers: FormAnswersMap;
  deviceHash?: string | null;
  locale: string;
  submittedAt: Date;
}

export interface QuestionSummary {
  questionId: string;
  title: string;
  type: QuestionType;
  totalAnswers: number;
  optionCounts?: Array<{ label: string; count: number; percentage: number }>;
  scaleAverage?: number;
  scaleDistribution?: Array<{ value: number; count: number; percentage: number }>;
  textResponses?: string[];
}
