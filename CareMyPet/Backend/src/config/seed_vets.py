from .db import mongo


def seed_vets_if_empty() -> None:
    """Insert predefined vets (from your spreadsheet) if collection is empty."""
    if mongo.db.vets.count_documents({}) > 0:
        return

    vets = [
        {
            "name": "DR SAMARESH MAHATA",
            "specialization": "Medicine",
            "location": "Kolkata, WB",
            "clinicName": "S R PET CLINIC",
            "qualification": "M.V.Sc (Medicine)",
            "regNo": "3824 (WBVC)",
            "rating": 4.7,
            "bio": "Experienced veterinary physician focusing on internal medicine and long-term pet health.",
            "availability": ["09:00", "11:00", "16:00"],
        },
        {
            "name": "DR ASHIMI DAS",
            "specialization": "Surgery & Radiology",
            "location": "Kolkata, WB",
            "clinicName": "PET MANSION",
            "qualification": "B.V.Sc & A.H (WBUAFS), M.V.Sc Surgery & Radiology",
            "regNo": "8267 (VCI)",
            "rating": 4.8,
            "bio": "Small-animal surgeon with expertise in soft-tissue procedures and diagnostic imaging.",
            "availability": ["10:00", "13:00", "18:00"],
        },
        {
            "name": "DR VIKASH RAJ",
            "specialization": "General Practice",
            "location": "Kolkata, WB",
            "clinicName": "CORONA METRO",
            "qualification": "B.V.Sc & A.H (WBUAFS), M.V.Sc Scholar",
            "regNo": "4102 (BVC)",
            "rating": 4.6,
            "bio": "Clinician with interest in preventive care, routine check-ups, and pet wellness.",
            "availability": ["09:30", "12:30", "17:00"],
        },
        {
            "name": "DR PARTHA SARKAR",
            "specialization": "Small Animal Medicine",
            "location": "Kolkata, WB",
            "clinicName": "APOLLO PET CARE",
            "qualification": "B.V.Sc & A.H (1st Class), M.V.Sc (1st Class)",
            "regNo": "3690 (WBVC)",
            "rating": 4.9,
            "bio": "Gold medalist vet focusing on complex medical cases and long-term treatment planning.",
            "availability": ["11:00", "15:00", "19:00"],
        },
        {
            "name": "DR SANTANU ROUTH",
            "specialization": "General Practice",
            "location": "Kolkata, WB",
            "clinicName": "FOUR LEG LOVE",
            "qualification": "B.V.Sc & A.H, M.V.Sc Scholar (WBUAFS)",
            "regNo": "3892 (WBVC)",
            "rating": 4.5,
            "bio": "Focuses on companion animal care, routine medicine, and client education.",
            "availability": ["10:00", "14:00", "18:00"],
        },
        {
            "name": "DR PABITRA DUTTA",
            "specialization": "Veterinary Medicine",
            "location": "Kolkata, WB",
            "clinicName": "FURRNEST",
            "qualification": "B.V.Sc & A.H (WBUAFS), M.V.Sc Scholar (Vety. Medicine)",
            "regNo": "",
            "rating": 4.6,
            "bio": "Medicine-focused vet with interest in chronic disease management and geriatric pets.",
            "availability": ["09:00", "12:00", "17:30"],
        },
        {
            "name": "DR NITISH KUMAR SINGH",
            "specialization": "Veterinary Medicine",
            "location": "Kolkata, WB",
            "clinicName": "CORONA METRO",
            "qualification": "B.V.Sc & A.H (WBUAFS), M.V.Sc Scholar (Vety. Medicine)",
            "regNo": "14166 (VCI)",
            "rating": 4.7,
            "bio": "Handles day-to-day medical complaints with a focus on evidence-based therapy.",
            "availability": ["10:30", "13:30", "18:30"],
        },
        {
            "name": "DR KSHOUNEE KHAN",
            "specialization": "Veterinary Surgery",
            "location": "Kolkata, WB",
            "clinicName": "ANTIDOTE / FURMACY",
            "qualification": "B.V.Sc & A.H, M.I.S.A.C.P, M.V.Sc (Veterinary Surgery)",
            "regNo": "3634 (WBVC)",
            "rating": 4.8,
            "bio": "Surgical vet experienced in soft-tissue and orthopaedic procedures for companion animals.",
            "availability": ["09:30", "12:30", "16:30"],
        },
    ]

    mongo.db.vets.insert_many(vets)

