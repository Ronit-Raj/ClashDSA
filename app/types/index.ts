export interface Contest {
  contestId: string;
  title: string;
  contestDuration: number; // minutes
  startTime: string; // Unix seconds, returned as a string by the API
  problems: number[];
  creatorId: string;
  creatorUsername: string;
  random: boolean;
  public: boolean;
}