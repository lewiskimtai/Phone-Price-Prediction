# Import Libraries
import streamlit as st
st.set_page_config(layout="wide", initial_sidebar_state="expanded", )
import pandas as pd
import numpy as np
import plotly.express as px
import streamlit.components.v1 as components
import requests

# Dataset
url = "phone_df.csv"

# Prediction Function connected to the FAST API
def get_predictions(brand, screen_size, ram, rom, mp, battery):
    url = 'https://phone-price-pred.herokuapp.com/predict?brand={brand}&screen_size={screen_size}&ram={ram}&rom={rom}&mp={mp}&battery={battery}' \
        .format(brand=brand, screen_size=screen_size, ram=ram, rom=rom, mp=mp, battery=battery)
    response = requests.post(url)
    json_response = response.json()
    price=json_response['prediction']
    return price

# Side Bar
st.sidebar.image('logo.png')
st.sidebar.header("Phone Purchase App")
menu = ['Get Price','Exploratory Data Analysis','About']
selection = st.sidebar.selectbox("Key Performance Indicator (KPI) ", menu)

st.sidebar.write('Predicting prices of phones in relation to their specs is helpful to gadget retailers to set prices varying to specs and also helpful to buyers to buy their dream phones with particular specs at affordable prices.')

# Get Price Functionality
if selection == 'Get Price':
    col1, col2 = st.columns(2)
    with col1:
        st.image('phones.jpg')
        st.title('Enter your dream phone features')
        st.image('specs.png')
        brand = st.selectbox('Select Brand', ['Nokia', 'Samsung', 'Infinix', 'Tecno', 'Redmi', 'Itel', 'Vivo', 'Hisence', 'Oppo', 'Motorola', 'Realme'])
        screen_size = st.number_input("Enter screen_size")
        ram = st.number_input("Enter ram")
        rom = st.number_input("Enter rom")
        mp = st.number_input("Enter mp")
        battery = st.number_input("Enter battery")

        result = ""

        # when 'Predict' is clicked, make the prediction and store it
        if st.button("Predict"):
            result = int(np.exp(get_predictions(brand=brand, screen_size=screen_size, ram=ram, rom=rom, mp=mp, battery=battery)))
            st.success(f'Price of Phone  {result}')
            st.image('phoness.jpg')

    with col2:
        st.image('phonesss.jpg')
        
# Exploratory Data Analysis Functionality
if selection == 'Exploratory Data Analysis':    
    phone_df = pd.read_csv(url, encoding="ISO-8859-1", low_memory=False)
    st.markdown('Display data')
    st.table(phone_df.head())

    # scatter plot of brand and price
    st.header("Brand and Price")
    fig = px.scatter(phone_df, x='brand', y='price', opacity = 0.25, template = 'plotly_dark', 
                    color='brand', hover_data=['brand', 'price'],title = 'PHONE PRICE PREDICTION (BRAND - PRICE RELATIONSHIP)')
    fig.update_layout(width=900, height=500)
    st.plotly_chart(fig)

    # scatter plot of screen_size and price
    st.header("Screen size and Price")
    fig = px.scatter(phone_df, x='screen_size', y='price', opacity = 0.25, template = 'plotly_dark', 
                    color='screen_size', hover_data=['screen_size', 'price'],title = 'PHONE PRICE PREDICTION (SCREEN SIZE - PRICE RELATIONSHIP)')
    fig.update_layout(width=900, height=500)
    st.plotly_chart(fig)

    # scatter plot of ram and price
    st.header("RAM and Price")
    fig = px.scatter(phone_df, x='ram', y='price', opacity = 0.25, template = 'plotly_dark', 
                    color='ram', hover_data=['ram', 'price'],title = 'PHONE PRICE PREDICTION (RAM - PRICE RELATIONSHIP)')
    fig.update_layout(width=900, height=500)
    st.plotly_chart(fig)

    # scatter plot of rom and price
    st.header("ROM and Price")
    fig = px.scatter(phone_df, x='rom', y='price', opacity = 0.25, template = 'plotly_dark', 
                    color='rom', hover_data=['rom', 'price'],title = 'PHONE PRICE PREDICTION (ROM - PRICE RELATIONSHIP)')
    fig.update_layout(width=900, height=500)
    st.plotly_chart(fig)

    # scatter plot of mp and price
    st.header("MP and Price")
    fig = px.scatter(phone_df, x='mp', y='price', opacity = 0.25, template = 'plotly_dark', 
                    color='mp', hover_data=['mp', 'price'],title = 'PHONE PRICE PREDICTION (MEGA PIXELS - PRICE RELATIONSHIP)')
    fig.update_layout(width=900, height=500)
    st.plotly_chart(fig)

    # scatter plot of battery and price
    st.header("Battery and Price")
    fig = px.scatter(phone_df, x='battery', y='price', opacity = 0.25, template = 'plotly_dark', 
                    color='battery', hover_data=['battery', 'price'],title = 'PHONE PRICE PREDICTION (BATTERY - PRICE RELATIONSHIP)')
    fig.update_layout(width=900, height=500)
    st.plotly_chart(fig)


