/**
 * Create an object composed of the picked object properties
 * @param {Object} object - The source object
 * @param {string[]} keys - The property keys to pick
 * @returns {Object} - New object with only the picked properties
 */
const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

module.exports = pick;



