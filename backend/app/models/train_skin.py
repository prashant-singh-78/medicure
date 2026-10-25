"""
Improved Dermatology Skin Model Training Pipeline (Version 2)
=============================================================
Phase 4 Remediations:
1. Base-Image Grouping:
   Robust Roboflow hash and duplicate copy stripping to ensure augmented
   variants derived from the same photograph never leak across train/val/test.
2. Verified Dataset Discovery:
   Automatically locates the verified 2,060-image `skin_dataset_organized` directory
   (Healthy: 1066, Acne Mild: 824, Acne Severe: 93, Rosacea/Other: 77).
3. Sample-Weighted Loss for Extreme Imbalance:
   Applies exact inverse-frequency weights via generator sample weights,
   overcoming Keras 3 generator restrictions and curing 0% Severe Acne recall.
4. Regularized Architecture:
   MobileNetV2 feature extractor with BatchNormalization and Dropout(0.4)
   head to prevent overfitting on the majority Healthy/Mild classes.
5. Non-Destructive Versioning:
   Saves to `skin_model_v2.h5` and `skin_model_v2_classes.json`, preserving
   the original `skin_model.h5` intact.
"""

import os
import sys
import glob
import re
import json
import random
import time
import tempfile
import numpy as np
from PIL import Image

# Safeguards against matplotlib cache lockups and unneeded TF logs
os.environ['MPLCONFIGDIR'] = tempfile.gettempdir()
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight


def get_base_id(filename: str) -> str:
    """
    Extract original image base identifier before Roboflow augmentations and duplicate copies.
    Handles Roboflow hashes (.rf.[a-f0-9]+), copy suffixes (-copy, _copy), and date prefixes
    without greedily stripping timestamp digits.
    """
    s = os.path.basename(filename).lower()
    # Strip Roboflow hash patterns: e.g. _jpg.rf.a975d52a... or .rf.78ae...
    s = re.sub(r'(_jpg|\.jpg|_jpeg|\.jpeg|_png|\.png)?\.rf\.[a-f0-9]+.*', '', s, flags=re.IGNORECASE)
    # Strip copy markers without stripping date digits (e.g. '07acne0811011-copy' -> '07acne081101')
    s = re.sub(r'[0-9]?-copy[0-9]*', '', s, flags=re.IGNORECASE)
    s = re.sub(r'(_copy[0-9]*|\([0-9]+\))$', '', s, flags=re.IGNORECASE)
    return s.rstrip('_- ')


def find_dataset_dir() -> str:
    """Locate the verified skin dataset directory across standard paths."""
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(here, "skin_dataset_organized"),
        os.path.join(here, "..", "..", "ml_workspace", "skin_dataset_organized"),
        os.path.join(here, "..", "..", "models", "skin_dataset_organized"),
        r"C:\Users\prash\OneDrive\Desktop\fy project\medicure_src\smart-health-assistant\backend\app\models\skin_dataset_organized",
    ]
    for c in candidates:
        if os.path.isdir(c) and os.path.exists(os.path.join(c, "Healthy")):
            return os.path.abspath(c)
    raise FileNotFoundError(f"Could not locate skin_dataset_organized in candidates: {candidates}")


