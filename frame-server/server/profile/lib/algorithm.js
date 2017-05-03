'use strict';


var algorithm = {};

(function () {
  /**
   * Calculates and returns score. This should be enhanced and custom defined for each project.
   */

  algorithm.calculateScore = function (callback) {
    callback([2,3]);
  };

})();

if (typeof module === 'object' && module.exports) {
  module.exports = algorithm;
}
