import streamlit as st
import requests

st.title('Phone Purchase App')


def get_predictions(brand, screen_size, ram, rom, mp, battery):
    url = 'https://phone-price-pred.herokuapp.com/predict?brand={brand}&screen_size={screen_size}&ram={ram}&rom={rom}&mp={mp}&battery={battery}' \
        .format(brand=brand, screen_size=screen_size, ram=ram, rom=rom, mp=mp, battery=battery)
    response = requests.post(url)
    json_response = response.json()
    price=json_response['prediction']
    return price


brand = st.text_input("Enter brand")
screen_size = st.number_input("Enter screen_size")
ram = st.number_input("Enter ram")
rom = st.number_input("Enter rom")
mp = st.number_input("Enter mp")
battery = st.number_input("Enter battery")


result = ""

# when 'Predict' is clicked, make the prediction and store it
if st.button("Predict"):
    result= get_predictions(brand=brand, screen_size=screen_size, ram=ram, rom=rom, mp=mp, battery=battery)
    st.success(f'Price of Phone  {result}')