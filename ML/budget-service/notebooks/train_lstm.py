"""LSTM Budget Prediction Training - Exports to ONNX for Node.js"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import json
import os

SEQUENCE_LENGTH = 6
EPOCHS = 50
BATCH_SIZE = 32
LEARNING_RATE = 0.001
MODEL_DIR = "../models"


class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size=64, num_layers=2, dropout=0.2):
        super(LSTMModel, self).__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        return self.fc(lstm_out[:, -1, :])


def load_and_preprocess_data():
    print("Loading dataset...")
    df = pd.read_csv("../data/dataset.csv")
    print(f"Dataset shape: {df.shape}")

    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['user_id', 'date'])

    features = [
        'monthly_income', 'monthly_expense_total', 'savings_rate',
        'credit_score', 'debt_to_income_ratio',
        'discretionary_spending', 'essential_spending'
    ]
    target = 'monthly_expense_total'

    df['category_encoded'] = LabelEncoder().fit_transform(df['category'])
    df['scenario_encoded'] = LabelEncoder().fit_transform(df['financial_scenario'])
    features.extend(['category_encoded', 'scenario_encoded'])

    return df, features, target


def create_sequences(df, features, target, sequence_length):
    print("Creating sequences...")
    X, y = [], []

    for user_id in df['user_id'].unique():
        user_data = df[df['user_id'] == user_id].sort_values('date')
        if len(user_data) < sequence_length + 1:
            continue

        feature_data = user_data[features].values
        target_data = user_data[target].values

        for i in range(len(user_data) - sequence_length):
            X.append(feature_data[i:i + sequence_length])
            y.append(target_data[i + sequence_length])

    X, y = np.array(X), np.array(y)
    print(f"Created {len(X)} sequences")
    return X, y


def scale_data(X, y):
    n_samples, seq_len, n_features = X.shape
    X_reshaped = X.reshape(-1, n_features)

    scaler_X = MinMaxScaler()
    X_scaled = scaler_X.fit_transform(X_reshaped).reshape(n_samples, seq_len, n_features)

    scaler_y = MinMaxScaler()
    y_scaled = scaler_y.fit_transform(y.reshape(-1, 1)).flatten()

    return X_scaled, y_scaled, scaler_X, scaler_y


def train_model(model, train_loader, val_loader, epochs, device):
    print("Training model...")
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)

    best_val_loss = float('inf')
    patience, patience_counter = 5, 0

    for epoch in range(epochs):
        model.train()
        train_loss = 0
        for X, y in train_loader:
            X, y = X.to(device), y.to(device)
            optimizer.zero_grad()
            loss = criterion(model(X).squeeze(), y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
        train_loss /= len(train_loader)

        model.eval()
        val_loss = 0
        with torch.no_grad():
            for X, y in val_loader:
                X, y = X.to(device), y.to(device)
                val_loss += criterion(model(X).squeeze(), y).item()
        val_loss /= len(val_loader)

        print(f"Epoch {epoch+1}/{epochs} - Train: {train_loss:.6f}, Val: {val_loss:.6f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            torch.save(model.state_dict(), os.path.join(MODEL_DIR, 'best_checkpoint.pt'))
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping at epoch {epoch+1}")
                break

    model.load_state_dict(torch.load(os.path.join(MODEL_DIR, 'best_checkpoint.pt')))
    return model


def evaluate_model(model, test_loader, scaler_y, device):
    print("Evaluating...")
    model.eval()
    preds, actuals = [], []

    with torch.no_grad():
        for X, y in test_loader:
            preds.extend(model(X.to(device)).cpu().numpy().flatten())
            actuals.extend(y.numpy())

    y_pred = scaler_y.inverse_transform(np.array(preds).reshape(-1, 1)).flatten()
    y_true = scaler_y.inverse_transform(np.array(actuals).reshape(-1, 1)).flatten()

    mae = np.mean(np.abs(y_true - y_pred))
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    print(f"MAE: ₹{mae:.2f}, MAPE: {mape:.2f}%")


def export_to_onnx(model, input_size, device):
    """Export PyTorch model to ONNX format"""
    print("Exporting to ONNX...")
    model.eval()
    
    dummy_input = torch.randn(1, SEQUENCE_LENGTH, input_size).to(device)
    onnx_path = os.path.join(MODEL_DIR, 'budget_lstm.onnx')
    
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    print(f"ONNX model saved to: {onnx_path}")


def save_scalers_json(scaler_X, scaler_y):
    """Save scalers as JSON for Node.js"""
    scalers_data = {
        'scaler_X': {
            'min': scaler_X.data_min_.tolist(),
            'max': scaler_X.data_max_.tolist(),
            'scale': scaler_X.scale_.tolist(),
            'data_range': scaler_X.data_range_.tolist()
        },
        'scaler_y': {
            'min': float(scaler_y.data_min_[0]),
            'max': float(scaler_y.data_max_[0]),
            'scale': float(scaler_y.scale_[0]),
            'data_range': float(scaler_y.data_range_[0])
        },
        'config': {
            'sequence_length': SEQUENCE_LENGTH,
            'input_size': 9
        }
    }
    
    json_path = os.path.join(MODEL_DIR, 'scalers.json')
    with open(json_path, 'w') as f:
        json.dump(scalers_data, f, indent=2)
    print(f"Scalers saved to: {json_path}")


def cleanup():
    """Remove intermediate files"""
    checkpoint = os.path.join(MODEL_DIR, 'best_checkpoint.pt')
    if os.path.exists(checkpoint):
        os.remove(checkpoint)


def main():
    print("=" * 50)
    print("LSTM Budget Prediction Training (ONNX Export)")
    print("=" * 50)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    df, features, target = load_and_preprocess_data()
    X, y = create_sequences(df, features, target, SEQUENCE_LENGTH)
    X_scaled, y_scaled, scaler_X, scaler_y = scale_data(X, y)

    X_train, X_temp, y_train, y_temp = train_test_split(X_scaled, y_scaled, test_size=0.3, random_state=42)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)

    train_loader = DataLoader(TensorDataset(torch.FloatTensor(X_train), torch.FloatTensor(y_train)),
                              batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(TensorDataset(torch.FloatTensor(X_val), torch.FloatTensor(y_val)), batch_size=BATCH_SIZE)
    test_loader = DataLoader(TensorDataset(torch.FloatTensor(X_test), torch.FloatTensor(y_test)), batch_size=BATCH_SIZE)

    os.makedirs(MODEL_DIR, exist_ok=True)
    input_size = len(features)
    model = LSTMModel(input_size=input_size).to(device)
    model = train_model(model, train_loader, val_loader, EPOCHS, device)
    evaluate_model(model, test_loader, scaler_y, device)
    
    # Export to ONNX and save scalers as JSON
    export_to_onnx(model, input_size, device)
    save_scalers_json(scaler_X, scaler_y)
    cleanup()

    print("=" * 50)
    print("Training complete! Files exported:")
    print("  - models/budget_lstm.onnx")
    print("  - models/scalers.json")
    print("=" * 50)


if __name__ == "__main__":
    main()
