from fastapi import APIRouter

router = APIRouter()

@router.get("/techniques")
def get_meditation_techniques():
    """Returns a list of meditation techniques and instructions."""
    return [
        {
            "id": "mindfulness",
            "name": "Mindfulness (Vipassana)",
            "description": "Focusing on the breath and being present without judgment.",
            "instructions": [
                "Sit in a comfortable position with your back straight.",
                "Close your eyes or lower your gaze.",
                "Bring your attention to your breathing. Feel the air enter and leave your body.",
                "When your mind wanders, gently bring it back to the breath.",
                "Avoid judging yourself for having thoughts; just observe them and return to the breath."
            ],
            "benefit": "Refines focus and reduces anxiety.",
            "duration": "5-20 mins"
        },
        {
            "id": "body-scan",
            "name": "Body Scan Meditation",
            "description": "Paying attention to physical sensations throughout the body.",
            "instructions": [
                "Lie down or sit comfortably.",
                "Start at your toes and bring your awareness to any sensations (tingling, warmth, tension).",
                "Slowly move your focus up to your feet, ankles, calves, and so on, up to the top of your head.",
                "If you feel tension, imagine breathing into that area to release it.",
                "Notice how each part of your body feels without trying to change it."
            ],
            "benefit": "Promotes deep relaxation and body awareness.",
            "duration": "10-30 mins"
        },
        {
            "id": "loving-kindness",
            "name": "Loving-Kindness (Metta)",
            "description": "Cultivating positive emotions and compassion for yourself and others.",
            "instructions": [
                "Sit comfortably and close your eyes.",
                "Silently repeat phrases to yourself: 'May I be happy. May I be healthy. May I be safe.'",
                "Think of a loved one and repeat the phrases: 'May you be happy...' ",
                "Extend this to people you feel neutral toward, and even those you have difficulty with.",
                "Finally, extend these wishes to all beings everywhere."
            ],
            "benefit": "Increases empathy and social connection.",
            "duration": "5-15 mins"
        },
        {
            "id": "zen",
            "name": "Zen (Zazen)",
            "description": "A seated meditation technique focused on posture and awareness.",
            "instructions": [
                "Sit on a cushion (zafu) or chair with a straight spine.",
                "Tuck your chin in slightly and keep your eyes half-open, looking down.",
                "Fold your hands in the 'Cosmic Mudra' (right hand on lap, left hand on top, thumbs touching).",
                "Focus on the breath, specifically the movement of the abdomen.",
                "Just sit, without thinking of any particular object or goal (Shikantaza)."
            ],
            "benefit": "Develops discipline and deep mental clarity.",
            "duration": "20-40 mins"
        }
    ]

@router.get("/guides/breathing")
def get_breathing_guides():
    return [
        {"name": "4-7-8 Breathing", "inhale": 4, "hold": 7, "exhale": 8, "description": "Relaxes the nervous system for sleep."},
        {"name": "Box Breathing", "inhale": 4, "hold": 4, "exhale": 4, "hold_post": 4, "description": "Used by Navy SEALs to stay calm under pressure."},
        {"name": "Square Breathing", "inhale": 5, "hold": 5, "exhale": 5, "hold_post": 5, "description": "Simple and effective for stress."}
    ]
