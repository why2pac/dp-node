module.exports = function(array, idx) {
  if (!array || typeof(array) != 'object' || idx < 0 || idx >= array.length) {
    return null;
  }

  return array[idx];
}
