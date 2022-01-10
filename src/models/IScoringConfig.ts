export interface IScoringConfig extends Record<string, any> {
    CompetitionID: number;
    DistancePoints: number;     // points/hc km
    SpeedPoints: number;        // Points/kph
    MinimumSpeed: number;       // min HC speed to get speed points
    CompletionFactor: number;   // multiplier if task completed 
    UseTaskDistance: boolean;    // Use Task or Sector Distance
    UseMinDistance: boolean;    // Distance must be > hc to get speed points
    CompleteForSpeed: boolean;  // must complete to get Speed Points
}