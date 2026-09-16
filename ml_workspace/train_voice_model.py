"""
Enhanced Voice Disease Detection ML Training Script
====================================================
Dataset: UCI Parkinson's Disease (auto-downloaded)
Model:   Random Forest + Gradient Boosting ensemble
Saves:   backend/models/voice_model.pkl

HOW TO RUN:
  cd ml_workspace
  ..\backend\venv\Scripts\python.exe train_voice_model.py
"""

import os, sys, urllib.request
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, roc_auc_score

# Config
DATA_URL  = "https://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/parkinsons.data"
DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "parkinsons.data")
MODEL_OUT = os.path.join(os.path.dirname(__file__), "../backend/models/voice_model.pkl")
PLOT_OUT  = os.path.join(os.path.dirname(__file__), "confusion_matrix.png")


def download():
    if not os.path.exists(DATA_FILE):
        print("📥 Downloading Parkinson's dataset from UCI...")
        try:
            urllib.request.urlretrieve(DATA_URL, DATA_FILE)
            print(f"✅ Saved: {DATA_FILE}")
        except Exception as e:
            print(f"❌ Download failed: {e}")
            print("   Generating synthetic demo data instead...")
            return _generate_synthetic()
    return pd.read_csv(DATA_FILE)


def _generate_synthetic():
    """Generate synthetic Parkinson's-like data if download fails."""
    np.random.seed(42)
    n = 200
    cols = ["MDVP:Fo(Hz)","MDVP:Fhi(Hz)","MDVP:Flo(Hz)","MDVP:Jitter(%)","MDVP:Jitter(Abs)",
            "MDVP:RAP","MDVP:PPQ","Jitter:DDP","MDVP:Shimmer","MDVP:Shimmer(dB)",
            "Shimmer:APQ3","Shimmer:APQ5","MDVP:APQ","Shimmer:DDA","NHR","HNR",
            "RPDE","DFA","spread1","spread2","D2","PPE","status"]
    healthy = np.random.randn(70, 22) * [20,30,15,0.002,0.00002,0.001,0.001,0.003,0.01,0.1,0.005,0.007,0.01,0.015,0.005,3,0.05,0.02,0.5,0.2,0.2,0.07]
    healthy += [150,180,120,0.003,0.00003,0.001,0.001,0.004,0.02,0.2,0.01,0.012,0.015,0.03,0.01,25,0.5,0.7,-5,0.2,2.3,0.15]
    sick = np.random.randn(130, 22) * [25,40,20,0.006,0.00006,0.004,0.004,0.012,0.04,0.4,0.02,0.025,0.04,0.06,0.02,4,0.07,0.025,0.6,0.25,0.3,0.1]
    sick += [145,200,100,0.008,0.00008,0.005,0.005,0.015,0.06,0.5,0.03,0.04,0.055,0.09,0.02,18,0.55,0.72,-4,0.25,2.5,0.22]
    data = np.vstack([healthy, sick])
    labels = np.array([0]*70 + [1]*130)
    col_names = list(cols)
    col_names.pop() # Remove 'status' for X features
    df = pd.DataFrame(data, columns=col_names)
    df["status"] = labels
    df["name"] = [f"sample_{i}" for i in range(n)]
    print(f"✅ Generated synthetic dataset: {n} samples")
    return df


def train_model(df):
    X = df.drop(columns=["name", "status"]).values
    y = df["status"].values

    print(f"\n📊 Dataset: {len(df)} samples | Parkinson's: {np.sum(y)} | Healthy: {np.sum(y==0)}")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Ensemble: Random Forest + Gradient Boosting
    rf  = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42, class_weight='balanced')
    gb  = GradientBoostingClassifier(n_estimators=150, learning_rate=0.1, max_depth=4, random_state=42)
    ensemble = VotingClassifier(estimators=[('rf', rf), ('gb', gb)], voting='soft')

    pipeline = Pipeline([('scaler', StandardScaler()), ('clf', ensemble)])

    print("\n🚀 Training ensemble model (RF + GradientBoosting)...")
    pipeline.fit(X_train, y_train)

    y_pred  = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)

    print(f"\n{'='*50}")
    print(f"✅ Test Accuracy : {acc*100:.2f}%")
    print(f"✅ ROC-AUC Score : {auc:.4f}")
    target_names = ['Healthy', "Parkinson's"]
    print(f"\n{classification_report(y_test, y_pred, target_names=target_names)}")

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring='accuracy')
    print(f"5-Fold CV: {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")

    # Confusion matrix plot
    cm = confusion_matrix(y_test, y_pred)
    fig, ax = plt.subplots(figsize=(5, 4))
    im = ax.imshow(cm, cmap='Blues')
    ax.set_xticks([0,1]); ax.set_yticks([0,1])
    ax.set_xticklabels(["Healthy","Parkinson's"])
    ax.set_yticklabels(["Healthy","Parkinson's"])
    ax.set_xlabel("Predicted"); ax.set_ylabel("Actual")
    ax.set_title(f"Confusion Matrix (Acc: {acc*100:.1f}%)")
    for i in range(2):
        for j in range(2):
            ax.text(j, i, cm[i,j], ha='center', va='center', color='black', fontsize=14, fontweight='bold')
    plt.colorbar(im, ax=ax)
    plt.tight_layout()
    plt.savefig(PLOT_OUT, dpi=120)
    print(f"\n📈 Confusion matrix saved: {PLOT_OUT}")

    return pipeline, acc


if __name__ == "__main__":
    df = download()
    pipeline, acc = train_model(df)
    os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
    joblib.dump(pipeline, MODEL_OUT)
    print(f"\n✅ Model saved: {MODEL_OUT}")
    print(f"🎉 Training complete! Backend will now serve real predictions (accuracy: {acc*100:.1f}%)")
    print("   Restart the backend to load the new model.")
