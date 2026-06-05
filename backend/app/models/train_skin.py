import os
import shutil
import glob
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam

def organize_dataset(source_dir, dest_dir):
    print("Organizing dataset...")
    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir)
    
    classes = ['Healthy', 'Acne_Mild', 'Acne_Severe', 'Rosacea_Other']
    for c in classes:
        os.makedirs(os.path.join(dest_dir, c), exist_ok=True)
    
    files = glob.glob(os.path.join(source_dir, '*.*'))
    for f in files:
        fname = os.path.basename(f).lower()
        if 'levle0' in fname or '0_' in fname or 'ok' in fname:
            cls = 'Healthy'
        elif 'levle1' in fname or 'levle2' in fname or 'mild' in fname:
            cls = 'Acne_Mild'
        elif 'levle3' in fname or 'cystic' in fname or 'nodular' in fname or 'severe' in fname:
            cls = 'Acne_Severe'
        elif 'rosacea' in fname or 'perioral' in fname or 'vascular' in fname:
            cls = 'Rosacea_Other'
        else:
            cls = 'Acne_Mild' # fallback

        shutil.copy(f, os.path.join(dest_dir, cls, fname))
    
    print("Dataset organized into classes:")
    for c in classes:
        print(f" - {c}: {len(os.listdir(os.path.join(dest_dir, c)))} images")

def train_model(dataset_dir, model_save_path):
    print("Preparing training data...")
    datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2, # 20% validation
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True
    )

    train_generator = datagen.flow_from_directory(
        dataset_dir,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        subset='training'
    )

    val_generator = datagen.flow_from_directory(
        dataset_dir,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        subset='validation'
    )

    print("Building MobileNetV2 model...")
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False # Freeze base

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.5)(x)
    predictions = Dense(train_generator.num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)
    
    model.compile(optimizer=Adam(learning_rate=0.001), 
                  loss='categorical_crossentropy', 
                  metrics=['accuracy'])

    print("Training model...")
    model.fit(
        train_generator,
        epochs=3, # Kept short for quick proof of concept, can be increased
        validation_data=val_generator
    )

    # Save class indices
    import json
    with open(model_save_path.replace('.h5', '_classes.json'), 'w') as f:
        json.dump(train_generator.class_indices, f)

    model.save(model_save_path)
    print(f"Model saved to {model_save_path}")

if __name__ == "__main__":
    SOURCE = r"c:\Users\prash\OneDrive\Desktop\fy project\acne"
    DEST = r"c:\Users\prash\OneDrive\Desktop\fy project\smart-health-assistant\backend\app\models\skin_dataset_organized"
    MODEL_PATH = r"c:\Users\prash\OneDrive\Desktop\fy project\smart-health-assistant\backend\app\models\skin_model.h5"
    
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    
    organize_dataset(SOURCE, DEST)
    train_model(DEST, MODEL_PATH)
