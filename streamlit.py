import streamlit as st
import requests

st.title('Phone Purchase App')


def get_predictions(carat_weight, cut, color, clarity, polish, symmetry, report):
    url = 'https://phone-price-pred.herokuapp.com/predict?brand={brand}&screen_size={screen_size}&ram={ram}&rom={rom}&mp={mp}&battery={battery}' \
        .format(brand=brand, screen_size=screen_size, ram=ram, rom=rom, mp=mp, battery=battery)
    response = requests.post(url)
    json_response = response.json()
    price=json_response['prediction']
    return price


brand = st.number_input("Enter brand")
screen_size = st.text_input("Enter screen_size")
ram = st.text_input("Enter ram")
rom = st.text_input("Enter rom")
mp = st.text_input("Enter mp")
battery = st.text_input("Enter battery")


result = ""

# when 'Predict' is clicked, make the prediction and store it
if st.button("Predict"):
    result= get_predictions(brand=brand, screen_size=screen_size, ram=ram, rom=rom, mp=mp, battery=battery)
    st.success(f'Price of Phone  {result}')