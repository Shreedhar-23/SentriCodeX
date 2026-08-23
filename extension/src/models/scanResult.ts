export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type Confidence = 'high' | 'medium' | 'low';
export type Category =
  | 'secrets'
  | 'authentication'
  | 'injection'
  | 'cryptography'
  | 'unsafe_apis'
  | 'configuration'
  | 'dependency'
  | 'best_practices';

export interface Finding {
  rule_id: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  category: Category;
  file: string;
  line: number;
  column: number;
  description: string;
  recommendation: string;
  fingerprint: string;
}

export interface ScanSummary {
  files_scanned: number;
  findings_count: number;
  severity_breakdown: Record<Severity, number>;
}

export interface ScanResult {
  schema_version: string;
  scanned_at: string;
  target: string;
  files_scanned: number;
  findings: Finding[];
  summary: ScanSummary;
  security_score: number;
  duration_ms: number;
}
