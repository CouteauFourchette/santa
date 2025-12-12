export interface Assignment {
  giver: string;
  receiver: string;
  index: number;
}

export interface GeneratedLink {
  participant: string;
  url: string;
  encodedData: string;
}

export interface Constraint {
  type: 'exclude' | 'must';
  from: string;
  to: string;
}

export interface SantaState {
  seed: string;
  participants: string[];
  constraints: Constraint[];
  notes?: string;
  theme?: string;
  snowEnabled?: boolean;
}
