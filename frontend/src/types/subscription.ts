export type Plan = {
  id: number;
  code: string;
  name: string;
  capabilities: Record<string, number | null>;
};

export type Subscription = {
  status: string;
  started_at: string;
  ends_at: string | null;
  is_lifetime: boolean;
};

export type SubscriptionUsage = {
  students_used: number;
  students_limit: number | null;
};

export type SubscriptionMe = {
  plan: Plan;
  subscription: Subscription;
  usage: SubscriptionUsage;
};
