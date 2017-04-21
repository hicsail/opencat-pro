'use strict';


var algorithm = {};

(function () {
  /**
   * Calculates and returns score
   */

  algorithm.calculateScore = function (callback) {
    callback([2,3]);
  };

})();

if (typeof module === 'object' && module.exports) {
  module.exports = algorithm;
}
