// When user selects a region
document.getElementById("region").addEventListener("change", function() {
  alert("Region changed to: " + this.value);
});

// When user selects a date
document.getElementById("dateRange").addEventListener("change", function() {
  alert("Date selected: " + this.value);
});
