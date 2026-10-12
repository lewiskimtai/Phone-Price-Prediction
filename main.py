# 1. Library imports
import json
from pathlib import Path

import pandas as pd
import numpy as np
import pickle
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

BASE_DIR = Path(__file__).parent

# 2. Create the app object
app = FastAPI()

#. Load Model
loaded_model = pickle.load(open(BASE_DIR / "phone_price_predictor.pkl", "rb"))

# Typical error range saved by phone.ipynb (actual price / predicted price, 10th and 90th percentile)
range_path = BASE_DIR / "price_range.json"
price_range = json.load(open(range_path)) if range_path.exists() else {'low': 0.85, 'high': 1.15}

# Training data, used for the form options and the price ruler
phone_df = pd.read_csv(BASE_DIR / "phone_df.csv")


# Define predict function
@app.post('/predict')
def predict(brand, screen_size, ram, rom, mp, battery, condition, release_year, series, tier):
    data = pd.DataFrame([[brand, screen_size, ram, rom, mp, battery, condition, release_year, series, tier]])
    data.columns = ['brand', 'screen_size', 'ram', 'rom', 'mp', 'battery', 'condition', 'release_year', 'series', 'tier']

    predictions = np.exp(loaded_model.predict(data))
    prediction = int(predictions[0])
    return {'prediction': prediction,
            'low': int(prediction * price_range['low']),
            'high': int(prediction * price_range['high'])}


@app.get('/options')
def options():
    # Every phone on sale; the page narrows its dropdowns to the phones matching the choices so far
    return {'phones': phone_df.to_dict(orient='records')}


# The web page (static/index.html, styles.css, app.js)
app.mount('/static', StaticFiles(directory=BASE_DIR / 'static'), name='static')


@app.get('/')
def home():
    return FileResponse(BASE_DIR / 'static' / 'index.html')


if __name__ == '__main__':
    # Port 8001, so it can run alongside a Django dev server on the default 8000
    uvicorn.run(app, host='127.0.0.1', port=8001)
