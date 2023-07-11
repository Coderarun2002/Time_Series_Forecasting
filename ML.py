from flask import Flask, request, jsonify
import pandas as pd
import json
from flask_cors import CORS
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
from pymongo import MongoClient


app = Flask(__name__)
cors = CORS(app)
# Connect to MongoDB Atlas
client = MongoClient('mongodb+srv://Arunachalam:Arunachalam@cluster0.umxzxzr.mongodb.net/Users?retryWrites=true&w=majority')
db = client['Users']
collection = db['details']

# Route for adding a new user with email and password

@app.route('/details', methods=['POST'])

def signup():
    email = request.json['email']
    password = request.json['password']
    collection.insert_one({'email': email, 'password': password})
    return jsonify({'message': 'User added successfully'}), 200

@app.route('/details',methods=['GET'])
def get_users():
    users = []
    for user in collection.find():
        users.append({
            'email': user['email'],
            'password': user['password']
        })
    return jsonify(users)

@app.route('/predict', methods=['POST'])
def predict():
    numerical_value = int(request.form['numericalValue'])
    periodicity = request.form['periodicity']
    file = request.files['file']
    df = pd.read_csv(file,index_col="Ship_Date", 
                 parse_dates=True, 
                 date_parser=lambda x: pd.to_datetime(x, format='%d-%m-%Y'))

    # Generate a sample DataFrame with dates from 2016 to 2019
    df_sampled = pd.DataFrame({'Ship_Date': pd.date_range(start='2016-01-01', end='2019-12-31', freq='D')})

    # Merge the sampled dataframe with the original dataframe to get the corresponding sales for the sampled dates
    df_sampled = pd.merge(df_sampled, df, on='Ship_Date', how='left')

    # Group by year and month, and select 7 random rows from each group
    '''df_sampled = (df_sampled.groupby([df_sampled['Ship_Date'].dt.year, df_sampled['Ship_Date'].dt.month])
                .apply(lambda x: x.sample(n=28, random_state=random.randint(0, 10000)))
                )'''
    #I am removing the rows which has null values
    df_sampled = df_sampled.dropna()
    df_sampled=df_sampled.drop(['Segment','State','Postal_Code','Region','Category','Sub_Category'],axis=1)
    df_sampled=df_sampled.drop(['Quantity','Discount','Profit'],axis=1)
    # Save the resulting dataframe to a new CSV file
    df_sampled=pd.read_csv('E://Electronic-store-sales-details//Sampled_data.csv', 
                    index_col="Ship_Date")
    sales_data = df_sampled['Sales'].values
    # Apply the ADF test to check for stationarity
    #result = adfuller(sales_data)

    # Use the converted dataframe as input for auto_arima
    #res = pm.auto_arima(df_sampled['Sales'], seasonal=True, m=12, d=1, D=1, information_criterion="bic", trace=True, error_action="ignore", n_fits=100, stepwise=True)
    if(periodicity=="Y"):
        periodicity='MS'
        numerical_value=numerical_value*12
    
    df_sampled.index = pd.to_datetime(df_sampled.index)
    # Resample the DataFrame to periodicity frequency
    df_resampled = df_sampled.resample(periodicity).sum()
    df_resampled.to_csv('E://Electronic-store-sales-details//Resampled_data.csv', index=False)
    # Split the data into train and test sets
    if(periodicity=="MS"):
        train_data = df_resampled.iloc[:-24]
        test_data = df_resampled.iloc[-24:]
        # Concatenate the training and test data
        data = pd.concat([train_data, test_data],axis=0)
        # Fit the SARIMAX model on the concatenated data
        model = SARIMAX(data, order=(1, 1, 0), seasonal_order=(1, 1, 0, 12))
        results = model.fit()
    elif(periodicity=="D"):
        train_data = df_resampled.iloc[:-500]
        test_data = df_resampled.iloc[-500:]
        # Concatenate the training and test data
        data = pd.concat([train_data, test_data],axis=0)
        # Fit the SARIMAX model on the concatenated data
        model = SARIMAX(data, order=(0, 1, 0), seasonal_order=(0, 0, 0, 0))
        results = model.fit()
    elif(periodicity=="QS"):
        train_data = df_resampled.iloc[:-30]
        test_data = df_resampled.iloc[-30:]
        # Concatenate the training and test data
        data = pd.concat([train_data, test_data],axis=0)
        # Fit the SARIMAX model on the concatenated data
        model = SARIMAX(data, order=(1, 0, 0), seasonal_order=(1, 0, 0,4))
        results = model.fit()
        
    


    else:
        train_data = df_resampled.iloc[:-100]
        test_data = df_resampled.iloc[-100:]
        # Concatenate the training and test data
        
        data = pd.concat([train_data, test_data],axis=0)
        # Fit the SARIMAX model on the concatenated data
        model = SARIMAX(data, order=(1, 1, 0), seasonal_order=(1, 1, 0, 7))
        results = model.fit()

    # Generate predictions on the test data
    predictions = results.predict(start=len(train_data), end=len(data)-1, dynamic=False)
    test_data_pred = pd.concat([test_data, predictions.rename('Sales_Pred')], axis=1)

    # Forecast sales for the next 1 year
    last_test_month = test_data_pred.index[-1]
    #forecast_dates = pd.date_range(start=last_test_month, periods=13, freq='MS')
    forecast_index = pd.date_range(start=last_test_month, periods=numerical_value, freq=periodicity)
    forecast_data = pd.DataFrame(forecast_index, columns=['Ship_Date'])
    forecast_data.set_index('Ship_Date', inplace=True)
    forecast = results.forecast(steps=numerical_value)
    forecast_data['Sales_Pred'] = forecast.values
    # Concatenate the test data, predictions, and forecasted data
    #result_data = pd.concat([test_data_pred, forecast_data])

    # Create a DataFrame of the actual, predicted and forecasted values
    sales = pd.DataFrame({'Date': test_data_pred.index.tolist() + forecast_data.index.tolist(),'Actual': test_data_pred['Sales'], 'Predicted': predictions, 'Forecast': forecast})
    sales.to_csv('E://Electronic-store-sales-details//APF.csv', index=False)
    # Create a JSON array containing the actual graph, predicted graph, and forecasted graph
    actual_data = [{'x': str(date)[:10], 'y': int(val)} for date, val in test_data_pred['Sales'].iteritems()]
    predicted_data = [{'x': str(date)[:10], 'y': int(val)} for date, val in predictions.iteritems()]
    forecast_data = [{'x': str(date)[:10], 'y': int(val)} for date, val in forecast.iteritems()]
    #Calculating the metrics
    actual = np.array(test_data_pred['Sales'])
    predicted = np.array(predictions)
    mask = actual != 0
    actual = actual[mask]
    predicted = predicted[mask]
    
    # Mean Absolute Error (MAE)
    global mae
    global mse
    global rmse
    global mape
    global smape
    
    mae = np.mean(np.abs(predicted - actual))

    # Mean Squared Error (MSE)
    mse = np.mean((predicted - actual)**2)

    # Root Mean Squared Error (RMSE)
    rmse = np.sqrt(mse)

    # Mean Absolute Percentage Error (MAPE)
    mape = np.mean(np.abs((actual - predicted) / actual)) * 100

    # Symmetric Mean Absolute Percentage Error (SMAPE)
    smape = np.mean(2.0 * np.abs(predicted - actual) / (np.abs(predicted) + np.abs(actual))) * 100
    # Create a DataFrame with the metrics
    metrics_df = pd.DataFrame({
        'Metric': ['MAE', 'MSE', 'RMSE', 'MAPE', 'SMAPE'],
        'Value': [mae, mse, rmse, mape, smape]
    })

    # Save the DataFrame to a CSV file
    metrics_df.to_csv('E://Electronic-store-sales-details//Metrics.csv', index=False)


    chart_data = json.dumps([{'name': 'Actual', 'data': actual_data},
                             {'name': 'Predicted', 'data': predicted_data},
                             {'name': 'Forecasted', 'data': forecast_data}]
                             )

    

    return chart_data
    

@app.route('/metrics',methods=['GET'])
def metrics():
    metrics_data = json.dumps([
        {'name': 'mae', 'data': mae},
        {'name': 'mse', 'data': mse},
        {'name': 'rmse', 'data': rmse},
        {'name': 'mape', 'data': mape},
        {'name': 'smape', 'data': smape}
    ]
                             )
    return metrics_data
    
    


if __name__ == '__main__':
    app.run(debug=False)
