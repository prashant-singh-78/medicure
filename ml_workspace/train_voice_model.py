"""
Enhanced Voice Disease Detection ML Training Script with Group-Aware Validation
================================================================================
Dataset: UCI Parkinson's Disease (195 phonation recordings from 32 subjects)
Model:   Random Forest + Gradient Boosting ensemble
Validation: GroupKFold grouped strictly by patient ID (prevents cross-recording leakage)

Non-negotiable rule: Original models are NOT overwritten; saves to voice_model_v2.pkl.
"""

import os, sys, urllib.request
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold, GroupKFold
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, roc_auc_score

# Config
DATA_URL  = "https://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/parkinsons.data"
DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "parkinsons.data")
MODEL_OUT = os.path.join(os.path.dirname(__file__), "../backend/models/voice_model_v2.pkl")
PLOT_OUT  = os.path.join(os.path.dirname(__file__), "confusion_matrix_grouped.png")


def download():
    if not os.path.exists(DATA_FILE):
        print("📥 Downloading Parkinson's dataset from UCI...")
        try:
            os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
            urllib.request.urlretrieve(DATA_URL, DATA_FILE)
            print(f"✅ Saved: {DATA_FILE}")
        except Exception as e:
            print(f"❌ Download failed: {e}")
            raise
    return pd.read_csv(DATA_FILE)


def train_model(df):
    # Extract subject ID from name: 'phon_R01_S01_1' -> 'S01'
    df['subject_id'] = df['name'].apply(lambda x: x.split('_')[2] if '_' in x else x)
    unique_subjects = df['subject_id'].nunique()

    X = df.drop(columns=["name", "status", "subject_id"]).values
    y = df["status"].values
    groups = df["subject_id"].values

    print(f"\n📊 Dataset: {len(df)} samples across {unique_subjects} distinct patients | Parkinson's: {np.sum(y)} | Healthy: {np.sum(y==0)}")

    # Ensemble: Random Forest + Gradient Boosting
    rf  = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42, class_weight='balanced')
    gb  = GradientBoostingClassifier(n_estimators=150, learning_rate=0.1, max_depth=4, random_state=42)
    ensemble = VotingClassifier(estimators=[('rf', rf), ('gb', gb)], voting='soft')

    pipeline = Pipeline([('scaler', StandardScaler()), ('clf', ensemble)])

    # 1. Subject-Grouped Cross-Validation (Prevents data leakage across recordings)
    print("\n🔍 Running GroupKFold (5-fold) grouped strictly by patient ID...")
    gkf = GroupKFold(n_splits=5)
    gkf_scores = cross_val_score(pipeline, X, y, cv=gkf, groups=groups, scoring='accuracy')
    print(f"✅ Subject-Grouped 5-Fold Accuracy: {gkf_scores.mean()*100:.2f}% ± {gkf_scores.std()*100:.2f}%")

    # 2. Naive Stratified K-Fold (for diagnostic comparison)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    skf_scores = cross_val_score(pipeline, X, y, cv=skf, scoring='accuracy')
    print(f"⚠️ Naive Random 5-Fold Accuracy (with patient leakage): {skf_scores.mean()*100:.2f}% ± {skf_scores.std()*100:.2f}%")
    print(f"📉 Leakage Inflation Delta: +{(skf_scores.mean() - gkf_scores.mean())*100:.2f}%")

    # Fit pipeline on all data for standalone export
    print("\n🚀 Training model on full dataset...")
    pipeline.fit(X, y)

    return pipeline, gkf_scores.mean()


if __name__ == "__main__":
    df = download()
    pipeline, score = train_model(df)
    os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
    # Save as separate version to protect original checkpoint
    joblib.dump(pipeline, MODEL_OUT)
    print(f"\n✅ Evaluated model saved as separate version: {MODEL_OUT}")
    print(f"🎉 GroupKFold Validation Score: {score*100:.2f}%")
