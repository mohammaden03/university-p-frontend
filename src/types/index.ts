/**
 * TypeScript domain models and API contracts matching the NestJS backend specification.
 */

export type UserRole = 'admin' | 'researcher' | 'annotator';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  institution?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  institution?: string;
  role?: UserRole;
}

export type ManuscriptLanguage = 'fa' | 'ar' | 'mixed';
export type ScriptType = 'nastaliq' | 'naskh' | 'shekasteh' | 'kufic' | 'thuluth' | 'taliq' | 'muhaqqaq' | 'other';
export type HistoricalPeriod = 'timurid' | 'safavid' | 'ilkanid' | 'qajar' | 'abbasid' | 'seljuk' | 'other';

export interface Manuscript {
  id: string;
  title: string;
  author: string;
  language: ManuscriptLanguage;
  description: string;
  repositoryName: string;
  catalogId: string;
  historicalPeriod: HistoricalPeriod;
  scriptType: ScriptType;
  sourceReference?: string;
  totalPages: number;
  digitizedPagesCount: number;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManuscriptCreateDto {
  title: string;
  author: string;
  language: ManuscriptLanguage;
  description: string;
  repositoryName: string;
  catalogId: string;
  historicalPeriod: HistoricalPeriod;
  scriptType: ScriptType;
  sourceReference?: string;
  coverImageUrl?: string;
}

export interface ManuscriptPage {
  id: string;
  manuscriptId: string;
  pageNumber: number;
  imageUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  notes?: string;
  status: 'pending' | 'processing' | 'recognized' | 'reviewed' | 'approved' | 'failed';
  latestTranscriptionId?: string;
  latestTranscriptionSnippet?: string;
  confidence?: number;
  createdAt: string;
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface RecognitionJob {
  id: string;
  pageId: string;
  manuscriptId: string;
  manuscriptTitle?: string;
  pageNumber: number;
  language: ManuscriptLanguage;
  modelName: string;
  modelVersion: string;
  status: JobStatus;
  progressPercent?: number;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  transcriptionId?: string;
  createdAt: string;
}

export interface CreateJobDto {
  pageId: string;
  manuscriptId: string;
  language: ManuscriptLanguage;
  modelName: string;
  priority?: 'normal' | 'high';
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TranscriptionLine {
  id: string;
  lineNumber: number;
  text: string;
  confidence: number;
  bbox?: BoundingBox;
}

export interface TranscriptionRevision {
  id: string;
  version: number;
  text: string;
  authorId: string;
  authorName: string;
  note?: string;
  createdAt: string;
}

export interface Transcription {
  id: string;
  pageId: string;
  manuscriptId: string;
  status: 'original_ai' | 'reviewed' | 'approved';
  text: string;
  originalAiText: string;
  confidence?: number;
  lines: TranscriptionLine[];
  revisions: TranscriptionRevision[];
  modelMetadata: {
    modelName: string;
    modelVersion: string;
    recognitionDate: string;
    lineCount: number;
    detectedScript?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SaveRevisionDto {
  text: string;
  note?: string;
  status?: 'reviewed' | 'approved';
}

export interface SearchQuery {
  q: string;
  manuscriptId?: string;
  author?: string;
  language?: ManuscriptLanguage;
  historicalPeriod?: HistoricalPeriod;
  scriptType?: ScriptType;
  status?: 'all' | 'reviewed' | 'approved' | 'original_ai';
  page?: number;
  limit?: number;
}

export interface SearchResultItem {
  id: string;
  pageId: string;
  manuscriptId: string;
  manuscriptTitle: string;
  author: string;
  pageNumber: number;
  language: ManuscriptLanguage;
  scriptType: ScriptType;
  historicalPeriod: HistoricalPeriod;
  snippet: string;
  matchedText: string;
  confidence?: number;
  status: 'original_ai' | 'reviewed' | 'approved';
  imageUrl: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
}

export type DatasetSplit = 'train' | 'validation' | 'test' | 'unassigned';
export type DatasetStatus = 'draft' | 'reviewed' | 'approved';

export interface DatasetItem {
  id: string;
  manuscriptId: string;
  manuscriptTitle: string;
  pageId: string;
  pageNumber: number;
  imageUrl: string;
  language: ManuscriptLanguage;
  scriptType: ScriptType;
  split: DatasetSplit;
  status: DatasetStatus;
  groundTruthText: string;
  originalAiText: string;
  characterCount: number;
  wordCount: number;
  cerPercentage?: number;
  updatedAt: string;
}

export interface DatasetStatsResponse {
  totalSamples: number;
  trainCount: number;
  validationCount: number;
  testCount: number;
  unassignedCount: number;
  approvedCount: number;
  reviewedCount: number;
  draftCount: number;
  totalWords: number;
  totalCharacters: number;
  languageDistribution: Record<ManuscriptLanguage, number>;
  scriptDistribution: Record<string, number>;
}

export interface DashboardStats {
  totalManuscripts: number;
  totalDigitizedPages: number;
  completedJobs: number;
  pendingJobs: number;
  failedJobs: number;
  approvedDatasetSamples: number;
  recentManuscripts: Manuscript[];
  recentJobs: RecognitionJob[];
  systemHealth: {
    backendStatus: 'connected' | 'degraded' | 'offline';
    aiWorkerStatus: 'idle' | 'busy' | 'offline';
    averageJobDurationSec: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
}
