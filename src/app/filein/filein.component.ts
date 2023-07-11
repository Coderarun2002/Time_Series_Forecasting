import { Component, ViewChild, ElementRef } from '@angular/core';
declare const require: any;
const Highcharts = require('highcharts');

import { HttpClient } from '@angular/common/http';
import * as moment from 'moment'; // Import Moment.js

@Component({
  selector: 'app-filein',
  templateUrl: './filein.component.html',
  styleUrls: ['./filein.component.css']
})
export class FileinComponent {
  chartId = 'myChart';
  selectedFile: File;
  message: string;
  numericalValue: number;
  periodicity: string;
  metrics: any[];
  
  @ViewChild('chartContainer') chartContainer: ElementRef;

  constructor(private http: HttpClient ) {}
  

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  generatePlot() {
    if (!this.selectedFile) {
      console.log('No file selected.');
      return;
    }
    
    const formData = new FormData();
    formData.append('numericalValue', String(this.numericalValue));
    formData.append('periodicity', this.periodicity);

    formData.append('file', this.selectedFile, this.selectedFile.name);
  
    this.http.post('http://localhost:5000/predict', formData, { responseType: 'text' }).subscribe(
      (response: any) => {
        console.log(response);
  
        const data = JSON.parse(response);
        if (!Array.isArray(data)) {
          console.error('Data is not an array.');
          return;
        }
  
        // Convert the date strings to recognized format
        data.forEach(({data}) => {
          data.forEach((point) => {
            point.x = moment(point.x, 'YYYY-MM-DD').toDate();
          });
        });
  
        // Extract the x and y data points for each line
        const sortByX = (a, b) => a.x - b.x;
        const actualData = data.find(({ name }) => name === 'Actual').data.sort(sortByX);
        const predictedData = data.find(({ name }) => name === 'Predicted').data.sort(sortByX);
        const forecastedData = data.find(({ name }) => name === 'Forecasted').data.sort(sortByX);
        
  
        this.http.get<any[]>('http://localhost:5000/metrics').subscribe(data => {
      this.metrics = data;});
        /*this.MAE = data.find(({ name }) => name === 'MAE').data;
        this.MSE = data.find(({ name }) => name === 'MSE').data;
        this.RMSE = data.find(({ name }) => name === 'RMSE').data;
        this.MAPE = data.find(({ name }) => name === 'MAPE').data;
        this.SMAPE = data.find(({ name }) => name === 'SMAPE').data;
        console.log(this.MAE)*/
        // Check that Highcharts has been loaded before creating the chart
        if (typeof Highcharts === 'undefined') {
          console.error('Highcharts not found.');
          return;
        }
  
        // Check that the chartContainer element has been loaded
        const chartContainer = document.getElementById(this.chartId);
        console.log(this.chartId)
      if (chartContainer) {
        const chart = Highcharts.chart(chartContainer, {
            chart: {
              type: 'spline',
              //backgroundColor: '#FFFFFF'
            },
            title: {
              text: 'Time Series Forecasting',
              
            },
            legend: {
              enabled: true,
              align:'right',
              verticalAlign: 'middle',
              itemStyle: {
                color: '#000000',
                fontWeight: 'bold'
              }
            },
            xAxis: {
              type: 'datetime',
              
              title: {
                text: 'Date',
              },
            },
            yAxis: {
              title: {
                text: 'Sales',
               
              },
              
             
              
            },
            /*tooltip: {
              shared: true,
              xDateFormat: '%Y-%m-%d',
              backgroundColor: '#FFFFFF',
              borderColor: '#000000',
              style: {
                color: '#000000'
              }
            },*/
            series: [
              {
                name: 'Actual',
                data:actualData,
                color: 'red',
              
                marker: {
                  enabled: false
              }
              },
              {
                name: 'Predicted',
                data: predictedData,
                color: 'blue',
                marker: {
                  enabled: false
              }
              },
              {
                name: 'Forecasted',
                data: forecastedData,
                color: 'green',
                dashStyle: 'ShortDash',
                marker: {
                  enabled: false
              }

              },
              
            ]
          });
        } else {
          console.error('chartContainer element not found.');
        }
      },
      (error) => console.log(error)
    );
  }
}