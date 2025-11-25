const wasteChartEl = document.getElementById("waste-chart");
const sensorChartEl = document.getElementById("sensor-chart");

if (wasteChartEl && typeof ApexCharts !== 'undefined') {
  const analytics = JSON.parse(wasteChartEl.dataset.analytics);

  // Collect all unique waste types
  const wasteTypes = [...new Set(analytics.map(item => item.waste_type))];

  // Aggregate counts per date per waste type
  const countsByType = {};

  wasteTypes.forEach(type => {
    countsByType[type] = {};
  });

  analytics.forEach(item => {
    const date = new Date(item.date_added).toLocaleDateString(); // "MM/DD/YYYY"
    if (!countsByType[item.waste_type][date]) countsByType[item.waste_type][date] = 0;
    countsByType[item.waste_type][date]++;
  });

  // Get all dates sorted
  const allDates = [...new Set(analytics.map(item => new Date(item.date_added).toLocaleDateString()))]
    .sort((a, b) => new Date(a) - new Date(b));

  // Build series data
  const series = wasteTypes.map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    data: allDates.map(date => countsByType[type][date] || 0),
  }));

  const options = {
    chart: {
      height: "350px",
      maxWidth: "100%",
      type: "area",
      fontFamily: "Inter, sans-serif",
      dropShadow: { enabled: false },
      toolbar: { show: false },
    },
    tooltip: { enabled: true, x: { show: false } },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.55, opacityTo: 0, shade: "#1C64F2" },
    },
    dataLabels: { enabled: false },
    stroke: { width: 3 },
    grid: { show: false, strokeDashArray: 4, padding: { left: 2, right: 2, top: 0 } },
    series: series,
    xaxis: { categories: allDates, labels: { show: true }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { show: true },
  };

  const chart = new ApexCharts(wasteChartEl, options);
  chart.render();
}

if (sensorChartEl && typeof ApexCharts !== 'undefined') {
  let analytics = JSON.parse(sensorChartEl.dataset.analytics);

  // Only keep sensor IDs 1, 2, and 3
  const allowedSensorIds = ['1', '2', '3'];
  analytics = analytics.filter(item => allowedSensorIds.includes(item.sensor_id));

  // Map sensor IDs to waste types
  const sensorMap = {
    '1': 'Biodegradable',
    '2': 'Non-biodegradable',
    '3': 'Recyclable'
  };

  // Helper: group by date and waste type
  const grouped = {};

  analytics.forEach(item => {
    const date = new Date(item.date_added).toISOString().split('T')[0]; // YYYY-MM-DD
    const type = sensorMap[item.sensor_id];
    const level = parseFloat(item.level);

    if (!grouped[date]) grouped[date] = { 'Biodegradable': 0, 'Non-biodegradable': 0, 'Recyclable': 0 };
    grouped[date][type] += level;
  });

  // Convert grouped object into series for ApexCharts
  const dates = Object.keys(grouped).sort(); // x-axis labels

  const series = Object.keys(sensorMap).map(sensorId => {
    const type = sensorMap[sensorId];
    return {
      name: type,
      data: dates.map(date => grouped[date][type] || 0)
    };
  });

  const options = {
    chart: {
      type: 'bar',
      height: 350,
      fontFamily: "Inter, sans-serif",
      toolbar: { show: false }
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '70%', borderRadius: 8 }
    },
    dataLabels: { enabled: false },
    legend: { show: true },
    xaxis: {
      categories: dates,
      labels: {
        style: { fontFamily: "Inter, sans-serif" }
      }
    },
    yaxis: { title: { text: 'Level' } },
    fill: { opacity: 1 },
    series: series
  };

  const chart = new ApexCharts(sensorChartEl, options);
  chart.render();
}



