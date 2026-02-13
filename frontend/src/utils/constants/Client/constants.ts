export const OBJECTIVES = {
  1: "Ganho de Massa",
  2: "Emagrecimento",
  3: "Condicionamento",
};

export type ObjectiveKey = keyof typeof OBJECTIVES;

export const GENDERS = {
  M: "Masculino",
  F: "Feminino",
  O: "Outro",
};

export const UPLOAD_PROFILE_PHOTO_MAX_FILE_SIZE = 5 * Math.pow(10, 6);

export const CLIENT_TAGS = [
  {
    id: "iniciante",
    label: "Iniciante",
  },
  {
    id: "avancado",
    label: "Avançado",
  },
  {
    id: "lesao",
    label: "Lesão",
  },
  {
    id: "alta_performance",
    label: "Alta Performance",
  },
  {
    id: "emagrecimento",
    label: "Emagrecimento",
  },
  {
    id: "condicionamento",
    label: "Condicionamento",
  },
];

export const BLOOD_PRESSURE = {
  1: "Nenhum",
  2: "Hipertensão",
  3: "Hipotensão",
};

export type BloodPressureKey = keyof typeof BLOOD_PRESSURE;

export const EXERCISES_LABELS = {
  series: "Séries",
  reps: "Repetições",
  rest: "Descanso",
  obs: "Observações",
};

export type ExerciseLabels = keyof typeof EXERCISES_LABELS;

export const EXTRA_LABELS = {
  diet: "Alimentação",
  sleep: "Sono",
  physicalActivity: "Atividade física",
  observation: "Observações",
};

export type ExtraLabels = keyof typeof EXTRA_LABELS;

export const GALLERY_VISIBILITY = {
  PRIVATE: 0,
  TRAINER: 1,
} as const;

export type GalleryVisibilityKey = keyof typeof GALLERY_VISIBILITY;
export type GalleryVisibilityValue =
  (typeof GALLERY_VISIBILITY)[GalleryVisibilityKey];

export const VISIBILITY_BY_VALUE = {
  0: "PRIVATE",
  1: "TRAINER",
} as const;
