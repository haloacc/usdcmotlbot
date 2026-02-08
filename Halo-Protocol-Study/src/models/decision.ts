export interface Decision {
  risk_score: number;
  decision: 'approve' | 'challenge' | 'block';
  normalized_payload: object;
}