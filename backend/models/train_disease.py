import csv
import os
import random
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

def augment_symptoms(symptoms_list):
    """Generate diverse natural language combinations of symptoms."""
    augmented = []
    # Base full text
    augmented.append(" ".join(symptoms_list))
    
    # Subsets of 2, 3, 4 symptoms
    for size in range(1, len(symptoms_list) + 1):
        for _ in range(3):
            sub = random.sample(symptoms_list, k=min(size, len(symptoms_list)))
            # Variations with conversational prefixes
            augmented.append(" ".join(sub))
            augmented.append(f"i am suffering from {', '.join(sub)}")
            augmented.append(f"patient complains of {', '.join(sub)}")
            augmented.append(f"feeling {', '.join(sub)}")
            augmented.append(f"experiencing severe {' and '.join(sub)}")
            
    return list(set(augmented))

def train_model():
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'ml_workspace', 'data', 'disease_dataset.csv')
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")
        
    docs = []
    labels = []
    metadata = {}
    
    random.seed(42)
    np.random.seed(42)

    with open(dataset_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            disease = row['Desease list'].strip()
            symptoms = [
                row['Symptom 1'].strip(), row['Symptom 2'].strip(), 
                row['Symptom 3'].strip(), row['Symptom 4'].strip(), 
                row['Symptom 5'].strip()
            ]
            symptoms = [s.lower() for s in symptoms if s]
            
            # Store metadata
            metadata[disease] = {
                "tests": [t.strip() for t in [row['Test 1'], row['Test 2']] if t.strip()],
                "consultant": row['Consultant'].strip()
            }
            
            # Data Augmentation: Create multiple synthetic natural language samples per disease
            aug_samples = augment_symptoms(symptoms)
            for sample in aug_samples:
                docs.append(sample)
                labels.append(disease)

    print(f"Dataset augmented to {len(docs)} samples across {len(metadata)} medical conditions.")
    
    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        docs, labels, test_size=0.15, random_state=42, stratify=labels
    )
    
    # Create ML Pipeline with TF-IDF (unigrams & bigrams) + Calibrated Random Forest
    rf = RandomForestClassifier(n_estimators=150, max_depth=25, random_state=42, class_weight='balanced')
    calibrated_rf = CalibratedClassifierCV(rf, cv=3)
    
    model = Pipeline([
        ('vectorizer', TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words='english')),
        ('classifier', calibrated_rf)
    ])
    
    print("Training disease predictor ensemble model...")
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"✅ Disease Model Test Accuracy: {acc * 100:.2f}%")
    
    # Save trained model and metadata
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'backend', 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    joblib.dump(model, os.path.join(model_dir, 'disease_model.pkl'))
    joblib.dump(metadata, os.path.join(model_dir, 'disease_metadata.pkl'))
    
    # Also save to models/ directly if needed
    direct_models_dir = os.path.dirname(__file__)
    joblib.dump(model, os.path.join(direct_models_dir, 'disease_model.pkl'))
    joblib.dump(metadata, os.path.join(direct_models_dir, 'disease_metadata.pkl'))
    
    print("✅ Model trained and saved successfully.")

if __name__ == "__main__":
    train_model()
