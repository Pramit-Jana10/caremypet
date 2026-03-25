import type {
  CommunityQuestion,
  HealthRecord,
  KnowledgeArticle,
  Order,
  PetProfile,
  Product,
  Review,
  SymptomOption,
  TrainingCourse,
  Vet,
  VaccineScheduleItem
} from "@/utils/types";

export const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Premium Dog Leash",
    category: "Accessories",
    petType: "Dog",
    price: 599.99,
    imageUrl: "/mock/leash.png",
    rating: 4.6,
    stock: 42,
    description: "Soft grip, durable nylon leash perfect for daily walks."
  },
  {
    id: "p2",
    name: "Cat Scratching Post",
    category: "Accessories",
    petType: "Cat",
    price: 399.99,
    imageUrl: "/mock/scratching.png",
    rating: 4.4,
    stock: 18,
    description: "Stable scratching post with comfy perch to keep claws healthy."
  },
  {
    id: "p3",
    name: "Healthy Treats Pack",
    category: "Food",
    petType: "Dog",
    price: 1299.5,
    imageUrl: "/mock/treats.png",
    rating: 4.8,
    stock: 70,
    description: "High-protein treats with no artificial colors."
  }
];

export const mockReviews: Record<string, Review[]> = {
  p1: [
    { id: "r1", author: "Sam", rating: 5, comment: "Great quality and comfortable!", createdAt: new Date().toISOString() }
  ],
  p2: [{ id: "r2", author: "Aditi", rating: 4, comment: "My cat loves it.", createdAt: new Date().toISOString() }]
};

export const mockMedicines: Product[] = [
  {
    id: "m1",
    name: "Deworming Tablets",
    category: "Medicine",
    petType: "Dog",
    price: 89.99,
    imageUrl: "/mock/medicine.png",
    rating: 4.3,
    stock: 120,
    description: "Monthly deworming support. Consult your vet for dosage."
  },
  {
    id: "m2",
    name: "Flea & Tick Spray",
    category: "Medicine",
    petType: "Cat",
    price: 149.99,
    imageUrl: "/mock/medicine2.png",
    rating: 4.5,
    stock: 65,
    description: "Helps reduce fleas & ticks. For external use only."
  }
];

export const mockVets: Vet[] = [
  {
    id: "v1",
    name: "Dr. Maya Jana",
    specialization: "General",
    location: "Kolkata,WB",
    rating: 4.7,
    bio: "Compassionate care with 10+ years of experience in small animal medicine.",
    availability: ["09:00", "10:00", "14:00", "16:00"]
  },
  {
    id: "v2",
    name: "Dr. Rohit Sharma",
    specialization: "Dermatology",
    location: "SaltLake, WB",
    rating: 4.6,
    bio: "Skin & allergy specialist for cats and dogs.",
    availability: ["11:00", "13:00", "15:00"]
  }
];

export const mockPets: PetProfile[] = [
  {
    id: "pet1",
    name: "Kalu",
    type: "Dog",
    ageYears: 3,
    breed: "Labrador",
    gender: "Male",
    weightKg: 24,
    photoUrl: "/mock/dog1.png",
    healthConditions: ["Sensitive stomach"]
  },
  {
    id: "pet2",
    name: "Bulu",
    type: "Cat",
    ageYears: 2,
    breed: "Tabby",
    gender: "Female",
    weightKg: 4.2,
    photoUrl: "/mock/cat1.png"
  }
];

export const mockVaccineSchedule: VaccineScheduleItem[] = [
  {
    id: "vs1",
    petId: "pet1",
    vaccineName: "Rabies",
    dueDateIso: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    status: "Pending"
  },
  {
    id: "vs2",
    petId: "pet2",
    vaccineName: "FVRCP",
    dueDateIso: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: "Pending"
  }
];

export const mockOrders: Order[] = [
  {
    id: "o1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    total: 52.48,
    status: "Delivered"
  }
];

