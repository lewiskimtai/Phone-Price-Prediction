# 1. Library imports
import pandas as pd
import pickle
from fastapi import FastAPI
import uvicorn

# 2. Create the app object
app = FastAPI()

#. Load Model
loaded_model = pickle.load(open("phone_price_predictor.pkl", "rb"))

# Define predict function
@app.post('/predict')
def predict(brand, screen_size, ram, rom, mp, battery):
    data = pd.DataFrame([[brand, screen_size, ram, rom, mp, battery]])
    data.columns = ['brand', 'screen_size', 'ram', 'rom', 'mp', 'battery']

    predictions = loaded_model.predict(data) 
    return {'prediction': int(predictions[0])}

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8000)