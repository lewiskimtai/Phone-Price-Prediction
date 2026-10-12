# Phone Price Prediction.
# Project Link
https://lewiskimtai-phone-price-prediction-streamlit-yq0390.streamlit.app/

## Problem Statement.
Not everyone who wants to buy a phone knows or is familiar with phone specifications and they often get confused on which phone is the best and how much it costs.
There are very many brands of phones in the market today and these brands come with different specifications such as screen size, RAM, ROM, battery capacity. These specifications brand inculsive determine how much a phone will cost.

## Project Breakdown.
This project comprises of four code file:

- #### jumia_webscrapper.ipynb 
    - Scrapes data about phones sold on MobileShop Uganda ["https://mobileshop.ug/category/mobile-phones"] and saves into [Phones.csv] 
    - Scrapes Dondolo ["https://dondolo.co.ug/product-category/smartphones/"] and saves into [Phones_dondolo.csv]; each shop has its own file, so rerunning one scraper never touches the other shop's data
    - It loads that data and removes any discrepancies making the data clean and saves it in [phone_df.csv].

- #### phone.ipynb 
    -  Loads the data from [phone_df.csv] and does the Exploratory Data Analysis on the data.
    -  Data preprocessing steps(Handling outliers, Target and Category encoding and scaling)
    - Fits and trains the data on mulitple algorithms (ElasticNetCV, DecisionTreeRegressor, BaggingRegressor, AdaBoostRegressor,                
       KNeighborsRegressor, LinearRegression, GradientBoostingRegressor) and finds the best algorithm as GradientBoostingRegressor.
    - Saves the model into the [phone_price_prediction.pkl] file.

- #### main.py 
    - Loads the model and uses FastAPI to serve the web page and the API.
    - `/predict` returns the estimated price and its likely range (from [price_range.json], saved by phone.ipynb).
    - `/options` gives the page its brands, product lines, tiers, typical specs and the shop listings.

- #### static/ (index.html, styles.css, app.js)
    - The user interface, in plain HTML, CSS and JavaScript.
    - Takes in the phone's details, shows a live price estimate and places it on a price ruler of every phone on sale.

## Run the app
```sh
venv\Scripts\activate
python main.py
```
Then open http://127.0.0.1:8001. The app uses port 8001 so it can run alongside a Django dev server on 8000.

## Tools used:
As seen in the [requirements.txt] file
-   DecisionTree==3.4.3
-   fastapi==0.89.1
-   gunicorn==20.1.0
-   linear-regression==0.1
-   matplotlib==3.5.1
-   matplotlib-inline==0.1.3
-   numpy==1.22.3
-   pandas==1.4.3
-   pickleshare==0.7.5
-   plotly==5.10.0
-   polynomial-regression==0.0.2
-   requests==2.27.1
-   scikit-learn==1.1.3
-   scipy==1.9.1
-   seaborn==0.11.2
-   statsmodels==0.13.2
-   stepwise-regression==1.0.3
-   streamlit==1.12.2
-   support-vector-machine==0.0.0
-   uvicorn==0.20.0

### Create a virtual environment
1. Install virtualenv:
```sh
pip install virtualenv
``` 
2. Create a virtualenv using the following command:
 ```sh
virtualenv env
```
3. To activate the environment you must be in the directory where the environment was created
 ```sh
cd env
```
then
 ```sh
Scripts\activate 
```
4. Install dependancies.
 ```sh
pip install -r requirements. txt
```