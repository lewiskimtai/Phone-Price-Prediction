# Phone Price Prediction.

## Problem Statement.
Not everyone who wants to buy a phone knows or is familiar with phone specifications and they often get confused on which phone is the best and how much it costs.
There are very many brands of phones in the market today and these brands come with different specifications such as screen size, RAM, ROM, battery capacity. These specifications brand inculsive determine how much a phone will cost.

## Project Breakdown.
This project comprises of four code file:

- #### jumia_webscrapper.ipynb 
    - Scrapes data about phones sold on jumia website ["https://www.jumia.ug/smartphones/"] and saves into [Phones.csv] 
    - It loads that data and removes any discrepancies making the data clean and saves it in [phone_df.csv].

- #### phone.ipynb 
    -  Loads the data from [phone_df.csv] and does the Exploratory Data Analysis on the data.
    -  Data preprocessing steps(Handling outliers, Target and Category encoding and scaling)
    - Fits and trains the data on mulitple algorithms (ElasticNetCV, DecisionTreeRegressor, BaggingRegressor, AdaBoostRegressor,                
       KNeighborsRegressor, LinearRegression, GradientBoostingRegressor) and finds the best algorithm as GradientBoostingRegressor.
    - Saves the model into the [phone_price_prediction.pkl] file.

- #### main.py 
    - Loads the model and uses FASTAPI to create an API hosted on Heroku. 
    - Manages requests and makes predictions based on the parameters.

- #### streamlit.py 
    - The API endpoint that comprises of the User Interface in Streamlit.
    - Takes in user inputs and passes the values through the API and makes predictions.
    - Also comprises of the Exploratory Data Analysis functionality that is a dashboard for the user to visualize the data.

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