export const mockTrainingCourses: TrainingCourse[] = [
  {
    id: "puppy-basics",
    title: "Puppy Training Course",
    level: "Beginner",
    petType: "Dog",
    estimatedMinutes: 45,
    lessons: [
      {
        id: "puppy-about-program",
        title: "About the program",
        description: "Overview of how this puppy program is structured and how to follow it.",
        videoUrl: "https://www.youtube.com/watch?v=5W0N4P8k6hM",
        order: 1
      },
      {
        id: "puppy-marker-word",
        title: "Marker word training",
        description: "Teach your puppy a clear 'yes' marker to speed up learning.",
        videoUrl: "https://www.youtube.com/watch?v=xpi11fP6H9Y",
        order: 2
      },
      {
        id: "puppy-environment",
        title: "Importance of environment",
        description: "Set up a calm, distraction-free space for training sessions.",
        videoUrl: "https://www.youtube.com/watch?v=VfM7sS3B8eY",
        order: 3
      },
      {
        id: "puppy-how-to-pet",
        title: "How to pet a dog",
        description: "Handle your puppy so they feel safe and enjoy touch.",
        videoUrl: "https://www.youtube.com/watch?v=Y6Gv9M9R9xA",
        order: 4
      },
      {
        id: "puppy-praise",
        title: "Praising your dog",
        description: "Use voice, treats, and play as powerful rewards.",
        videoUrl: "https://www.youtube.com/watch?v=u7QfWQv5x2s",
        order: 5
      },
      {
        id: "puppy-name-training",
        title: "Name training",
        description: "Teach your puppy to respond reliably to their name.",
        videoUrl: "https://www.youtube.com/watch?v=F7lV7wM7Sx8",
        order: 6
      }
    ]
  },
  {
    id: "kitten-confidence",
    title: "Kitten Confidence Course",
    level: "Beginner",
    petType: "Cat",
    estimatedMinutes: 40,
    lessons: [
      {
        id: "kitten-home-setup",
        title: "Safe home setup",
        description: "Prepare litter, feeding, and resting zones that reduce stress.",
        videoUrl: "https://www.youtube.com/watch?v=tg3f3fYI9L8",
        order: 1
      },
      {
        id: "kitten-marker",
        title: "Marker training for cats",
        description: "Use a marker word or clicker to reinforce calm, curious behavior.",
        videoUrl: "https://www.youtube.com/watch?v=9GQgiy9XN6I",
        order: 2
      },
      {
        id: "kitten-handling",
        title: "Gentle handling and touch",
        description: "Build trust while checking paws, ears, and coat.",
        videoUrl: "https://www.youtube.com/watch?v=2WGv0w9x0wQ",
        order: 3
      },
      {
        id: "kitten-name",
        title: "Name recognition games",
        description: "Teach your kitten to come closer when called using high-value rewards.",
        videoUrl: "https://www.youtube.com/watch?v=3Vj2yM8i3mM",
        order: 4
      }
    ]
  }
];

export const mockKnowledgeArticles: KnowledgeArticle[] = [
  {
    id: "art-general-nutrition",
    title: "General Pet Nutrition Guide",
    category: "Nutrition",
    imageUrl: "/mock/nutrition.png",
    expert: "Dr. Maya Jana, BVSc",
    summary: "Core principles of feeding dogs and cats at different life stages.",
    body:
      "Balanced nutrition keeps your pet's immune system, joints, and digestion healthy. Focus on complete diets that list a named protein as the first ingredient, and adjust portions based on body condition, not only weight."
  },
  {
    id: "art-cat-feeding",
    title: "Cat Feeding Guide",
    category: "Kittens",
    imageUrl: "/mock/cat-food.png",
    expert: "Dr. Rohit Sharma, Feline Specialist",
    summary: "How often and how much to feed kittens vs. adult cats.",
    body:
      "Kittens need three to four small meals a day with energy-dense food. Adult cats usually do best with two measured meals. Always provide fresh water and avoid sudden food changes."
  },
  {
    id: "art-cat-vitamins",
    title: "Do Cats Need Vitamin Supplements?",
    category: "Healthcare",
    imageUrl: "/mock/vitamins.png",
    expert: "Dr. Ananya Rao, Nutritionist",
    summary: "When supplements are useful and when they are risky.",
    body:
      "Most healthy pets on complete diets do not need extra vitamins. Supplements can help in specific conditions, but always consult a vet first, as excess fat-soluble vitamins can be harmful."
  },
  {
    id: "art-care-tips",
    title: "Daily Care Tips for Busy Pet Parents",
    category: "Lifestyle and Care",
    imageUrl: "/mock/care.png",
    expert: "CareMyPet Editorial Team",
    summary: "Simple routines to maintain hygiene, enrichment, and bonding.",
    body:
      "Short, consistent routines are better than occasional long sessions. Combine brushing, play, and training into 10–15 minute blocks spread across the day."
  },
  {
    id: "art-pregnancy-basics",
    title: "Pregnancy and Mating Basics for Cats and Dogs",
    category: "Pregnancy and Mating",
    imageUrl: "/mock/pregnancy.png",
    expert: "Dr. Kavya Menon, Reproductive Medicine",
    summary: "How to plan safe breeding decisions and prenatal care with your vet.",
    body:
      "Breeding should always start with health screening, vaccination review, and a breeding suitability check. During pregnancy, monitor appetite, weight trends, and behavior changes, and schedule regular vet follow-ups for maternal and neonatal safety."
  },
  {
    id: "art-grooming-hygiene",
    title: "Grooming and Hygiene Checklist by Breed Type",
    category: "Lifestyle and Care",
    imageUrl: "/mock/grooming.png",
    expert: "Dr. Maya Jana, BVSc",
    summary: "Practical brushing, bathing, nail, and ear-care intervals for common coat types.",
    body:
      "Double-coated breeds usually need frequent brushing and less frequent bathing, while short-coated pets still benefit from routine coat checks. Build a repeatable schedule for nails, ears, dental care, and skin inspection so early issues are noticed quickly."
  }
];

