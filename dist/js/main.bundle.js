(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var _dbhelper = require('./utils/dbhelper');

var _dbhelper2 = _interopRequireDefault(_dbhelper);

var _constants = require('./utils/constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var restaurants = void 0,
    neighborhoods = void 0,
    cuisines = void 0;
var map;
var markers = [];

/**
 * Service worker registration
 */
var registerServiceWorker = function registerServiceWorker() {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('sw.js').then(function (reg) {
    console.log('Registration worked!');
  }).catch(function (err) {
    console.log('Registration failed!');
  });
};

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', function (event) {
  registerServiceWorker();
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
var fetchNeighborhoods = function fetchNeighborhoods() {
  _dbhelper2.default.fetchNeighborhoods(function (error, neighborhoods) {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
var fillNeighborhoodsHTML = function fillNeighborhoodsHTML() {
  var neighborhoods = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.neighborhoods;

  var select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(function (neighborhood) {
    var option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
var fetchCuisines = function fetchCuisines() {
  _dbhelper2.default.fetchCuisines(function (error, cuisines) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
var fillCuisinesHTML = function fillCuisinesHTML() {
  var cuisines = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.cuisines;

  var select = document.getElementById('cuisines-select');

  cuisines.forEach(function (cuisine) {
    var option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = function () {
  var loc = {
    lat: 40.722216,
    lng: -73.987501
  };

  self.map = new google.maps.Map(document.querySelector('.map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
var updateRestaurants = function updateRestaurants() {
  var cSelect = document.getElementById('cuisines-select');
  var nSelect = document.getElementById('neighborhoods-select');

  var cIndex = cSelect.selectedIndex;
  var nIndex = nSelect.selectedIndex;

  var cuisine = cSelect[cIndex].value;
  var neighborhood = nSelect[nIndex].value;

  _dbhelper2.default.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, function (error, restaurants) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
var resetRestaurants = function resetRestaurants(restaurants) {
  // Remove all restaurants
  self.restaurants = [];
  var ul = document.querySelector('.restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers && !!self.markers.length) {
    self.markers.forEach(function (m) {
      return m.setMap(null);
    });
  }

  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
var fillRestaurantsHTML = function fillRestaurantsHTML() {
  var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

  var ul = document.querySelector('.restaurants-list');
  restaurants.forEach(function (restaurant) {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
var createRestaurantHTML = function createRestaurantHTML(restaurant) {
  var li = document.createElement('li');
  var thumb = document.createElement('div');
  thumb.className = 'restaurants-list__thumb';
  li.append(thumb);

  var image = document.createElement('img');
  image.className = 'restaurants-list__img';
  image.src = _dbhelper2.default.imageUrlForRestaurant(restaurant);
  image.alt = 'Interior design of ' + restaurant.name + ' Restaurant.';

  image.srcset = _dbhelper2.default.adaptiveImageForRestaurant(restaurant) + (' ' + _constants.IMAGE.SMALL_WIDTH);
  image.sizes = _constants.IMAGE.SIZES;

  var picture = document.createElement('picture');
  picture.append(image);
  thumb.append(picture);

  var name = document.createElement('h3');
  name.className = 'restaurants-list__title';
  name.innerHTML = restaurant.name;
  thumb.append(name);

  var neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  thumb.append(neighborhood);

  var address = document.createElement('p');
  address.innerHTML = restaurant.address;
  thumb.append(address);

  var actionPanel = document.createElement('div');
  actionPanel.className = 'restaurants-list__action-panel';
  thumb.append(actionPanel);

  var more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = _dbhelper2.default.urlForRestaurant(restaurant);
  more.setAttribute('role', 'button');
  actionPanel.append(more);

  var favoriteButton = document.createElement('button');
  favoriteButton.setAttribute('aria-label', 'toggle favorite');
  favoriteButton.className = 'restaurants-list__favorite-button';

  if (restaurant.is_favorite === 'true') {
    favoriteButton.classList.add('restaurants-list__favorite-button_filled');
  }

  actionPanel.append(favoriteButton);

  favoriteButton.onclick = function () {
    _dbhelper2.default.putFavoriteRestaurant(restaurant.id, function (error, restaurant) {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        favoriteButton.classList.toggle('restaurants-list__favorite-button_filled');
      }
    });
  };

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
var addMarkersToMap = function addMarkersToMap() {
  var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

  restaurants.forEach(function (restaurant) {
    // Add marker to the map
    var marker = _dbhelper2.default.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', function () {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};

},{"./utils/constants":2,"./utils/dbhelper":3}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var IMAGE = exports.IMAGE = {
  SIZES: '100vw',
  SMALL_WIDTH: '500w'
};

var DATABASE = exports.DATABASE = {
  NAME: 'restaurant-reviews-app',
  VERSION: 1,
  TABLE: 'restaurants'
};

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _idb = require('idb');

var _idb2 = _interopRequireDefault(_idb);

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Common database helper functions.
 */
var DBHelper = function () {
  function DBHelper() {
    _classCallCheck(this, DBHelper);
  }

  _createClass(DBHelper, null, [{
    key: 'openDatabase',


    /**
     * Open Database
     */
    value: function openDatabase() {
      if (!navigator.serviceWorker) {
        return Promise.resolve();
      }

      return _idb2.default.open(_constants.DATABASE.NAME, _constants.DATABASE.VERSION, function (upgradeDb) {
        var store = upgradeDb.createObjectStore(_constants.DATABASE.TABLE, {
          keyPath: 'id'
        });
      });
    }

    /**
     * Get cached restaurants
     */

  }, {
    key: 'getCachedRestaurants',
    value: function getCachedRestaurants() {
      return DBHelper.openDatabase().then(function (db) {
        if (!db) return;

        var index = db.transaction(_constants.DATABASE.TABLE).objectStore(_constants.DATABASE.TABLE);

        return index.getAll();
      });
    }

    /**
     * Put cached restaurants
     */

  }, {
    key: 'putCachedRestaurants',
    value: function putCachedRestaurants(restaurants) {
      return DBHelper.openDatabase().then(function (db) {
        if (!db) return;

        var tx = db.transaction(_constants.DATABASE.TABLE, 'readwrite');
        var store = tx.objectStore(_constants.DATABASE.TABLE);
        restaurants.forEach(function (restaurant) {
          store.put(restaurant);
        });
      });
    }

    /**
     * Get restaurants
     */

  }, {
    key: 'getRestaurants',
    value: function getRestaurants(callback) {
      return DBHelper.getCachedRestaurants().then(function (restaurants) {
        return !!restaurants.length ? callback(null, restaurants) : DBHelper.fetchRestaurants(callback);
      });
    }

    /**
     * Get cached restaurant
     */

  }, {
    key: 'getCachedRestaurant',
    value: function getCachedRestaurant(id) {
      return DBHelper.openDatabase().then(function (db) {
        if (!db) return;

        var index = db.transaction(_constants.DATABASE.TABLE).objectStore(_constants.DATABASE.TABLE);

        return index.get(id);
      });
    }

    /**
     * Put cached restaurant
     */

  }, {
    key: 'putCachedRestaurant',
    value: function putCachedRestaurant(restaurant) {
      return DBHelper.openDatabase().then(function (db) {
        if (!db) return;

        var tx = db.transaction(_constants.DATABASE.TABLE, 'readwrite');
        var store = tx.objectStore(_constants.DATABASE.TABLE);

        store.put(restaurant);

        return tx.complete;
      });
    }

    /**
     * Get restaurant
     */

  }, {
    key: 'getRestaurantById',
    value: function getRestaurantById(id, callback) {
      return DBHelper.getCachedRestaurant(id).then(function (restaurant) {
        return !!restaurant ? callback(null, restaurant) : DBHelper.fetchRestaurantById(id, callback);
      });
    }

    /**
     * Fetch all restaurants.
     */

  }, {
    key: 'fetchRestaurants',
    value: function fetchRestaurants(callback) {
      var _this = this;

      fetch(DBHelper.DATABASE_URL + '/restaurants').then(function (res) {
        return res.json();
      }).then(function (restaurants) {
        _this.putCachedRestaurants(restaurants);

        return callback(null, restaurants);
      }).catch(function (error) {
        var errorMsg = 'Request failed. Returned status of ' + error;
        return callback(errorMsg, null);
      });
    }

    /**
     * Fetch a restaurant by its ID.
     */

  }, {
    key: 'fetchRestaurantById',
    value: function fetchRestaurantById(id, callback) {
      var _this2 = this;

      fetch(DBHelper.DATABASE_URL + '/restaurants/' + id).then(function (res) {
        return res.json();
      }).then(function (restaurant) {
        _this2.putCachedRestaurant(restaurant);

        return callback(null, restaurant);
      }).catch(function (error) {
        var errorMsg = 'Request failed. Returned status of ' + error;
        return callback(errorMsg, null);
      });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisine',
    value: function fetchRestaurantByCuisine(cuisine, callback) {
      // Fetch all restaurants  with proper error handling
      DBHelper.getRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given cuisine type
          var results = restaurants.filter(function (r) {
            return r.cuisine_type == cuisine;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByNeighborhood',
    value: function fetchRestaurantByNeighborhood(neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.getRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given neighborhood
          var results = restaurants.filter(function (r) {
            return r.neighborhood == neighborhood;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisineAndNeighborhood',
    value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.getRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var results = restaurants;

          if (cuisine != 'all') {
            // filter by cuisine
            results = results.filter(function (r) {
              return r.cuisine_type == cuisine;
            });
          }
          if (neighborhood != 'all') {
            // filter by neighborhood
            results = results.filter(function (r) {
              return r.neighborhood == neighborhood;
            });
          }
          callback(null, results);
        }
      });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */

  }, {
    key: 'fetchNeighborhoods',
    value: function fetchNeighborhoods(callback) {
      // Fetch all restaurants
      DBHelper.getRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all neighborhoods from all restaurants
          var neighborhoods = restaurants.map(function (v, i) {
            return restaurants[i].neighborhood;
          });
          // Remove duplicates from neighborhoods
          var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
            return neighborhoods.indexOf(v) == i;
          });
          callback(null, uniqueNeighborhoods);
        }
      });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */

  }, {
    key: 'fetchCuisines',
    value: function fetchCuisines(callback) {
      // Fetch all restaurants
      DBHelper.getRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all cuisines from all restaurants
          var cuisines = restaurants.map(function (v, i) {
            return restaurants[i].cuisine_type;
          });
          // Remove duplicates from cuisines
          var uniqueCuisines = cuisines.filter(function (v, i) {
            return cuisines.indexOf(v) == i;
          });
          callback(null, uniqueCuisines);
        }
      });
    }

    /**
     * Fetch all favorite restaurants.
     */

  }, {
    key: 'fetchFavoriteRestaurants',
    value: function fetchFavoriteRestaurants(callback) {
      fetch(DBHelper.DATABASE_URL + '/restaurants/?is_favorite=true').then(function (res) {
        return res.json();
      }).then(function (restaurants) {
        console.log(restaurants);
        // this.putCachedRestaurant(restaurant);

        // return callback(null, restaurants);
      }).catch(function (error) {
        var errorMsg = 'Request failed. Returned status of ' + error;
        return callback(errorMsg, null);
      });
    }

    /**
     * Put favorite restaurant by id.
     */

  }, {
    key: 'putFavoriteRestaurant',
    value: function putFavoriteRestaurant(id, callback) {
      var _this3 = this;

      return DBHelper.getRestaurantById(id, function (error, restaurant) {
        var isFavorite = restaurant.is_favorite === 'true';

        fetch(DBHelper.DATABASE_URL + '/restaurants/' + id + '/?is_favorite=' + !isFavorite, {
          method: 'PUT'
        }).then(function (res) {
          return res.json();
        }).then(function (restaurant) {
          _this3.putCachedRestaurant(restaurant);

          return callback(null, restaurant);
        }).catch(function (error) {
          var errorMsg = 'Request failed. Returned status of ' + error;
          return callback(errorMsg, null);
        });
      });
    }

    /**
     * Restaurant page URL.
     */

  }, {
    key: 'urlForRestaurant',
    value: function urlForRestaurant(restaurant) {
      return './restaurant.html?id=' + restaurant.id;
    }

    /**
     * Fetch restaurant reviews.
     */

  }, {
    key: 'fetchRestaurantReviews',
    value: function fetchRestaurantReviews(id, callback) {
      return fetch(DBHelper.DATABASE_URL + '/reviews/?restaurant_id=' + id).then(function (res) {
        return res.json();
      }).then(function (reviews) {

        return callback(null, reviews);
      }).catch(function (error) {
        var errorMsg = 'Request failed. Returned status of ' + error;
        return callback(errorMsg, null);
      });
    }

    /**
     * Restaurant image URL.
     */

  }, {
    key: 'imageUrlForRestaurant',
    value: function imageUrlForRestaurant(restaurant) {
      return '/img/' + restaurant.photograph + '.jpg';
    }
  }, {
    key: 'adaptiveImageForRestaurant',
    value: function adaptiveImageForRestaurant(restaurant) {
      return '/img/' + restaurant.photograph + '_' + _constants.IMAGE.SMALL_WIDTH + '.jpg';
    }

    /**
     * Map marker for a restaurant.
     */

  }, {
    key: 'mapMarkerForRestaurant',
    value: function mapMarkerForRestaurant(restaurant, map) {
      var marker = new google.maps.Marker({
        position: restaurant.latlng,
        title: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
        map: map,
        animation: google.maps.Animation.DROP });
      return marker;
    }
  }, {
    key: 'DATABASE_URL',


    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    get: function get() {
      var port = 1337;

      return 'http://localhost:' + port;
    }
  }]);

  return DBHelper;
}();

exports.default = DBHelper;

},{"./constants":2,"idb":4}],4:[function(require,module,exports){
'use strict';

(function() {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function(resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }

  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function(value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function(prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function() {
          return this[targetProp][prop];
        },
        set: function(val) {
          this[targetProp][prop] = val;
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, '_index', [
    'name',
    'keyPath',
    'multiEntry',
    'unique'
  ]);

  proxyRequestMethods(Index, '_index', IDBIndex, [
    'get',
    'getKey',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(Index, '_index', IDBIndex, [
    'openCursor',
    'openKeyCursor'
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, '_cursor', [
    'direction',
    'key',
    'primaryKey',
    'value'
  ]);

  proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
    'update',
    'delete'
  ]);

  // proxy 'next' methods
  ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function() {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function() {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function(value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function() {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function() {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, '_store', [
    'name',
    'keyPath',
    'indexNames',
    'autoIncrement'
  ]);

  proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'put',
    'add',
    'delete',
    'clear',
    'get',
    'getAll',
    'getKey',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'openCursor',
    'openKeyCursor'
  ]);

  proxyMethods(ObjectStore, '_store', IDBObjectStore, [
    'deleteIndex'
  ]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function(resolve, reject) {
      idbTransaction.oncomplete = function() {
        resolve();
      };
      idbTransaction.onerror = function() {
        reject(idbTransaction.error);
      };
      idbTransaction.onabort = function() {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function() {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, '_tx', [
    'objectStoreNames',
    'mode'
  ]);

  proxyMethods(Transaction, '_tx', IDBTransaction, [
    'abort'
  ]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function() {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(UpgradeDB, '_db', IDBDatabase, [
    'deleteObjectStore',
    'close'
  ]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function() {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(DB, '_db', IDBDatabase, [
    'close'
  ]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
    [ObjectStore, Index].forEach(function(Constructor) {
      // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
      if (!(funcName in Constructor.prototype)) return;

      Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var nativeObject = this._store || this._index;
        var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
        request.onsuccess = function() {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function(Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function(query, count) {
      var instance = this;
      var items = [];

      return new Promise(function(resolve) {
        instance.iterateCursor(query, function(cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      if (request) {
        request.onupgradeneeded = function(event) {
          if (upgradeCallback) {
            upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
          }
        };
      }

      return p.then(function(db) {
        return new DB(db);
      });
    },
    delete: function(name) {
      return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = exp;
    module.exports.default = module.exports;
  }
  else {
    self.idb = exp;
  }
}());

},{}]},{},[1]);