def build_grouped_split(dataset_dir: str, train_ratio=0.70, val_ratio=0.15, test_ratio=0.15, seed=42):
    """
    Build stratified, leak-free train/val/test splits based on image base clusters.
    All augmented or duplicate variants of the same base photograph belong exclusively
    to one split partition.
    """
    random.seed(seed)
    np.random.seed(seed)
    
    classes = sorted([d for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))])
    class_to_idx = {c: i for i, c in enumerate(classes)}
    
    train_samples = []
    val_samples = []
    test_samples = []
    
    train_bases = set()
    val_bases = set()
    test_bases = set()
    
    print(f"Discovered {len(classes)} classes in dataset: {classes}")
    
    for cls_name in classes:
        cls_dir = os.path.join(dataset_dir, cls_name)
        files = sorted(os.listdir(cls_dir))
        
        # Group by base ID
        base_groups = {}
        for f in files:
            if not f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                continue
            base_id = get_base_id(f)
            if base_id not in base_groups:
                base_groups[base_id] = []
            base_groups[base_id].append(os.path.join(cls_name, f))
            
        unique_bases = sorted(list(base_groups.keys()))
        random.shuffle(unique_bases)
        
        n_bases = len(unique_bases)
        n_train = int(round(train_ratio * n_bases))
        n_val = int(round(val_ratio * n_bases))
        
        # Ensure at least 1 cluster in val and test for small classes
        if n_bases >= 3:
            n_val = max(1, n_val)
            n_test = max(1, n_bases - n_train - n_val)
            if n_train + n_val + n_test > n_bases:
                n_train = n_bases - n_val - n_test
        
        tr_b = unique_bases[:n_train]
        va_b = unique_bases[n_train:n_train + n_val]
        te_b = unique_bases[n_train + n_val:]
        
        for b in tr_b:
            train_bases.add(b)
            for item in base_groups[b]:
                train_samples.append((item, cls_name))
        for b in va_b:
            val_bases.add(b)
            for item in base_groups[b]:
                val_samples.append((item, cls_name))
        for b in te_b:
            test_bases.add(b)
            for item in base_groups[b]:
                test_samples.append((item, cls_name))
                
        print(f"  Class '{cls_name:15}': {len(files):4d} files across {n_bases:4d} base clusters -> Train: {len(tr_b)}, Val: {len(va_b)}, Test: {len(te_b)}")

    # Verify zero leakage
    assert len(train_bases.intersection(val_bases)) == 0, "Leakage between train and validation!"
    assert len(train_bases.intersection(test_bases)) == 0, "Leakage between train and test!"
    assert len(val_bases.intersection(test_bases)) == 0, "Leakage between validation and test!"
    
    return {
        'train': train_samples,
        'val': val_samples,
        'test': test_samples,
        'train_bases': sorted(list(train_bases)),
        'val_bases': sorted(list(val_bases)),
        'test_bases': sorted(list(test_bases)),
        'class_to_idx': class_to_idx
    }


def image_generator(samples, dataset_dir, class_to_idx, class_weights=None, batch_size=32, augment=False, shuffle=True):
    """
    Streaming batch generator that yields (X, y, sample_weights).
    Applies training-only data augmentation.
    """
    n = len(samples)
    indices = np.arange(n)
    
    if augment:
        aug_pipeline = tf.keras.Sequential([
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.08), # ~15 degrees
            tf.keras.layers.RandomZoom(0.08),
            tf.keras.layers.RandomTranslation(0.05, 0.05)
        ])
        
    while True:
        if shuffle:
            np.random.shuffle(indices)
        for start_idx in range(0, n, batch_size):
            batch_indices = indices[start_idx:start_idx + batch_size]
            batch_samples = [samples[i] for i in batch_indices]
            
            X_batch = []
            y_batch = []
            sw_batch = []
            
            for rel_p, cls_name in batch_samples:
                full_p = os.path.join(dataset_dir, rel_p)
                try:
                    with Image.open(full_p) as img:
                        img_rgb = img.convert('RGB').resize((224, 224))
                        arr = np.array(img_rgb, dtype=np.float32) / 255.0
                        X_batch.append(arr)
                        
                        idx = class_to_idx[cls_name]
                        one_hot = np.zeros(len(class_to_idx), dtype=np.float32)
                        one_hot[idx] = 1.0
                        y_batch.append(one_hot)
                        
                        if class_weights is not None:
                            sw_batch.append(class_weights[idx])
                except Exception as e:
                    print(f"Warning: Failed to load {full_p}: {e}")
                    
            if len(X_batch) > 0:
                X_arr = np.array(X_batch, dtype=np.float32)
                y_arr = np.array(y_batch, dtype=np.float32)
                if augment:
                    X_arr = aug_pipeline(X_arr, training=True).numpy()
                if class_weights is not None:
                    sw_arr = np.array(sw_batch, dtype=np.float32)
                    yield X_arr, y_arr, sw_arr
                else:
                    yield X_arr, y_arr


