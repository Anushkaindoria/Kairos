export type Risk = 'Conservative' | 'Moderate' | 'Aggressive'
export type GoalType =
  | 'Home Purchase'
  | 'Retirement'
  | 'Wealth Growth'
  | 'Short-Term Liquidity'
  | 'Child Education'
  | 'Custom'
export type GoalFlexibility = 'Strict' | 'Flexible'

export interface Goal {
  id: string
  type: GoalType
  name?: string
  targetAmount: number
  targetDate: string
  flexibility: GoalFlexibility
}
export interface Profile {
  name: string
  email: string
  age: number
  city: string
  occupation: 'Salaried' | 'Self-employed' | 'Student'
  income: number
  salaryCreditDate: number // day of month, 1-31
  incomeStability: 'Fixed' | 'Variable' | 'Irregular'
  otherIncomeType: string
  otherIncome: number
  rentEmi: number
  otherBills: number
  loans: number
  risk: Risk
  investments: number
  monthlySip: number
  mix: { equity: number; debt: number; gold: number; cash: number }
  goals: Goal[]
  emergencyMonths: number
  lifeCover: number
  healthCover: number
  dependents: number
  consent: boolean
  assets: Assets;
expenses: Expenses;
customAssets: CustomItem[];
customExpenses: CustomItem[];
}
export type Assets = {
  property: number;
  land: number;
  vehicle: number;
  jewellery: number;
  business: number;
  otherAssets: number;
};

export type Expenses = {
  food: number;
  shopping: number;
  subscriptions: number;
  transport: number;
  entertainment: number;
  health: number;
  otherExpenses: number;
};
export type CustomItem = {
  id: string;
  name: string;
  amount: number;
};