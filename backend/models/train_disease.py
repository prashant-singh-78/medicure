import csv
import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline

def train_model():
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'Desease dataset.csv')
    
    docs = []
    labels = []
    metadata = {}
    
    with open(dataset_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            disease = row['Desease list'].strip()
            # Combine all 5 symptoms into a single string for TF-IDF
            symptoms = [
                row['Symptom 1'], row['Symptom 2'], row['Symptom 3'], 
                row['Symptom 4'], row['Symptom 5']
            ]
            symptoms_text = " ".join([s.strip().lower() for s in symptoms if s.strip()])
            
            docs.append(symptoms_text)
            labels.append(disease)
            
            metadata[disease] = {
                "tests": [row['Test 1'].strip(), row['Test 2'].strip()],
                "consultant": row['Consultant'].strip()
            }
            
    # Create an ML Pipeline: Text Vectorizer -> Random Forest
    model = Pipeline([
        ('vectorizer', TfidfVectorizer()),
        ('classifier', RandomForestClassifier(n_estimators=50, random_state=42))
    ])
    
    model.fit(docs, labels)
    
    os.makedirs(os.path.dirname(__file__), exist_ok=True)
    
    # Save the trained model and metadata
    joblib.dump(model, os.path.join(os.path.dirname(__file__), 'disease_model.pkl'))
    joblib.dump(metadata, os.path.join(os.path.dirname(__file__), 'disease_metadata.pkl'))
    
    print("Model trained and saved successfully.")

if __name__ == "__main__":
    train_model()
