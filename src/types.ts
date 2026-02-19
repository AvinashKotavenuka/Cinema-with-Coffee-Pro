export enum AppView {
  CONCEPT = 'CONCEPT',
  SCREENPLAY = 'SCREENPLAY',
  CHARACTERS = 'CHARACTERS',
  STORYBOARD = 'STORYBOARD',
  BREAKDOWN = 'BREAKDOWN',
  BUDGET = 'BUDGET',
  PITCH_DECK = 'PITCH_DECK',
  CREW = 'CREW',
  LOCATIONS = 'LOCATIONS',
  SCHEDULE = 'SCHEDULE',
  SOUND_DESIGN = 'SOUND_DESIGN'
}

export interface Character {
  name: string;
  role: string;
  description: string;
  motivation: string;
  arc: string;
  psychologicalDepth: string;
}

export interface ScriptBreakdownItem {
  scene: number;
  location: string;
  timeOfDay: string;
  characters: string[];
  props: string[];
  costumes: string[];
  sfx: string[];
  vfx: string[];
  vehicles: string[];
}

export interface BudgetItem {
  category: string;
  label: string;
  estimatedCost: number;
  description: string;
}

export interface PitchDeckSlide {
  title: string;
  content: string;
  imagePrompt?: string;
}

export interface ScheduleDay {
  dayNumber: number;
  scenes: number[];
  estimatedHours: number;
  notes: string;
}

export interface SoundCue {
  sceneNumber: number;
  environment: string;
  emotionalGoal: string;
  cues: string[];
}

export interface StoryboardFrame {
  sceneDescription: string;
  imageUrl: string;
}

export interface ProductionPackage {
  concept: string;
  screenplay: string;
  isLocked?: boolean;
  characters: Character[];
  breakdown: ScriptBreakdownItem[];
  budget: BudgetItem[];
  pitchDeck: PitchDeckSlide[];
  crewNeeds: { role: string; description: string }[];
  locations: { name: string; requirements: string; aesthetic: string }[];
  schedule: ScheduleDay[];
  soundDesign: SoundCue[];
  storyboard: StoryboardFrame[];
}
