import { Component } from '@angular/core';
import {ChartConfiguration, ChartType} from "chart.js";

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  isGraph:boolean = true;

  toggleView() { this.isGraph = !this.isGraph; }
  // DATI DI TEST
  public barChartType: ChartType = 'bar';

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    // Riempie il contenitore (che ha altezza fissa nel template):
    // così il grafico si ridimensiona in modo stabile anche dopo una navigazione.
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  public barChartData: ChartConfiguration['data'] = {
    labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug'],
    datasets: [
      {
        label: 'Vendite',
        data: [65, 59, 80, 81, 56, 55, 40]
      }
    ]
  };

}