export const mockSymptomOptions: SymptomOption[] = [
  { id: "symp-constipation", label: "Constipation", category: "Digestive system" },
  { id: "symp-vomiting", label: "Vomiting", category: "Digestive system" },
  { id: "symp-diarrhea", label: "Diarrhea", category: "Digestive system" },
  { id: "symp-coughing", label: "Coughing", category: "Respiratory system" },
  { id: "symp-fast-breathing", label: "Fast breathing at rest", category: "Respiratory system" },
  { id: "symp-eye-redness", label: "Red or watery eyes", category: "Eye problems" },
  { id: "symp-eye-discharge", label: "Thick eye discharge", category: "Eye problems" }
];

export const mockHealthRecords: HealthRecord[] = [
  {
    id: "hr-v1",
    petId: "pet1",
    type: "Vaccination",
    label: "Rabies core vaccine",
    dateIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
    nextDueIso: new Date(Date.now() + 1000 * 60 * 60 * 24 * 165).toISOString()
  },
  {
    id: "hr-d1",
    petId: "pet1",
    type: "Deworming",
    label: "Monthly deworming tablet",
    dateIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
    nextDueIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    notes: "Repeat every 30 days"
  },
  {
    id: "hr-f1",
    petId: "pet1",
    type: "Flea & Tick",
    label: "Topical flea & tick control",
    dateIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    nextDueIso: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString()
  },
  {
    id: "hr-g1",
    petId: "pet1",
    type: "Grooming",
    label: "Full grooming session",
    dateIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    notes: "Coat brushed, nails trimmed"
  },
  {
    id: "hr-b1",
    petId: "pet1",
    type: "Bathing",
    label: "Medicated bath",
    dateIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    nextDueIso: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    notes: "For sensitive skin"
  },
  {
    id: "hr-v2",
    petId: "pet2",
    type: "Vaccination",
    label: "FVRCP booster",
    dateIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 360).toISOString(),
    nextDueIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    notes: "Missed due date by a few days"
  },
  {
    id: "hr-d2",
    petId: "pet2",
    type: "Deworming",
    label: "Quarterly deworming",
    dateIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
    nextDueIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString()
  },
  {
    id: "hr-b2",
    petId: "pet2",
    type: "Bathing",
    label: "Routine bath",
    dateIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    nextDueIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString()
  }
];

export const mockCommunityQuestions: CommunityQuestion[] = [
  {
    id: "q1",
    petName: "Kalu",
    petAgeYears: 3,
    petBreed: "Labrador",
    question: "Why does my dog spin before sleeping?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    answers: [
      {
        id: "a1",
        author: "Riya (Golden Retriever, 2y)",
        body:
          "Many dogs circle to make their resting spot comfy and to check the environment. If there is no pain or restlessness, it is usually normal.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
      }
    ]
  },
  {
    id: "q2",
    petName: "Bulu",
    petAgeYears: 2,
    petBreed: "Tabby",
    question: "How often should I brush my cat’s teeth?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    answers: [
      {
        id: "a2",
        author: "Dr. Maya (Vet)",
        body:
          "Daily is ideal, but even 2–3 times a week helps a lot. Use only pet-safe toothpaste and introduce brushing slowly.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
      }
    ]
  }
];

