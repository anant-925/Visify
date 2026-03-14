import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

export interface Snapshot {
  step: number;
  line: number;
  lineExecuting: string;
  variables: Record<string, unknown>;
  stackFrames: Array<{ name: string; variables: Record<string, unknown>; line: number }>;
  output: string[];
  description: string;
}

export interface VisualizeResponse {
  traceId: string;
  language: string;
  totalSteps: number;
  snapshots: Snapshot[];
  variables: Record<string, unknown>;
  stackFrames: Array<{ name: string; variables: Record<string, unknown>; line: number }>;
  output: string[];
}

export interface ComplexityResponse {
  complexity: string;
  spaceComplexity: string;
  bigO: string;
  name: string;
  explanation: string;
  recurrenceRelation: string | null;
  steps: string[];
  pattern: string;
}

export interface Algorithm {
  id: string;
  name: string;
  category: string;
  language: string;
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  code: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
  type: string;
}

export async function visualizeCode(code: string, language: string): Promise<VisualizeResponse> {
  const { data } = await api.post<VisualizeResponse>('/api/visualize', { code, language });
  return data;
}

export async function analyzeComplexity(code: string, language: string): Promise<ComplexityResponse> {
  const { data } = await api.post<ComplexityResponse>('/api/complexity', { code, language });
  return data;
}

export async function getAlgorithmLibrary(params?: { category?: string; language?: string }): Promise<{ algorithms: Algorithm[]; total: number }> {
  const { data } = await api.get('/api/algorithm-library', { params });
  return data;
}

export async function getAlgorithm(id: string): Promise<Algorithm> {
  const { data } = await api.get(`/api/algorithm-library/${id}`);
  return data;
}

export async function getResources(params?: { tag?: string; type?: string }): Promise<{ resources: Resource[]; total: number }> {
  const { data } = await api.get('/api/resources', { params });
  return data;
}

export default api;
