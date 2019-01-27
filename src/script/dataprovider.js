/**
 * DataProvider module
 */
let _preparedData;
import _data from "../data/FAOSTAT_data";

export const DataProvider = {
  getData: function() {
    return _data;
  },
  getPreparedData: function() {
    return _preparedData;
  },
  loadJSON,
  getValue,
  getMaxValue,
  getAverageForRegion,
  getMinValueYear,
  getMaxValueYear,
  getAverageForContinent,
  getValuebyiso
};
/**
 * Make data hierarchical.
 * @param {Object} flatData - The flat data structure.
 * @param {string} key - The key which is used for the hierarchical transformation.
 * @param {string} value - The name of the collection property under which children are stored.
 * @return {Object} The hierarchically prepared data.
 */
function _groupData(flatData, key, value) {
  let result = [];
  let hierarchy = {};

  flatData.forEach(function(node) {
    hierarchy[node[key]] = node;
  });

  Object.keys(hierarchy).forEach(function(root) {
    let parent = {};
    parent[key] = root;
    parent[value] = [];
    flatData.forEach(function(node) {
      if (node[key] === root) {
        parent[value].push(node);
        delete node[key];
      }
    });
    result.push(parent);
  });
  return result;
}

/**
 * Prepare hierarchical data structure with Regions, Areas, and Years.
 * @return {Object} The hierarchically prepared data.
 */
function _prepareData(originalData) {
  let groupRegions = _groupData(originalData, "Region", "Countries");
  groupRegions.forEach(function(region) {
    let groupedCountries = _groupData(region.Countries, "Area", "Years");
    region.Countries = groupedCountries;
    groupedCountries.forEach(function(country) {
      let groupedYears = _groupData(country.Years, "Year", "Properties");
      country.Years = groupedYears;
    });
  });
  return groupRegions;
}

/**
 * Load data.
 * @param {requestCallback} callback - The callback that handles the response.
 */
function loadJSON(callback) {
  _preparedData = _prepareData(_data);
  callback();
}

/**
 * Get a value from the data.
 * @param {string} country - The country in the data.
 * @param {number} year - The year of the parameter.
 * @param {number} code - The numerical code of the parameter (see data source documentation).
 * @return {number} The desired value in the data.
 */
function getValue(country, year, code) {
  let getValueResult = null;
  _data.some(function(item) {
    if (
      item["Area"] === country &&
      item["Year"] === year &&
      item["Item Code"] === code
    ) {
      getValueResult = item["Value"];
      return true;
    }
  });
  return getValueResult;
}

function getValuebyiso(country, year, code) {
    var getValueResult;

    if (code == 210041) {
        var yearInt = parseInt(year,10);
        year = year + "-" + (yearInt+2);
    }

    _data.some(function (item) {
        if (item['iso_a3'] === country && item['Year'] === year && item['Item Code'] === code) {
            getValueResult = item['Value'];
            return true;
        }
    });
    return getValueResult;
}

/**
 * Retrieve maximum value for a given parameter.
 * @param {number} code - The numerical code of the parameter (see data source documentation).
 * @return {Object} Result containing value, year, and country.
 */
function getMaxValue(code) {
  let resultMax = 0;
  let country = "unknown";
  let year = "unknown";
  _data.forEach(function(item) {
    let currentValue = Number.parseFloat(item["Value"]);
    if (item["Item Code"] === code && resultMax < currentValue) {
      resultMax = currentValue;
      country = item["Area"];
      year = item["Year"];
    }
  });
  return {
    value: resultMax,
    year: year,
    country: country
  };
}

/**
 * Computes the average for a region of a specific parameter of a given year
 * @param {string} region - The region in the data.
 * @param {number} year - The year of the parameter.
 * @param {number} code - The numerical code of the parameter (see data source documentation).
 * @return {number} The average value.
 */
function getAverageForRegion(region, year, code) {
    var sumAverage = 0;
    var countAverage = 0;
    _data.forEach(function (item) {
        if (item['subregion'] === region && item['Year'] === year && item['Item Code'] === code && item['Value'] !== undefined) {
            sumAverage += Number.parseFloat(item['Value']);
            countAverage++;
        }
    });
    return sumAverage / countAverage;
}

/**
 * Retrieve minimum value for a given parameter.
 * @param {number} code - The numerical code of the parameter (see data source documentation).
 * @param {number} yearLookUp - The year of the parameter.
 * @return {Object} Result containing value, year, and country.
 */
function getMinValueYear(code, yearLookUp) {
    var resultMin = 100000;
    var country = 'unknown';
    var year = 'unknown';
    _data.forEach(function (item) {
        var currentValue = Number.parseFloat(item['Value']);
        if (item['Item Code'] === code && item['Year'] === yearLookUp &&  currentValue < resultMin) {
            resultMin = currentValue;
            country = item['Area'];
            year = item['Year'];
        }
    });
    //console.log("MIN VALUE "+resultMin);
    return {
        "Value": resultMin,
        "Year": year,
        "Country": country
    };
}

/**
 * Retrieve maximum value for a given parameter.
 * @param {number} code - The numerical code of the parameter (see data source documentation).
 * @param {number} yearLookUp - The year of the parameter.
 * @return {Object} Result containing value, year, and country.
 */
function getMaxValueYear (code, yearLookUp) {
    var resultMax = 0;
    var country = 'unknown';
    var year = 'unknown';
    _data.forEach(function (item) {
        var currentValue = Number.parseFloat(item['Value']);
        if (item['Item Code'] === code && item['Year'] === yearLookUp && resultMax < currentValue) {
            resultMax = currentValue;
            country = item['Area'];
            year = item['Year'];
        }
    });
    //console.log("MAX VALUE "+resultMax);
    return {
        "Value": resultMax,
        "Year": year,
        "Country": country
    };
}

/**
* Computes the average for a continent of a specific parameter of a given year
* @param {string} continent - The continent in the data.
* @param {number} year - The year of the parameter.
* @param {number} code - The numerical code of the parameter (see data source documentation).
* @return {number} The average value.
*/
function getAverageForContinent(continent, year, code) {
   var sumAverage = 0;
   var countAverage = 0;
   //console.log(continent);
   _data.forEach(function (item) {
       if (item['continent'] === continent && item['Year'] === year && item['Item Code'] === code && item['Value'] !== undefined) {
           sumAverage += Number.parseFloat(item['Value']);
           countAverage++;
       }
   });
   return sumAverage / countAverage;
}
