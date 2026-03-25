from typing import Any, Dict, List, Optional

from ..config.db import mongo


DEFAULT_TRAINING_COURSES: List[Dict[str, Any]] = [
    {
        "id": "puppy-basics",
        "title": "Puppy Training Course",
        "level": "Beginner",
        "petType": "Dog",
        "estimatedMinutes": 45,
        "lessons": [
            {
                "id": "puppy-about-program",
                "title": "About the program",
                "description": "Overview of how this puppy program is structured and how to follow it.",
                "videoUrl": "https://www.youtube.com/watch?v=5W0N4P8k6hM",
                "order": 1,
            },
            {
                "id": "puppy-marker-word",
                "title": "Marker word training",
                "description": "Teach your puppy a clear 'yes' marker to speed up learning.",
                "videoUrl": "https://www.youtube.com/watch?v=xpi11fP6H9Y",
                "order": 2,
            },
            {
                "id": "puppy-environment",
                "title": "Importance of environment",
                "description": "Set up a calm, distraction-free space for training sessions.",
                "videoUrl": "https://www.youtube.com/watch?v=VfM7sS3B8eY",
                "order": 3,
            },
            {
                "id": "puppy-how-to-pet",
                "title": "How to pet a dog",
                "description": "Handle your puppy so they feel safe and enjoy touch.",
                "videoUrl": "https://www.youtube.com/watch?v=Y6Gv9M9R9xA",
                "order": 4,
            },
            {
                "id": "puppy-praise",
                "title": "Praising your dog",
                "description": "Use voice, treats, and play as powerful rewards.",
                "videoUrl": "https://www.youtube.com/watch?v=u7QfWQv5x2s",
                "order": 5,
            },
            {
                "id": "puppy-name-training",
                "title": "Name training",
                "description": "Teach your puppy to respond reliably to their name.",
                "videoUrl": "https://www.youtube.com/watch?v=F7lV7wM7Sx8",
                "order": 6,
            },
        ],
    },
    {
        "id": "kitten-confidence",
        "title": "Kitten Confidence Course",
        "level": "Beginner",
        "petType": "Cat",
        "estimatedMinutes": 40,
        "lessons": [
            {
                "id": "kitten-home-setup",
                "title": "Safe home setup",
                "description": "Prepare litter, feeding, and resting zones that reduce stress.",
                "videoUrl": "https://www.youtube.com/watch?v=tg3f3fYI9L8",
                "order": 1,
            },
            {
                "id": "kitten-marker",
                "title": "Marker training for cats",
                "description": "Use a marker word or clicker to reinforce calm, curious behavior.",
                "videoUrl": "https://www.youtube.com/watch?v=9GQgiy9XN6I",
                "order": 2,
            },
            {
                "id": "kitten-handling",
                "title": "Gentle handling and touch",
                "description": "Build trust while checking paws, ears, and coat.",
                "videoUrl": "https://www.youtube.com/watch?v=2WGv0w9x0wQ",
                "order": 3,
            },
            {
                "id": "kitten-name",
                "title": "Name recognition games",
                "description": "Teach your kitten to come closer when called using high-value rewards.",
                "videoUrl": "https://www.youtube.com/watch?v=3Vj2yM8i3mM",
                "order": 4,
            },
        ],
    },
]


DEFAULT_KNOWLEDGE_ARTICLES: List[Dict[str, Any]] = [
    {
        "id": "art-general-nutrition",
        "title": "General Pet Nutrition Guide",
        "category": "Nutrition",
        "imageUrl": "/mock/nutrition.png",
        "expert": "Dr. Maya Jana, BVSc",
        "summary": "Core principles of feeding dogs and cats at different life stages.",
        "body": "Balanced nutrition keeps your pet's immune system, joints, and digestion healthy. Focus on complete diets that list a named protein as the first ingredient, and adjust portions based on body condition, not only weight.",
    },
    {
        "id": "art-cat-feeding",
        "title": "Cat Feeding Guide",
        "category": "Kittens",
        "imageUrl": "/mock/cat-food.png",
        "expert": "Dr. Rohit Sharma, Feline Specialist",
        "summary": "How often and how much to feed kittens vs. adult cats.",
        "body": "Kittens need three to four small meals a day with energy-dense food. Adult cats usually do best with two measured meals. Always provide fresh water and avoid sudden food changes.",
    },
    {
        "id": "art-cat-vitamins",
        "title": "Do Cats Need Vitamin Supplements?",
        "category": "Healthcare",
        "imageUrl": "/mock/vitamins.png",
        "expert": "Dr. Ananya Rao, Nutritionist",
        "summary": "When supplements are useful and when they are risky.",
        "body": "Most healthy pets on complete diets do not need extra vitamins. Supplements can help in specific conditions, but always consult a vet first, as excess fat-soluble vitamins can be harmful.",
    },
    {
        "id": "art-care-tips",
        "title": "Daily Care Tips for Busy Pet Parents",
        "category": "Lifestyle and Care",
        "imageUrl": "/mock/care.png",
        "expert": "CareMyPet Editorial Team",
        "summary": "Simple routines to maintain hygiene, enrichment, and bonding.",
        "body": "Short, consistent routines are better than occasional long sessions. Combine brushing, play, and training into 10-15 minute blocks spread across the day.",
    },
    {
        "id": "art-pregnancy-basics",
        "title": "Pregnancy and Mating Basics for Cats and Dogs",
        "category": "Pregnancy and Mating",
        "imageUrl": "/mock/pregnancy.png",
        "expert": "Dr. Kavya Menon, Reproductive Medicine",
        "summary": "How to plan safe breeding decisions and prenatal care with your vet.",
        "body": "Breeding should always start with health screening, vaccination review, and a breeding suitability check. During pregnancy, monitor appetite, weight trends, and behavior changes, and schedule regular vet follow-ups for maternal and neonatal safety.",
    },
    {
        "id": "art-grooming-hygiene",
        "title": "Grooming and Hygiene Checklist by Breed Type",
        "category": "Lifestyle and Care",
        "imageUrl": "/mock/grooming.png",
        "expert": "Dr. Maya Jana, BVSc",
        "summary": "Practical brushing, bathing, nail, and ear-care intervals for common coat types.",
        "body": "Double-coated breeds usually need frequent brushing and less frequent bathing, while short-coated pets still benefit from routine coat checks. Build a repeatable schedule for nails, ears, dental care, and skin inspection so early issues are noticed quickly.",
    },
]


def _normalize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(doc)
    out.pop("_id", None)
    return out


def _seed_learning_if_empty() -> None:
    if mongo.db.training_courses.count_documents({}) == 0:
        mongo.db.training_courses.insert_many(DEFAULT_TRAINING_COURSES)

    if mongo.db.knowledge_articles.count_documents({}) == 0:
        mongo.db.knowledge_articles.insert_many(DEFAULT_KNOWLEDGE_ARTICLES)


def list_training_courses(pet_type: Optional[str] = None) -> List[Dict[str, Any]]:
    _seed_learning_if_empty()
    query: Dict[str, Any] = {}
    if pet_type:
        query["petType"] = pet_type
    docs = mongo.db.training_courses.find(query)
    return [_normalize_doc(d) for d in docs]


def list_knowledge_articles(category: Optional[str] = None) -> List[Dict[str, Any]]:
    _seed_learning_if_empty()
    query: Dict[str, Any] = {}
    if category:
        query["category"] = category
    docs = mongo.db.knowledge_articles.find(query)
    return [_normalize_doc(d) for d in docs]
