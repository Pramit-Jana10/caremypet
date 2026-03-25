export type PetType = "Dog" | "Cat" | "Bird" | "Fish" | "Small Pet" | "Other";

export type User = {
  id: string;
  name: string;
  email: string;
  role?: "user" | "admin";
  subscription?: Subscription;
};

export type Subscription = {
  plan: string;
  isPremium: boolean;
  premiumFeatures: string[];
  premiumSince?: string | null;
  premiumExpiresOn?: string | null;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  petType: PetType;
  price: number;
  imageUrl?: string;
  rating?: number;
  stock?: number;
  description?: string;
  prescriptionRequired?: boolean;
};

export type PrescriptionUploadResult = {
  filename: string | null;
  extractedMedicines: string[];
  matchedMedicines: Product[];
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type CartItem = {
  product: Product;
  qty: number;
};

export type Vet = {
  id: string;
  name: string;
  specialization: string;
  location: string;
  rating: number;
  bio: string;
  availability: string[];
};

export type PetProfile = {
  id: string;
  name: string;
  type: PetType;
  ageYears: number;
  breed: string;
  gender?: "Male" | "Female" | "Unknown";
  weightKg?: number;
  photoUrl?: string;
  healthConditions?: string[];
};

export type VaccineScheduleItem = {
  id: string;
  petId: string;
  vaccineName: string;
  dueDateIso: string;
  status: "Done" | "Pending";
};

export type Appointment = {
  id: string;
  vetId: string;
  petId: string;
  dateIso: string;
  time: string;
  status: "Pending" | "Confirmed" | "Cancelled";
};

export type Order = {
  id: string;
  createdAt: string;
  total: number;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
};

export type TrainingLesson = {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  order: number;
};

export type TrainingCourse = {
  id: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  petType: Extract<PetType, "Dog" | "Cat">;
  estimatedMinutes: number;
  lessons: TrainingLesson[];
};

export type KnowledgeCategory = "Kittens" | "Healthcare" | "Nutrition" | "Lifestyle and Care" | "Pregnancy and Mating";

export type KnowledgeArticle = {
  id: string;
  title: string;
  category: KnowledgeCategory;
  imageUrl?: string;
  expert: string;
  summary: string;
  body: string;
};

export type HealthRecord = {
  id: string;
  petId: string;
  type: "Vaccination" | "Deworming" | "Flea & Tick" | "Grooming" | "Bathing";
  label: string;
  dateIso: string;
  notes?: string;
  nextDueIso?: string;
};

export type SymptomCategory = "Digestive system" | "Respiratory system" | "Eye problems";

export type SymptomOption = {
  id: string;
  label: string;
  category: SymptomCategory;
};

export type SymptomAssessment = {
  mostLikely: string[];
  lessLikely: string[];
  guidance: string;
};

export type CommunityQuestion = {
  id: string;
  petName: string;
  petAgeYears: number;
  petBreed: string;
  question: string;
  createdAt: string;
  answers: CommunityAnswer[];
};

export type CommunityAnswer = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