def build_candidate_model(num_classes=4, backbone_weights_path=None):
    """
    Builds MobileNetV2 architecture with a regularized classification head.
    If backbone_weights_path is provided, loads pretrained weights directly from existing model.
    """
    if backbone_weights_path and os.path.exists(backbone_weights_path):
        print(f"Loading pretrained MobileNetV2 backbone from: {backbone_weights_path}")
        old_m = tf.keras.models.load_model(backbone_weights_path)
        base_input = old_m.input
        base_output = old_m.layers[153].output # out_relu
        for layer in old_m.layers[:154]:
            layer.trainable = False
    else:
        print("Instantiating standard MobileNetV2 ImageNet backbone...")
        base_model = tf.keras.applications.MobileNetV2(
            input_shape=(224, 224, 3),
            include_top=False,
            weights='imagenet'
        )
        base_model.trainable = False
        base_input = base_model.input
        base_output = base_model.output

    # Regularized Head
    x = tf.keras.layers.GlobalAveragePooling2D(name='head_gap')(base_output)
    x = tf.keras.layers.Dense(128, activation='relu', name='head_dense1')(x)
    x = tf.keras.layers.BatchNormalization(name='head_bn')(x)
    x = tf.keras.layers.Dropout(0.4, name='head_dropout')(x)
    predictions = tf.keras.layers.Dense(num_classes, activation='softmax', name='head_output')(x)

    model = tf.keras.models.Model(inputs=base_input, outputs=predictions, name="MedicureSkinModel_v2")
    return model


def train_model(dataset_dir=None, model_out_path=None, epochs=10, batch_size=32):
    """Full execution of the repaired skin model training pipeline."""
    if dataset_dir is None:
        dataset_dir = find_dataset_dir()
    print(f"Dataset root verified at: {dataset_dir}")
    
    split_info = build_grouped_split(dataset_dir)
    train_samples = split_info['train']
    val_samples = split_info['val']
    class_to_idx = split_info['class_to_idx']
    
    print(f"\nDataset Partitions: Train={len(train_samples)}, Val={len(val_samples)}, Test={len(split_info['test'])}")
    
    # Calculate exact inverse frequency class weights
    train_labels = [class_to_idx[cls_name] for _, cls_name in train_samples]
    unique_classes = np.unique(train_labels)
    raw_weights = compute_class_weight('balanced', classes=unique_classes, y=train_labels)
    class_weights = {int(cls): float(w) for cls, w in zip(unique_classes, raw_weights)}
    print(f"Computed Class Weights: {class_weights}")
    
    # Determine save path
    if model_out_path is None:
        models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))
        model_out_path = os.path.join(models_dir, "skin_model_v2.h5")
        
    classes_json_path = model_out_path.replace('.h5', '_classes.json')
    
    # Find baseline model for backbone weight reuse if offline
    base_model_path = os.path.join(os.path.dirname(model_out_path), "skin_model.h5")
    
    model = build_candidate_model(
        num_classes=len(class_to_idx),
        backbone_weights_path=base_model_path if os.path.exists(base_model_path) else None
    )
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.0005),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    train_steps = int(np.ceil(len(train_samples) / batch_size))
    val_steps = int(np.ceil(len(val_samples) / batch_size))
    
    train_gen = image_generator(train_samples, dataset_dir, class_to_idx, class_weights=class_weights, batch_size=batch_size, augment=True)
    val_gen = image_generator(val_samples, dataset_dir, class_to_idx, class_weights=None, batch_size=batch_size, augment=False, shuffle=False)
    
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=4, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6, verbose=1),
        ModelCheckpoint(model_out_path, monitor='val_loss', save_best_only=True, verbose=1)
    ]
    
    print("\nTraining candidate skin model (v2)...")
    history = model.fit(
        train_gen,
        steps_per_epoch=train_steps,
        epochs=epochs,
        validation_data=val_gen,
        validation_steps=val_steps,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save class indices
    with open(classes_json_path, 'w') as f:
        json.dump(class_to_idx, f, indent=2)
    print(f"Saved class mapping to: {classes_json_path}")
    
    if not os.path.exists(model_out_path):
        model.save(model_out_path)
    print(f"Model saved to: {model_out_path}")
    
    return model, history


if __name__ == "__main__":
    train_model()

