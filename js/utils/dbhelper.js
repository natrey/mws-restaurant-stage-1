import idb from 'idb';

import { DATABASE, POST_REVIEW_DATABASE, IMAGE } from "./constants";

/**
 * Common database helper functions.
 */
export default class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337;

    return `http://localhost:${port}`;
  }

  /**
   * Open Database
   */
  static openDatabase() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open(DATABASE.NAME, DATABASE.VERSION, function(upgradeDb) {
      const store = upgradeDb.createObjectStore(DATABASE.TABLE, {
        keyPath: 'id'
      });
    });
  }

  /**
   * Open Post Review Database
   */
  static openPostReviewDatabase() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open(POST_REVIEW_DATABASE.NAME, POST_REVIEW_DATABASE.VERSION, function(upgradeDb) {
      const store = upgradeDb.createObjectStore(POST_REVIEW_DATABASE.TABLE, {
        autoIncrement: true,
        keyPath: 'id'
      });
    });
  }

  /**
   * Get cached restaurants
   */
  static getCachedRestaurants() {
    return DBHelper.openDatabase().then(function(db) {
      if (!db) return;

      const store = db.transaction(DATABASE.TABLE)
        .objectStore(DATABASE.TABLE);

      return store.getAll();
    });
  }

  /**
   * Put cached restaurants
   */
  static putCachedRestaurants(restaurants) {
    return DBHelper.openDatabase().then(function(db) {
      if (!db) return;

      const store = db.transaction(DATABASE.TABLE, 'readwrite')
        .objectStore(DATABASE.TABLE);

      restaurants.forEach(function(restaurant) {
        store.put(restaurant);
      });
    });
  }

  /**
   * Get restaurants
   */
  static getRestaurants(callback) {
    return DBHelper.getCachedRestaurants().then(restaurants => {
      return window.navigator.onLine
        ? DBHelper.fetchRestaurants(callback)
        : callback(null, restaurants);
    });
  }

  /**
   * Get cached restaurant
   */
  static getCachedRestaurant(id) {
    return DBHelper.openDatabase().then(function(db) {
      if (!db) return;

      const store = db.transaction(DATABASE.TABLE)
        .objectStore(DATABASE.TABLE);

      return store.get(+id);
    });
  }

  /**
   * Put cached restaurant
   */
  static putCachedRestaurant(restaurant) {
    return DBHelper.openDatabase().then(function(db) {
      if (!db) return;

      const tx = db.transaction(DATABASE.TABLE, 'readwrite');
      const store = tx.objectStore(DATABASE.TABLE);

      store.put(restaurant);

      return tx.complete;
    });
  }

  /**
   * Get restaurant
   */
  static getRestaurantById(id, callback) {
    return DBHelper.getCachedRestaurant(id).then(restaurant => {

      return window.navigator.onLine
        ? DBHelper.fetchRestaurantById(id, callback)
        : callback(null, restaurant);
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants`)
      .then(res => res.json())
      .then(restaurants => {
        this.putCachedRestaurants(restaurants);

        return callback(null, restaurants);
      })
      .catch(error => {
        const errorMsg = (`Request failed. Returned status of ${error}`);
        return callback(errorMsg, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`)
      .then(res => res.json())
      .then(restaurant => {
        this.putCachedRestaurant(restaurant);

        return callback(null, restaurant);
      })
      .catch(error => {
        const errorMsg = (`Request failed. Returned status of ${error}`);
        return callback(errorMsg, null);
      });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;

        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Fetch all favorite restaurants.
   */
  static fetchFavoriteRestaurants(callback) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/?is_favorite=true`)
      .then(res => res.json())
      .then(restaurants => {
        // this.putCachedRestaurant(restaurant);

        // return callback(null, restaurants);
      })
      .catch(error => {
        const errorMsg = (`Request failed. Returned status of ${error}`);
        return callback(errorMsg, null);
      });
  }

  /**
   * Put favorite restaurant by id.
   */
  static putFavoriteRestaurant(id, callback) {
    return DBHelper.getRestaurantById(id, (error, restaurant) => {
      const isFavorite = restaurant.is_favorite === 'true';

      fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=${!isFavorite}`, {
        method: 'PUT'
      })
        .then(res => res.json())
        .then(restaurant => {
          this.putCachedRestaurant(restaurant);

          return callback(null, restaurant);
        })
        .catch(error => {
          const errorMsg = (`Request failed. Returned status of ${error}`);
          return callback(errorMsg, null);
        });
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Fetch restaurant reviews.
   */
  static fetchRestaurantReviews(id, callback) {
    return fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`)
      .then(res => res.json())
      .then(reviews => {

        return callback(null, reviews);
      })
      .catch(error => {
        const errorMsg = (`Request failed. Returned status of ${error}`);
        return callback(errorMsg, null);
      });
  }

  /**
   * Add a restaurant review.
   */
  static postRestaurantReview(data, callback) {
    return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(review => {

        return callback(null, review);
      })
      .catch(error => {
        if (!navigator.onLine) {
          this.cacheRestaurantReview(data, callback);
        }
        const errorMsg = (`Request failed. Returned status of ${error}`);
        return callback(errorMsg, null);
      });
  }

  /**
   * Cache restaurant review.
   */
  static cacheRestaurantReview(data, callback) {
    DBHelper.openPostReviewDatabase().then(function(db) {
      if (!db) return;

      const tx = db.transaction(POST_REVIEW_DATABASE.TABLE, 'readwrite');
      const store = tx.objectStore(POST_REVIEW_DATABASE.TABLE);

      store.put(data);

      return tx.complete;
    }).then(() => {
      window.addEventListener('online', this.postCachedRestaurantReview.bind(this, callback));
    });
  }

  /**
   * Post restaurant review from cache.
   */
  static postCachedRestaurantReview(callback) {
    return DBHelper.openPostReviewDatabase().then(function(db) {
      if (!db) return;

      const index = db.transaction(POST_REVIEW_DATABASE.TABLE)
        .objectStore(POST_REVIEW_DATABASE.TABLE);

      return index.getAll();
    }).then(reviews => {
      return Promise.all(reviews.map(review => {
        return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
          method: 'POST',
          body: JSON.stringify(review)
        })
        .then(res => res.json())
        .then(review => {
          window.removeEventListener('online', this.postCachedRestaurantReview);

          DBHelper.openPostReviewDatabase().then(function(db) {
            if (!db) return;

            const tx = db.transaction(POST_REVIEW_DATABASE.TABLE, 'readwrite');
            const store =  tx.objectStore(POST_REVIEW_DATABASE.TABLE);

            store.delete(review.id);

            return tx.complete;
          });

          return callback(null, review);
        });
      }));
    });
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  static adaptiveImageForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}_${IMAGE.SMALL_WIDTH}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }
}
