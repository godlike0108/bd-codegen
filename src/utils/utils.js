// Filters
// add comma to number
function addComma (value) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default {
  addComma,
}