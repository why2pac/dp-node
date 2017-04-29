module.exports = function(array, idx) {
    if (typeof(array) != 'object' || idx < 0 || idx >= array.length) {
        return null;
    }

    return array[idx];
}
